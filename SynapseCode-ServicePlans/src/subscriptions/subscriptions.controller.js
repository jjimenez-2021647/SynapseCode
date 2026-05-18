import Subscription from './subscription.model.js';
import Plan from '../plans/plan.model.js';
import {
  sendFreePlanEmail,
  sendPaymentConfirmationEmail,
} from '../../helpers/email-service.js';
import { updateUserPlan, updateUserRole } from '../../helpers/auth-service-bridge.js';
import {
  activateParticipant,
  addParticipantToORG,
  findActiveOrgParticipantByCarnet,
} from '../../helpers/participants-org.js';
import { createInvoicePdf } from '../../helpers/invoice-service.js';

const isLocalBillingMode = process.env.NODE_ENV !== 'production';

const getTokenFromRequest = (req) =>
  req.get('x-token') || req.get('Authorization')?.replace('Bearer ', '');

const getUsernameFromRequest = (req) =>
  req.user?.username ||
  req.user?.userName ||
  req.user?.preferred_username ||
  req.user?.nickname ||
  req.body?.username ||
  req.userId;

const normalizeOrgSelection = ({ institutionName, carnets, maxParticipants }) => {
  if (!institutionName) {
    return {
      error: {
        status: 400,
        message: 'institutionName es requerido para plan ORG',
      },
    };
  }

  const normalizedMaxParticipants = Number(maxParticipants);
  if (!normalizedMaxParticipants || normalizedMaxParticipants < 1) {
    return {
      error: {
        status: 400,
        message: 'maxParticipants debe ser mayor a 0 para plan ORG',
      },
    };
  }

  const normalizedCarnets = Array.isArray(carnets)
    ? carnets.map((carnet) => String(carnet).toUpperCase().trim())
    : [];

  if (normalizedCarnets.length > normalizedMaxParticipants) {
    return {
      error: {
        status: 400,
        message: `No se pueden agregar ${normalizedCarnets.length} carnets si el limite es ${normalizedMaxParticipants}`,
      },
    };
  }

  return {
    orgInfo: {
      contractorEmail: null,
      contractorName: null,
      institutionName,
      maxParticipants: normalizedMaxParticipants,
      pendingCarnets: normalizedCarnets,
    },
    normalizedCarnets,
  };
};

const createOrgParticipantsIfNeeded = async (subscriptionId, carnets) => {
  if (!carnets.length) {
    return;
  }

  const createdParticipants = [];
  const failedParticipants = [];

  for (const carnet of carnets) {
    const result = await addParticipantToORG(subscriptionId, carnet, { name: carnet });

    if (result.success) {
      createdParticipants.push(carnet);
    } else {
      failedParticipants.push({ carnet, reason: result.message });
    }
  }

  if (createdParticipants.length > 0) {
    await Subscription.updateOne(
      { _id: subscriptionId },
      { $set: { 'orgInfo.pendingCarnets': [] } }
    );
  }

  if (failedParticipants.length > 0) {
    console.warn('[ORG_PARTICIPANTS] Participantes no creados en modo local:', failedParticipants);
  }
};

export const getCurrentSubscription = async (req, res) => {
  try {
    const { userId } = req;

    const subscription = await Subscription.findOne({ userId }).populate('planId');

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'Sin suscripcion activa',
      });
    }

    return res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener suscripcion',
    });
  }
};

export const getUserSubscriptionById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido',
      });
    }

    let subscription = await Subscription.findOne({ userId }).populate('planId', 'name price');

    // Si no existe suscripción, crear una con plan FREE automáticamente
    if (!subscription) {
      const freePlan = await Plan.findOne({ name: 'FREE' });
      if (freePlan) {
        subscription = await Subscription.create({
          userId,
          planId: freePlan._id,
          planName: 'FREE',
          status: 'active',
          startDate: new Date(),
          paymentMethod: 'manual',
        });
        // Poblar planId después de crear
        subscription = await subscription.populate('planId', 'name price');
      }
    }

    return res.json({
      success: true,
      data: subscription,
      message: subscription ? 'Suscripcion obtenida' : 'Sin suscripcion activa para este usuario',
    });
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener suscripcion del usuario',
    });
  }
};

