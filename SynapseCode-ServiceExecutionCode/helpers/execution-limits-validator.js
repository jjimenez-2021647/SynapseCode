/**
 * Validador de límites de ejecuciones desde ServicePlans
 * Similar a ServiceCodeSessions pero para ejecuciones reales
 */

import axios from 'axios';
import config from '../configs/config.js';

const PLANS_SERVICE_URL = config.plans_service?.url || process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

const DEFAULT_EXECUTION_LIMITS = {
  FREE: 50,        // 50 ejecuciones por día
  PRO: null,       // Ilimitadas
  ORG: null        // Ilimitadas
};

const DEFAULT_EXECUTION_TIME_LIMITS = {
  FREE: 10,        // 10 segundos máximo
  PRO: 60,         // 60 segundos máximo
  ORG: 60          // 60 segundos máximo
};

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

export const getExecutionTimeLimit = async (userId, token) => {
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
    const timeLimit = DEFAULT_EXECUTION_TIME_LIMITS[planName] !== undefined ? DEFAULT_EXECUTION_TIME_LIMITS[planName] : DEFAULT_EXECUTION_TIME_LIMITS.FREE;

    return { planName, timeLimit };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan de ServicePlans para límite de tiempo, usando FREE por defecto:`, error.message);
    return {
      planName: 'FREE',
      timeLimit: DEFAULT_EXECUTION_TIME_LIMITS.FREE
    };
  }
};

export const validateExecutionUsage = async (userId, token, ExecutionModel) => {
  try {
    const { planName, limit } = await getExecutionLimit(userId, token);

    if (limit === null) {
      return { valid: true, planName };
    }

    // Calcular el inicio del día actual a las 00:00:00
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const usedCount = await ExecutionModel.countDocuments({
      userId,
      createdAt: { $gte: dayStart }
    });

    if (usedCount >= limit) {
      return {
        valid: false,
        message: `Plan ${planName}: Límite de ${limit} ejecuciones por día alcanzado. Has usado ${usedCount} de ${limit} hoy.`,
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
    console.warn('[WARN] Validación de límites fallida:', error.message);
    return { valid: true, planName: 'UNKNOWN' };
  }
};

export const getExecutionUsageInfo = async (userId, token, ExecutionModel) => {
  try {
    const { planName, limit } = await getExecutionLimit(userId, token);
    
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    const usedCount = await ExecutionModel.countDocuments({
      userId,
      createdAt: { $gte: dayStart }
    });

    return {
      planName,
      dailyLimit: limit,
      used: usedCount,
      remaining: limit === null ? -1 : (limit - usedCount),
      currentDay: dayStart.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[ERROR] Error getting execution info:', error.message);
    return {
      planName: 'UNKNOWN',
      dailyLimit: DEFAULT_EXECUTION_LIMITS.FREE,
      used: 0,
      remaining: DEFAULT_EXECUTION_LIMITS.FREE,
      error: true
    };
  }
};
