/**
 * Validador de límites de IA desde ServicePlans
 * Valida límites de explicaciones con IA por mes
 */

import axios from 'axios';
import config from '../configs/config.js';

const PLANS_SERVICE_URL = config.plans_service?.url || process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

// Definir límites localmente como fallback
const DEFAULT_AI_LIMITS = {
  FREE: 10,        // 10 explicaciones por mes
  PRO: 20,         // 20 explicaciones por mes
  ORG: null        // Ilimitadas
};

/**
 * Obtiene el límite de explicaciones IA para el usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token para autenticación
 * @returns {Promise<{planName: string, limit: number|null}>}
 */
export const getAIExplanationsLimit = async (userId, token) => {
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
    const limit = DEFAULT_AI_LIMITS[planName] !== undefined ? DEFAULT_AI_LIMITS[planName] : DEFAULT_AI_LIMITS.FREE;

    return { planName, limit };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan de ServicePlans, usando FREE por defecto:`, error.message);
    return {
      planName: 'FREE',
      limit: DEFAULT_AI_LIMITS.FREE
    };
  }
};

/**
 * Valida si usuario puede hacer más explicaciones de IA este mes
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {object} Chat - Modelo de Chat de Mongoose
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export const validateAIExplanationUsage = async (userId, token, Chat) => {
  try {
    const { planName, limit } = await getAIExplanationsLimit(userId, token);

    if (limit === null) {
      // ORG sin límite
      return { valid: true, planName };
    }

    // Contar explicaciones de IA de este mes
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedCount = await Chat.countDocuments({
      userId,
      chatType: 'CHAT_IA',
      createdAt: { $gte: monthStart }
    });

    if (usedCount >= limit) {
      return {
        valid: false,
        message: `Plan ${planName}: Límite de ${limit} explicaciones de IA por mes alcanzado. Has usado ${usedCount} de ${limit} este mes.`,
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
    console.warn('[WARN] Validación de límites de IA fallida:', error.message);
    // Continuar aunque falle la validación
    return { valid: true, planName: 'UNKNOWN' };
  }
};

/**
 * Obtiene uso actual de explicaciones IA sin validar
 * Útil para devolver info al cliente
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {object} Chat - Modelo de Chat
 * @returns {Promise<object>}
 */
export const getAIUsageInfo = async (userId, token, Chat) => {
  try {
    const { planName, limit } = await getAIExplanationsLimit(userId, token);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usedCount = await Chat.countDocuments({
      userId,
      chatType: 'CHAT_IA',
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
    console.error('[ERROR] Error getting AI usage info:', error.message);
    return {
      planName: 'UNKNOWN',
      monthlyLimit: DEFAULT_AI_LIMITS.FREE,
      used: 0,
      remaining: DEFAULT_AI_LIMITS.FREE,
      error: true
    };
  }
};
