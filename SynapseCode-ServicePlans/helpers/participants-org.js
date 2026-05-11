/**
 * Helper para gestionar participantes ORG
 * Valida carnets, agrega participantes, envía invitaciones, etc.
 */

import ParticipantsORG from '../src/org-management/participants-org.model.js';

/**
 * Agregar participante (carnet) a un plan ORG
 * @param {string} subscriptionId - ID de la suscripción ORG
 * @param {string} carnetNumber - Número de carnet
 * @param {object} studentInfo - {email, name} opcional
 * @returns {Promise<object>}
 */
export const addParticipantToORG = async (subscriptionId, carnetNumber, studentInfo = {}) => {
  try {
    const participant = await ParticipantsORG.create({
      subscriptionId,
      carnetNumber: String(carnetNumber).toUpperCase().trim(),
      studentEmail: studentInfo.email || null,
      studentName: studentInfo.name || null,
      status: 'PENDING',
      invitationSentAt: new Date()
    });

    return {
      success: true,
      participant,
      message: `Participante ${carnetNumber} agregado exitosamente`
    };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicado
      return {
        success: false,
        message: `El carnet ${carnetNumber} ya está registrado en esta institución`,
        error: 'DUPLICATE_CARNET'
      };
    }
    throw error;
  }
};

/**
 * Validar si un carnet puede acceder a un plan ORG
 * @param {string} subscriptionId - ID de la suscripción ORG
 * @param {string} carnetNumber - Número de carnet a validar
 * @returns {Promise<{valid: boolean, participant?: object}>}
 */
export const validateCarnetForORG = async (subscriptionId, carnetNumber) => {
  try {
    const participant = await ParticipantsORG.findOne({
      subscriptionId,
      carnetNumber: String(carnetNumber).toUpperCase().trim()
    });

    if (!participant) {
      return {
        valid: false,
        message: 'Carnet no autorizado para este plan'
      };
    }

    if (participant.status === 'REMOVED') {
      return {
        valid: false,
        message: 'Este carnet ha sido removido del plan',
        participant
      };
    }

    return {
      valid: true,
      participant,
      status: participant.status
    };
  } catch (error) {
    console.error('[ERROR] Error validating carnet:', error.message);
    return {
      valid: false,
      message: 'Error en validación de carnet'
    };
  }
};

/**
 * Obtener total de participantes activos en un plan ORG
 * @param {string} subscriptionId - ID de la suscripción ORG
 * @returns {Promise<number>}
 */
export const getActiveParticipantsCount = async (subscriptionId) => {
  try {
    const count = await ParticipantsORG.countDocuments({
      subscriptionId,
      status: { $in: ['ACTIVE', 'PENDING'] }
    });
    return count;
  } catch (error) {
    console.error('[ERROR] Error counting participants:', error.message);
    return 0;
  }
};

/**
 * Obtener límite de participantes de una suscripción ORG
 * El límite se define cuando se contrata el plan (negotiated)
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<number|null>}
 */
export const getOrgParticipantLimit = async (subscriptionId) => {
  try {
    const Subscription = (await import('../src/subscriptions/subscription.model.js')).default;
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription?.planName || subscription.planName !== 'ORG') {
      return null;
    }

    // El límite está en orgInfo.maxParticipants (definido en contratación)
    return subscription.orgInfo?.maxParticipants || null;
  } catch (error) {
    console.error('[ERROR] Error getting participant limit:', error.message);
    return null;
  }
};

/**
 * Validar si se puede agregar más participantes al plan
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<{canAdd: boolean, current: number, limit: number|null}>}
 */
export const canAddMoreParticipants = async (subscriptionId) => {
  try {
    const current = await getActiveParticipantsCount(subscriptionId);
    const limit = await getOrgParticipantLimit(subscriptionId);

    if (limit === null) {
      // Sin límite (ilimitado)
      return {
        canAdd: true,
        current,
        limit: null
      };
    }

    return {
      canAdd: current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current)
    };
  } catch (error) {
    console.error('[ERROR] Error checking capacity:', error.message);
    return {
      canAdd: false,
      error: 'Error al verificar capacidad'
    };
  }
};

