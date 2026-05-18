/**
 * Validador de límites de chat desde ServicePlans
 * Valida límites de historial de chat según el plan del usuario
 */

import axios from 'axios';
import config from '../configs/config.js';

const PLANS_SERVICE_URL = config.plans_service?.url || process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

const DEFAULT_CHAT_HISTORY_LIMITS = {
  FREE: 7,         // últimos 7 días
  PRO: null,       // ilimitado
  ORG: null        // ilimitado
};

/**
 * Obtiene el plan actual del usuario y el límite de historial de chat
 * @param {String} userId - ID del usuario
 * @param {String} token - JWT token del usuario
 * @returns {Promise<Object>} - { planName, chatHistoryDays }
 */
export const getChatHistoryLimit = async (userId, token) => {
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
    const historyLimit = DEFAULT_CHAT_HISTORY_LIMITS[planName] !== undefined 
      ? DEFAULT_CHAT_HISTORY_LIMITS[planName] 
      : DEFAULT_CHAT_HISTORY_LIMITS.FREE;

    return { planName, chatHistoryDays: historyLimit };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan de ServicePlans, usando FREE por defecto:`, error.message);
    return {
      planName: 'FREE',
      chatHistoryDays: DEFAULT_CHAT_HISTORY_LIMITS.FREE
    };
  }
};

/**
 * Calcula la fecha desde la cual se deben devolver los mensajes según el plan
 * @param {Number} historyDays - Número de días de historial permitidos (null = ilimitado)
 * @returns {Date|null} - Fecha mínima para filtrar mensajes, o null si no hay límite
 */
export const getMinimumMessageDate = (historyDays) => {
  if (historyDays === null) {
    return null; // Sin límite
  }

  const now = new Date();
  const minimumDate = new Date(now.getTime() - (historyDays * 24 * 60 * 60 * 1000));
  return minimumDate;
};

/**
 * Valida y obtiene información del acceso al historial del usuario
 * @param {String} userId - ID del usuario
 * @param {String} token - JWT token
 * @returns {Promise<Object>} - { planName, chatHistoryDays, minimumDate }
 */
export const validateChatHistoryAccess = async (userId, token) => {
  try {
    const { planName, chatHistoryDays } = await getChatHistoryLimit(userId, token);
    const minimumDate = getMinimumMessageDate(chatHistoryDays);

    return {
      planName,
      chatHistoryDays,
      minimumDate,
      valid: true
    };
  } catch (error) {
    console.warn('[WARN] Validación de límites de historial fallida:', error.message);
    return {
      planName: 'UNKNOWN',
      chatHistoryDays: DEFAULT_CHAT_HISTORY_LIMITS.FREE,
      minimumDate: getMinimumMessageDate(DEFAULT_CHAT_HISTORY_LIMITS.FREE),
      valid: false
    };
  }
};
