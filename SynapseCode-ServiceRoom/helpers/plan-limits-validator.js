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
 * Cuenta: salas donde es anfitrión + participaciones activas
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {Object} models - { Room, RoomParticipation } modelos de mongoose
 * @returns {Promise<{valid: boolean, message?: string, planName?: string, limit?: number, current?: number}>}
 */
export const validateRoomCreation = async (userId, token, models) => {
  try {
    const { Room, RoomParticipation } = models;
    const { planName, limits } = await getUserPlanInfo(userId, token);

    // PRO y ORG no tienen límite
    if (limits.maxActiveRooms === null) {
      return { valid: true, planName };
    }

    // Contar salas donde es anfitrión (ACTIVA)
    const hostedRoomsCount = await Room.countDocuments({
      hostId: userId,
      roomStatus: 'ACTIVA'
    });

    // Contar salas donde es participante conectado (EXCLUYENDO las del host/ANFITRION)
    // Las participaciones ANFITRION ya están contadas en hostedRooms
    const participantRoomsCount = await RoomParticipation.countDocuments({
      userId,
      connectionStatus: 'CONECTADO',
      role: { $ne: 'ANFITRION' }  // Excluir participaciones del anfitrión
    });

    const totalActiveRooms = hostedRoomsCount + participantRoomsCount;

    // Si intenta agregar una más, verifica si excede el límite
    if ((totalActiveRooms + 1) > limits.maxActiveRooms) {
      return {
        valid: false,
        message: `Plan ${planName}: Límite de ${limits.maxActiveRooms} salas activas alcanzado. Ya tienes ${totalActiveRooms} (${hostedRoomsCount} como anfitrión, ${participantRoomsCount} como participante).`,
        planName,
        limit: limits.maxActiveRooms,
        current: totalActiveRooms,
        hostedRooms: hostedRoomsCount,
        participantRooms: participantRoomsCount
      };
    }

    return { 
      valid: true, 
      planName,
      current: totalActiveRooms,
      hostedRooms: hostedRoomsCount,
      participantRooms: participantRoomsCount
    };
  } catch (error) {
    console.error('[ERROR] validateRoomCreation error:', error.message);
    return {
      valid: false,
      message: 'Error validando creación de sala: ' + error.message,
      planName: 'FREE'
    };
  }
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

/**
 * Valida si usuario puede acceder a más salas (como anfitrión + participante)
 * Cuenta salas activas: creadas (hostId) + participaciones activas
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {Object} models - { Room, RoomParticipation } modelos de mongoose
 * @returns {Promise<{valid: boolean, message?: string, currentRooms?: number, limit?: number, planName?: string}>}
 */
/**
 * Valida si usuario puede acceder a más salas (como anfitrión + participante)
 * Cuenta salas activas: creadas (hostId) + participaciones activas
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @param {Object} models - { Room, RoomParticipation } modelos de mongoose
 * @returns {Promise<{valid: boolean, message?: string, currentRooms?: number, limit?: number, planName?: string}>}
 */
export const validateRoomAccess = async (userId, token, models) => {
  try {
    const { Room, RoomParticipation } = models;
    
    // VALIDACIÓN INICIAL: userId no puede ser null/undefined
    if (!userId) {
      console.error('[ERROR] validateRoomAccess: userId es null/undefined');
      return {
        valid: false,
        message: 'Error: userId no identificado en la validación',
        planName: 'FREE'
      };
    }

    const { planName, limits } = await getUserPlanInfo(userId, token);

    // PRO y ORG no tienen límite
    if (limits.maxActiveRooms === null) {
      console.log(`[VALIDATE_ROOM_ACCESS] userId=${userId}, planName=${planName}, sin límite (PRO/ORG)`);
      return { valid: true, planName };
    }

    // Contar salas donde es anfitrión (ACTIVA)
    const hostedRoomsCount = await Room.countDocuments({
      hostId: userId,
      roomStatus: 'ACTIVA'
    });

    // Contar salas donde es participante conectado (EXCLUYENDO las del host/ANFITRION)
    // Las participaciones ANFITRION ya están contadas en hostedRooms
    const participantRoomsCount = await RoomParticipation.countDocuments({
      userId,
      connectionStatus: 'CONECTADO',
      role: { $ne: 'ANFITRION' }  // Excluir participaciones del anfitrión
    });

    const totalActiveRooms = hostedRoomsCount + participantRoomsCount;
    
    console.log(`[VALIDATE_ROOM_ACCESS] userId=${userId}, planName=${planName}, hostedRooms=${hostedRoomsCount}, participantRooms=${participantRoomsCount}, total=${totalActiveRooms}, limit=${limits.maxActiveRooms}`);

    // Si intenta agregar una más, verifica si excede el límite
    if ((totalActiveRooms + 1) > limits.maxActiveRooms) {
      console.warn(`[WARN] userId=${userId} intentó exceder límite: ${totalActiveRooms} + 1 > ${limits.maxActiveRooms}`);
      return {
        valid: false,
        message: `Plan ${planName}: Límite de ${limits.maxActiveRooms} salas activas alcanzado. Ya tienes ${totalActiveRooms} (${hostedRoomsCount} como anfitrión, ${participantRoomsCount} como participante).`,
        planName,
        limit: limits.maxActiveRooms,
        currentRooms: totalActiveRooms,
        hostedRooms: hostedRoomsCount,
        participantRooms: participantRoomsCount
      };
    }

    console.log(`[VALIDATE_ROOM_ACCESS] userId=${userId} puede acceder (${totalActiveRooms}/${limits.maxActiveRooms})`);
    return { 
      valid: true, 
      planName,
      currentRooms: totalActiveRooms,
      hostedRooms: hostedRoomsCount,
      participantRooms: participantRoomsCount
    };
  } catch (error) {
    console.error('[ERROR] validateRoomAccess error:', error.message);
    return {
      valid: false,
      message: 'Error validando acceso a salas: ' + error.message,
      planName: 'FREE'
    };
  }
};

/**
 * Obtiene el máximo de usuarios permitidos por sala según el plan
 * FREE: 5, PRO: 20, ORG: según orgInfo.maxParticipants
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 * @returns {Promise<{maxUsers: number, planName: string}>}
 */
export const getMaxUsersLimit = async (userId, token) => {
  try {
    const { planName, subscription } = await getUserPlanInfo(userId, token);

    const maxUsersLimits = {
      FREE: 5,
      PRO: 20,
      ORG: subscription?.orgInfo?.maxParticipants || 100, // Fallback a 100 si no está definido
    };

    const maxUsers = maxUsersLimits[planName] || 20;

    return { maxUsers, planName };
  } catch (error) {
    console.error('[ERROR] getMaxUsersLimit error:', error.message);
    // Fallback a 20 usuarios
    return { maxUsers: 20, planName: 'FREE' };
  }
};
