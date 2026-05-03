import Subscription from './subscription.model.js';
import Plan from '../plans/plan.model.js';
import {
  sendFreePlanEmail,
  sendPaymentConfirmationEmail,
} from '../../helpers/email-service.js';
import { updateUserPlan } from '../../helpers/auth-service-bridge.js';
import { addParticipantToORG } from '../../helpers/participants-org.js';

const isLocalBillingMode = process.env.NODE_ENV !== 'production';

const getTokenFromRequest = (req) =>
  req.get('x-token') || req.get('Authorization')?.replace('Bearer ', '');

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
          status: 'active',
          startDate: new Date(),
          paymentMethod: 'manual',
        },
        { upsert: true, new: true }
      );

      await sendFreePlanEmail(email, name);
      await updateUserPlan(userId, 'FREE', getTokenFromRequest(req));

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

      let orgInfo;
      let normalizedCarnets = [];

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
          ...(orgInfo ? { orgInfo } : {}),
        },
        { upsert: true, new: true }
      );

      if (planName === 'ORG') {
        await createOrgParticipantsIfNeeded(subscription._id, normalizedCarnets);
      }

      await updateUserPlan(userId, planName, getTokenFromRequest(req));
      await sendPaymentConfirmationEmail(email, name, planName, null);

      return res.json({
        success: true,
        message: `Plan ${planName} activado localmente sin Stripe`,
        data: subscription,
        meta: {
          billingMode: 'local_db',
          stripeDeferred: true,
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
