import { Router } from 'express';
import { getAllPlans, getPlanById } from './plans.controller.js';

const router = Router();

/**
 * @route GET /api/v1/plans
 * @desc Obtener todos los planes disponibles
 * @access Public
 */
router.get('/', getAllPlans);

/**
 * @route GET /api/v1/plans/:planId
 * @desc Obtener detalle de un plan específico
 * @access Public
 */
router.get('/:planId', getPlanById);

export default router;
