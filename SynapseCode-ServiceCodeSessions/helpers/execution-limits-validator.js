/**
 * Validador de límites de ejecuciones de código desde ServicePlans
 * Valida límites de ejecuciones por mes
 */

import axios from 'axios';
import config from '../configs/config.js';

const PLANS_SERVICE_URL = config.plans_service?.url || process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

// Definir límites localmente como fallback
const DEFAULT_EXECUTION_LIMITS = {
  FREE: 50,        // 50 ejecuciones por mes
  PRO: null,       // Ilimitadas
  ORG: null        // Ilimitadas
};

/**
 * Obtiene el límite de ejecuciones para el usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token para autenticación
 * @returns {Promise<{planName: string, limit: number|null}>}
 */
export const getExecutionLimit = async (userId, token) => {
  try {
    const response = await axios.get(
      `${PLANS_SERVICE_URL}/api/v1/subscriptions/current`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000
      }
    );

    const subscription = response.data?.data;
    const planName = subscription?.planName || 'FREE';
    const limit = DEFAULT_EXECUTION_LIMITS[planName] !== undefined ? DEFAULT_EXECUTION_LIMITS[planName] : DEFAULT_EXECUTION_LIMITS.FREE;

    return { planName, limit };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan de ServicePlans, usando FREE por defecto:`, error.message);
    return {
      planName: 'FREE',
      limit: DEFAULT_EXECUTION_LIMITS.FREE
    };
  }
};

/**
 * Valida si usuario puede hacer más ejecuciones de código este mes
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {object} CodeSession - Modelo de CodeSession de Mongoose
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export const validateExecutionUsage = async (userId, token, CodeSession) => {
  try {
    const { planName, limit } = await getExecutionLimit(userId, token);

    if (limit === null) {
      // PRO y ORG sin límite
      return { valid: true, planName };
    }

    // Contar ejecuciones de este mes
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedCount = await CodeSession.countDocuments({
      userId,
      createdAt: { $gte: monthStart }
    });

    if (usedCount >= limit) {
      return {
        valid: false,
        message: `Plan ${planName}: Límite de ${limit} ejecuciones por mes alcanzado. Has usado ${usedCount} de ${limit} este mes.`,
        planName,
        limit,
        used: usedCount
      };
    }

    return { 
      valid: true, 
      planName,
      limit,
      used: usedCount,
      remaining: limit - usedCount
    };
  } catch (error) {
    console.warn('[WARN] Validación de límites de ejecución fallida:', error.message);
    // Continuar aunque falle la validación
    return { valid: true, planName: 'UNKNOWN' };
  }
};

/**
 * Obtiene uso actual de ejecuciones sin validar
 * Útil para devolver info al cliente
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {object} CodeSession - Modelo de CodeSession
 * @returns {Promise<object>}
 */
export const getExecutionUsageInfo = async (userId, token, CodeSession) => {
  try {
    const { planName, limit } = await getExecutionLimit(userId, token);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usedCount = await CodeSession.countDocuments({
      userId,
      createdAt: { $gte: monthStart }
    });

    return {
      planName,
      monthlyLimit: limit,
      used: usedCount,
      remaining: limit === null ? -1 : (limit - usedCount),
      currentMonth: monthStart.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[ERROR] Error getting execution usage info:', error.message);
    return {
      planName: 'UNKNOWN',
      monthlyLimit: DEFAULT_EXECUTION_LIMITS.FREE,
      used: 0,
      remaining: DEFAULT_EXECUTION_LIMITS.FREE,
      error: true
    };
  }
};
