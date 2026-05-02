import { Router } from 'express';
import { validatePlanSelection } from '../../middlewares/validation.js';
import {
  selectPlan,
  getCurrentSubscription,
  createCheckoutSession,
  handleStripeWebhook,
} from './subscriptions.controller.js';

const router = Router();

/**
 * @route GET /api/v1/subscriptions/current
 * @desc Obtener suscripción actual del usuario
 * @access Private
 */
router.get('/current', getCurrentSubscription);

/**
 * @route POST /api/v1/subscriptions/select
 * @desc Seleccionar un plan (FREE o crear sesión de pago para PRO/ORG)
 * @access Private
 */
router.post('/select', validatePlanSelection, selectPlan);

/**
 * @route POST /api/v1/subscriptions/checkout
 * @desc Crear sesión de checkout para pago
 * @access Private
 */
router.post('/checkout', validatePlanSelection, createCheckoutSession);

/**
 * @route POST /api/v1/subscriptions/webhook/stripe
 * @desc Webhook de Stripe para eventos de pago
 * @access Public
 */
router.post('/webhook/stripe', handleStripeWebhook);

export default router;
