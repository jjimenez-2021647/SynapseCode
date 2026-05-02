import Subscription from './subscription.model.js';
import Plan from '../plans/plan.model.js';
import { sendFreePlanEmail, sendPaymentConfirmationEmail, sendParticipantInvitationEmail } from '../../helpers/email-service.js';
import { createStripeCheckoutSession } from '../../helpers/stripe-service.js';
import { updateUserPlan } from '../../helpers/auth-service-bridge.js';
import { addParticipantToORG } from '../../helpers/participants-org.js';

export const getCurrentSubscription = async (req, res) => {
  try {
    const { userId } = req;

    const subscription = await Subscription.findOne({ userId }).populate('planId');

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'Sin suscripción activa',
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener suscripción',
    });
  }
};

export const selectPlan = async (req, res) => {
  try {
    const { userId } = req;
    const { planName, email, name, institutionName, carnets, maxParticipants } = req.body;

    if (!planName || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos faltantes',
      });
    }

    // Validar que el plan exista
    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    // Si es plan FREE
    if (planName === 'FREE') {
      const subscription = await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          planId: plan._id,
          planName: 'FREE',
          status: 'active',
          startDate: new Date(),
          paymentMethod: 'manual',
        },
        { upsert: true, new: true }
      );

      // Enviar email de plan gratuito
      await sendFreePlanEmail(email, name);

      // Actualizar user en AuthService
      await updateUserPlan(userId, 'FREE', req.get('x-token') || req.get('Authorization')?.replace('Bearer ', ''));

      return res.json({
        success: true,
        message: 'Plan FREE seleccionado',
        data: subscription,
      });
    }

    // Para PRO y ORG, crear sesión de checkout
    if (planName === 'PRO' || planName === 'ORG') {
      // Validaciones para ORG
      let pendingCarnets = [];
      if (planName === 'ORG') {
        if (!institutionName) {
          return res.status(400).json({
            success: false,
            message: 'institutionName es requerido para plan ORG',
          });
        }

        if (!maxParticipants || maxParticipants < 1) {
          return res.status(400).json({
            success: false,
            message: 'maxParticipants debe ser mayor a 0 para plan ORG',
          });
        }

        // Los carnets son opcionales en selectPlan (pueden agregarse después)
        if (carnets && Array.isArray(carnets) && carnets.length > 0) {
          // Validar que no excedan el límite
          if (carnets.length > maxParticipants) {
            return res.status(400).json({
              success: false,
              message: `No se pueden agregar ${carnets.length} carnets si el límite es ${maxParticipants}`,
            });
          }

          pendingCarnets = carnets.map(c => String(c).toUpperCase().trim());
        }
      }

      const session = await createStripeCheckoutSession(
        userId,
        planName,
        email,
        planName === 'ORG' ? {
          institutionName,
          maxParticipants: String(maxParticipants),
          numberOfCarnets: String(pendingCarnets.length),
        } : {}
      );

      // Para ORG, guardar datos pendientes en suscripción
      if (planName === 'ORG') {
        // Crear suscripción pendiente con información de ORG
        await Subscription.findOneAndUpdate(
          { userId },
          {
            userId,
            planId: plan._id,
            planName: 'ORG',
            status: 'pending_payment',
            startDate: new Date(),
            paymentMethod: 'stripe',
            orgInfo: {
              contractorEmail: email,
              contractorName: name,
              institutionName,
              maxParticipants,
              pendingCarnets,
            },
          },
          { upsert: true, new: true }
        );
      }

      res.json({
        success: true,
        message: 'Sesión de checkout creada',
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      });
    }
  } catch (error) {
    console.error('Error selecting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al seleccionar plan',
    });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { userId } = req;
    const { planName, email } = req.body;

    if (!planName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos faltantes',
      });
    }

    const session = await createStripeCheckoutSession(userId, planName, email);

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear sesión de pago',
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  try {
    const event = req.body;

    // En producción, verificar la firma del webhook
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, webhook_secret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, planName } = session.metadata;

      // Crear o actualizar suscripción
      const subscription = await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          planName,
          status: 'active',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          paymentMethod: 'stripe',
          startDate: new Date(),
        },
        { upsert: true, new: true }
      );

      // Enviar email de confirmación
      await sendPaymentConfirmationEmail(session.customer_email, session.customer_details?.name, planName, null);

      // Si es ORG, crear participantes desde pendingCarnets
      if (planName === 'ORG' && subscription.orgInfo?.pendingCarnets && subscription.orgInfo.pendingCarnets.length > 0) {
        try {
          const createdParticipants = [];
          const failedParticipants = [];

          // Crear cada participante
          for (const carnet of subscription.orgInfo.pendingCarnets) {
            const result = await addParticipantToORG(subscription._id, carnet, {
              name: carnet, // Usar carnet como nombre si no hay información adicional
            });

            if (result.success) {
              createdParticipants.push(carnet);
            } else {
              failedParticipants.push({ carnet, reason: result.message });
            }
          }

          // Limpiar pendingCarnets después de procesarlos
          await Subscription.updateOne(
            { _id: subscription._id },
            { $set: { 'orgInfo.pendingCarnets': [] } }
          );

          console.log(`[ORG_PARTICIPANTS] Created ${createdParticipants.length}/${subscription.orgInfo.pendingCarnets.length} participants for subscription ${subscription._id}`);

          if (failedParticipants.length > 0) {
            console.warn('[ORG_PARTICIPANTS] Failed participants:', failedParticipants);
          }
        } catch (participantsError) {
          console.error('[ORG_PARTICIPANTS] Error creating participants:', participantsError.message);
          // No detener el webhook por error de participantes, solo log
        }
      }

      // Actualizar user en AuthService
      await updateUserPlan(userId, planName, req.get('x-token'));
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook',
    });
  }
};

export default {
  getCurrentSubscription,
  selectPlan,
  createCheckoutSession,
  handleStripeWebhook,
};