/**
 * Marcar participante como ACTIVE cuando ingresa
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} carnetNumber - Número de carnet
 * @param {string} linkedUserId - ID del usuario en AuthService
 * @returns {Promise<object>}
 */
export const activateParticipant = async (subscriptionId, carnetNumber, linkedUserId) => {
  try {
    const participant = await ParticipantsORG.findOneAndUpdate(
      {
        subscriptionId,
        carnetNumber: String(carnetNumber).toUpperCase().trim()
      },
      {
        status: 'ACTIVE',
        registeredAt: new Date(),
        linkedUserId,
        confirmationEmailSentAt: new Date()
      },
      { new: true }
    );

    if (!participant) {
      return {
        success: false,
        message: 'Participante no encontrado'
      };
    }

    return {
      success: true,
      participant,
      message: 'Participante activado'
    };
  } catch (error) {
    console.error('[ERROR] Error activating participant:', error.message);
    return {
      success: false,
      message: 'Error al activar participante'
    };
  }
};

/**
 * Obtener todos los participantes de una suscripción ORG
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} status - Filtrar por estado (optional)
 * @returns {Promise<array>}
 */
export const getOrgParticipants = async (subscriptionId, status = null) => {
  try {
    const query = { subscriptionId };
    if (status) {
      query.status = status;
    }

    const participants = await ParticipantsORG.find(query)
      .select('carnetNumber studentName studentEmail status registeredAt lastAccessAt notes')
      .sort({ createdAt: -1 });

    return participants;
  } catch (error) {
    console.error('[ERROR] Error getting participants:', error.message);
    return [];
  }
};

/**
 * Remover un participante del plan ORG
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} carnetNumber - Número de carnet
 * @returns {Promise<object>}
 */
export const removeParticipant = async (subscriptionId, carnetNumber) => {
  try {
    const result = await ParticipantsORG.findOneAndUpdate(
      {
        subscriptionId,
        carnetNumber: String(carnetNumber).toUpperCase().trim()
      },
      { status: 'REMOVED' },
      { new: true }
    );

    if (!result) {
      return {
        success: false,
        message: 'Participante no encontrado'
      };
    }

    return {
      success: true,
      message: 'Participante removido',
      participant: result
    };
  } catch (error) {
    console.error('[ERROR] Error removing participant:', error.message);
    return {
      success: false,
      message: 'Error al remover participante'
    };
  }
};

/**
 * Actualizar última actividad de un participante
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} carnetNumber - Número de carnet
 * @returns {Promise<void>}
 */
export const updateParticipantLastAccess = async (subscriptionId, carnetNumber) => {
  try {
    await ParticipantsORG.updateOne(
      {
        subscriptionId,
        carnetNumber: String(carnetNumber).toUpperCase().trim()
      },
      { lastAccessAt: new Date() }
    );
  } catch (error) {
    console.error('[WARN] Error updating last access:', error.message);
  }
};

/**
 * Obtener estadísticas de participantes
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<object>}
 */
export const getParticipantsStats = async (subscriptionId) => {
  try {
    const total = await ParticipantsORG.countDocuments({ subscriptionId });
    const active = await ParticipantsORG.countDocuments({
      subscriptionId,
      status: 'ACTIVE'
    });
    const pending = await ParticipantsORG.countDocuments({
      subscriptionId,
      status: 'PENDING'
    });
    const limit = await getOrgParticipantLimit(subscriptionId);

    return {
      total,
      active,
      pending,
      limit,
      utilizationPercentage: limit ? Math.round((active / limit) * 100) : null
    };
  } catch (error) {
    console.error('[ERROR] Error getting stats:', error.message);
    return {
      total: 0,
      active: 0,
      pending: 0,
      limit: null
    };
  }
};