export const selectPlan = async (req, res) => {
  try {
    const { userId } = req;
    const {
      planName,
      email,
      name,
      institutionName,
      carnets,
      maxParticipants,
      orgUserType,
      carnetNumber,
    } = req.body;
    const normalizedOrgUserType = planName === 'ORG'
      ? String(orgUserType || 'PROFESSOR').trim().toUpperCase()
      : null;

    if (!planName || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos faltantes',
      });
    }

    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    if (planName === 'FREE') {
      const subscription = await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          planId: plan._id,
          planName: 'FREE',
          orgUserType: null,
          orgAccess: null,
          status: 'active',
          startDate: new Date(),
          paymentMethod: 'manual',
        },
        { upsert: true, returnDocument: 'after' }
      );

      await sendFreePlanEmail(email, name);
      await updateUserPlan(userId, 'FREE', getTokenFromRequest(req), null);

      return res.json({
        success: true,
        message: 'Plan FREE seleccionado',
        data: subscription,
      });
    }

    if (planName === 'PRO' || planName === 'ORG') {
      if (!isLocalBillingMode) {
        return res.status(501).json({
          success: false,
          message: 'Stripe checkout esta pendiente de reactivacion para despliegue.',
        });
      }

      // Check user role for ORG
      if (planName === 'ORG') {
        if (!['PROFESSOR', 'STUDENT'].includes(normalizedOrgUserType)) {
          return res.status(400).json({
            success: false,
            message: 'orgUserType debe ser PROFESSOR o STUDENT',
          });
        }
        if (req.user?.role !== 'USER_ROLE') {
          return res.status(403).json({
            success: false,
            message: 'Solo usuarios con rol USER_ROLE pueden seleccionar plan ORG',
          });
        }

        if (normalizedOrgUserType === 'STUDENT') {
          if (!carnetNumber) {
            return res.status(400).json({
              success: false,
              message: 'carnetNumber es requerido para ingresar como estudiante ORG',
            });
          }

          const carnetValidation = await findActiveOrgParticipantByCarnet(carnetNumber);
          if (!carnetValidation.valid) {
            return res.status(403).json({
              success: false,
              message: carnetValidation.message,
              error: 'INVALID_ORG_CARNET',
            });
          }

          const existingLinkedUserId = carnetValidation.participant.linkedUserId;
          if (existingLinkedUserId && existingLinkedUserId !== userId) {
            return res.status(409).json({
              success: false,
              message: 'Este carnet ya estÃ¡ vinculado a otro usuario',
              error: 'CARNET_ALREADY_LINKED',
            });
          }

          const subscription = await Subscription.findOneAndUpdate(
            { userId },
            {
              userId,
              planId: plan._id,
              planName: 'ORG',
              orgUserType: 'STUDENT',
              status: 'active',
              startDate: new Date(),
              paymentMethod: 'manual',
              amountPaid: 0,
              currency: plan.currency || 'USD',
              orgAccess: {
                sourceSubscriptionId: carnetValidation.subscription._id,
                carnetNumber: String(carnetNumber).toUpperCase().trim(),
              },
            },
            { upsert: true, returnDocument: 'after' }
          );

          await activateParticipant(
            carnetValidation.subscription._id,
            carnetNumber,
            userId
          );
          await updateUserPlan(userId, 'ORG', getTokenFromRequest(req), 'STUDENT');
          await updateUserRole(userId, 'ORG_ROLE', getTokenFromRequest(req));

          return res.json({
            success: true,
            message: 'Plan ORG activado como estudiante',
            data: subscription,
          });
        }

        if (!institutionName || !maxParticipants) {
          return res.status(400).json({
            success: false,
            message: 'institutionName y maxParticipants son requeridos para plan ORG',
          });
        }
      }

      let orgInfo;
      let normalizedCarnets = [];
      const requestedAmount = Number(req.body.amountPaid) || 0;
      const planAmount = Number(plan.price) || 0;
      const amountPaid =
        planName === 'ORG'
          ? requestedAmount || Number(maxParticipants) * 2 || planAmount
          : requestedAmount || planAmount;

      if (planName === 'ORG') {
        const normalizedOrg = normalizeOrgSelection({
          institutionName,
          carnets,
          maxParticipants,
        });

        if (normalizedOrg.error) {
          return res.status(normalizedOrg.error.status).json({
            success: false,
            message: normalizedOrg.error.message,
          });
        }

        orgInfo = {
          ...normalizedOrg.orgInfo,
          contractorEmail: email,
          contractorName: name,
        };
        normalizedCarnets = normalizedOrg.normalizedCarnets;
      }

      const subscription = await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          planId: plan._id,
          planName,
          status: 'active',
          startDate: new Date(),
          paymentMethod: 'manual',
          orgUserType: planName === 'ORG' ? 'PROFESSOR' : null,
          orgAccess: null,
          amountPaid,
          currency: plan.currency || 'USD',
          ...(orgInfo ? { orgInfo } : {}),
        },
        { upsert: true, returnDocument: 'after' }
      );

      if (planName === 'ORG') {
        await createOrgParticipantsIfNeeded(subscription._id, normalizedCarnets);
      }

      const invoice = await createInvoicePdf({
        subscriptionId: subscription._id.toString(),
        planName,
        username: getUsernameFromRequest(req),
        name,
        email,
        amountPaid,
        currency: plan.currency || 'USD',
        institutionName: planName === 'ORG' ? institutionName : null,
        maxParticipants: planName === 'ORG' ? Number(maxParticipants) : null,
      });

      await Subscription.updateOne(
        { _id: subscription._id },
        { $set: { invoiceUrl: invoice.url } }
      );

      await updateUserPlan(
        userId,
        planName,
        getTokenFromRequest(req),
        planName === 'ORG' ? 'PROFESSOR' : null
      );
      if (planName === 'ORG') {
        await updateUserRole(userId, 'ORG_ROLE', getTokenFromRequest(req));
      }
      await sendPaymentConfirmationEmail(email, name, planName, invoice.url, null, amountPaid, plan.currency || 'USD');

      return res.json({
        success: true,
        message: `Plan ${planName} activado localmente sin Stripe`,
        data: subscription,
        meta: {
          billingMode: 'local_db',
          stripeDeferred: true,
          amountPaid,
          invoiceUrl: invoice.url,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Plan no soportado',
    });
  } catch (error) {
    console.error('Error selecting plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al seleccionar plan',
    });
  }
};

export const createCheckoutSession = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Checkout con Stripe deshabilitado en entorno local. Usa /select para activar planes en DB.',
    meta: {
      billingMode: 'local_db',
      stripeDeferred: true,
    },
  });
};

export const handleStripeWebhook = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Webhook de Stripe deshabilitado en entorno local. Reactivar al desplegar la integracion de pagos.',
    meta: {
      billingMode: 'local_db',
      stripeDeferred: true,
    },
  });
};

export default {
  getCurrentSubscription,
  selectPlan,
  createCheckoutSession,
  handleStripeWebhook,
};
