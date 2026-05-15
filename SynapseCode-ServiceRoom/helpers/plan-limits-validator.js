/**
 * Validador de límites de plan desde ServicePlans
 * Consulta el plan del usuario y valida límites antes de operaciones
 */

import axios from 'axios';
import config from '../configs/config.js';

const PLANS_SERVICE_URL = config.plans_service?.url || process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

// Definir límites localmente como fallback
const DEFAULT_PLAN_LIMITS = {
  FREE: { maxActiveRooms: 3, maxUsersPerRoom: 5 },
  PRO: { maxActiveRooms: null, maxUsersPerRoom: 20 },
  ORG: { maxActiveRooms: null, maxUsersPerRoom: null }
};

/**
 * Obtiene el plan actual del usuario desde ServicePlans
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token para autenticación
 * @returns {Promise<{planName: string, limits: object}>}
 */
export const getUserPlanInfo = async (userId, token) => {
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
    const limits = DEFAULT_PLAN_LIMITS[planName] || DEFAULT_PLAN_LIMITS.FREE;

    return { planName, limits, subscription };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan de ServicePlans, usando FREE por defecto:`, error.message);
    // Fallback a FREE si ServicePlans no está disponible
    return {
      planName: 'FREE',
      limits: DEFAULT_PLAN_LIMITS.FREE,
      subscription: null
    };
  }
};

/**
 * Obtiene el plan de cualquier usuario por su ID.
 * Usa el endpoint público de ServicePlans para enriquecer datos de salas existentes.
 * @param {string} userId - ID del usuario
 * @returns {Promise<{planName: string, limits: object, subscription: object|null}>}
 */
export const getUserPlanInfoByUserId = async (userId) => {
  try {
    const response = await axios.get(
      `${PLANS_SERVICE_URL}/api/v1/subscriptions/user/${userId}`,
      {
        timeout: 3000
      }
    );

    const subscription = response.data?.data;
    const planName = subscription?.planName || subscription?.planId?.name || 'FREE';
    const limits = DEFAULT_PLAN_LIMITS[planName] || DEFAULT_PLAN_LIMITS.FREE;

    return { planName, limits, subscription };
  } catch (error) {
    console.warn(`[WARN] No se pudo obtener plan del usuario ${userId}, usando FREE por defecto:`, error.message);
    return {
      planName: 'FREE',
      limits: DEFAULT_PLAN_LIMITS.FREE,
      subscription: null
    };
  }
};

/**
 * Valida si usuario puede crear una nueva sala
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {number} currentActiveRooms - Número de salas activas actuales
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export const validateRoomCreation = async (userId, token, currentActiveRooms) => {
  const { planName, limits } = await getUserPlanInfo(userId, token);

  if (limits.maxActiveRooms === null) {
    // PRO y ORG no tienen límite
    return { valid: true, planName };
  }

  if (currentActiveRooms >= limits.maxActiveRooms) {
    return {
      valid: false,
      message: `Plan ${planName}: Límite de ${limits.maxActiveRooms} salas activas alcanzado. Tienes ${currentActiveRooms}.`,
      planName,
      limit: limits.maxActiveRooms
    };
  }

  return { valid: true, planName };
};

/**
 * Valida si usuario puede agregar más usuarios a una sala
 * @param {string} userId - ID del usuario creador de la sala
 * @param {string} token - JWT token
 * @param {number} currentUserCount - Número actual de usuarios en la sala
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export const validateUserPerRoomLimit = async (userId, token, currentUserCount) => {
  const { planName, limits } = await getUserPlanInfo(userId, token);

  // Calcular cuántos usuarios más pueden agregarse
  const nextUserCount = currentUserCount + 1;

  if (limits.maxUsersPerRoom === null) {
    // PRO y ORG no tienen límite
    return { valid: true, planName };
  }

  if (nextUserCount > limits.maxUsersPerRoom) {
    return {
      valid: false,
      message: `Plan ${planName}: Límite de ${limits.maxUsersPerRoom} usuarios por sala. Actualmente hay ${currentUserCount}, intentas agregar 1 más.`,
      planName,
      limit: limits.maxUsersPerRoom,
      current: currentUserCount
    };
  }

  return { valid: true, planName };
};

/**
 * Obtiene los límites de un usuario sin hacer validación
 * Útil para devolver info al cliente sobre sus límites
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @returns {Promise<object>}
 */
export const getPlanLimits = async (userId, token) => {
  try {
    const { planName, limits, subscription } = await getUserPlanInfo(userId, token);
    return {
      planName,
      limits,
      status: subscription?.status || 'unknown'
    };
  } catch (error) {
    console.error('[ERROR] Error getting plan limits:', error.message);
    return {
      planName: 'FREE',
      limits: DEFAULT_PLAN_LIMITS.FREE,
      status: 'error'
    };
  }
};
