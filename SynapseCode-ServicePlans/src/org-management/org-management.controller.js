import Subscription from '../subscriptions/subscription.model.js';
import CodeRating from './code-rating.model.js';
import RoomAIRestrictions from './room-ai-restrictions.model.js';
import { sendOrgApprovalRequestEmail, sendParticipantInvitationEmail } from '../../helpers/email-service.js';
import {
  addParticipantToORG,
  validateCarnetForORG,
  getOrgParticipants,
  removeParticipant,
  getParticipantsStats,
  canAddMoreParticipants,
} from '../../helpers/participants-org.js';

// ============ GESTIÓN DE PROFESORES ============

export const requestProfessorApproval = async (req, res) => {
  try {
    const { userId } = req;
    const { email, name, institutionId } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email y nombre requeridos',
      });
    }

    // Obtener suscripción ORG del usuario
    const subscription = await Subscription.findOne({
      userId,
      planName: 'ORG',
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene plan ORG activo',
      });
    }

    // Agregar profesor a la lista de solicitudes
    subscription.orgInfo.approvedProfessors.push({
      professorId: userId,
      email,
      name,
      status: 'pending',
    });

    await subscription.save();

    // Enviar email al contractante
    await sendOrgApprovalRequestEmail(subscription.orgInfo.contractorEmail, email, name);

    res.json({
      success: true,
      message: 'Solicitud enviada al administrador ORG',
    });
  } catch (error) {
    console.error('Error requesting professor approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error solicitando aprobación',
    });
  }
};

export const approveProfessor = async (req, res) => {
  try {
    const { userId } = req;
    const { professorId } = req.params;

    // Verificar que el usuario sea el contractante ORG
    const subscription = await Subscription.findOne({
      userId,
      planName: 'ORG',
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    // Buscar y actualizar professor
    const professor = subscription.orgInfo.approvedProfessors.find(
      (p) => p.professorId === professorId
    );

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado',
      });
    }

    professor.status = 'approved';
    professor.approvedAt = new Date();

    await subscription.save();

    // TODO: Actualizar rol en AuthService a ORG_ROLE
    // await updateUserRole(professorId, 'ORG_ROLE', token);

    res.json({
      success: true,
      message: 'Profesor aprobado',
      data: professor,
    });
  } catch (error) {
    console.error('Error approving professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error aprobando profesor',
    });
  }
};

export const rejectProfessor = async (req, res) => {
  try {
    const { userId } = req;
    const { professorId } = req.params;

    const subscription = await Subscription.findOne({
      userId,
      planName: 'ORG',
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    const professor = subscription.orgInfo.approvedProfessors.find(
      (p) => p.professorId === professorId
    );

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado',
      });
    }

    professor.status = 'rejected';

    await subscription.save();

    res.json({
      success: true,
      message: 'Profesor rechazado',
    });
  } catch (error) {
    console.error('Error rejecting professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error rechazando profesor',
    });
  }
};

export const getApprovedProfessors = async (req, res) => {
  try {
    const { userId } = req;

    const subscription = await Subscription.findOne({
      userId,
      planName: 'ORG',
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    const approvedProfessors = subscription.orgInfo.approvedProfessors.filter(
      (p) => p.status === 'approved'
    );

    res.json({
      success: true,
      data: approvedProfessors,
    });
  } catch (error) {
    console.error('Error getting approved professors:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo profesores aprobados',
    });
  }
};

// ============ CALIFICACIÓN DE CÓDIGO ============

export const rateCode = async (req, res) => {
  try {
    const { userId: professorId } = req;
    const { roomId, fileId, userId, code, language, rating, ratingScale, criteria, comments, useAIForAnalysis } = req.body;

    // Validar que sea ORG_ROLE
    // TODO: Verificar rol en el token o hacer llamada a AuthService

    const rating_record = new CodeRating({
      roomId,
      fileId,
      userId,
      ratedByProfessorId: professorId,
      code,
      language,
      rating,
      ratingScale,
      criteria,
      comments,
      useAIForAnalysis,
    });

    // Si usar IA para análisis
    if (useAIForAnalysis) {
      try {
        // Llamar a servicio de IA (Groq o similar)
        const aiAnalysis = await callAIAnalysis(code, language);
        rating_record.aiAnalysis = aiAnalysis;
      } catch (error) {
        console.warn('Error calling AI analysis:', error);
      }
    }

    await rating_record.save();

    res.json({
      success: true,
      message: 'Código calificado exitosamente',
      data: rating_record,
    });
  } catch (error) {
    console.error('Error rating code:', error);
    res.status(500).json({
      success: false,
      message: 'Error calificando código',
    });
  }
};

export const getCodeRatings = async (req, res) => {
  try {
    const { roomId } = req.params;

    const ratings = await CodeRating.find({ roomId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error('Error getting code ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo calificaciones',
    });
  }
};

// ============ RESTRICCIONES DE IA ============

export const setRoomAIRestrictions = async (req, res) => {
  try {
    const { userId: professorId } = req;
    const { roomId } = req.params;
    const { aiEnabled, reason, restrictions } = req.body;

    const aiRestriction = await RoomAIRestrictions.findOneAndUpdate(
      { roomId },
      {
        roomId,
        professorId,
        aiEnabled,
        reason,
        restrictions: restrictions || {
          aiExplanations: true,
          aiCodeSuggestions: true,
          aiDebugging: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: 'Restricciones de IA establecidas',
      data: aiRestriction,
    });
  } catch (error) {
    console.error('Error setting AI restrictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error estableciendo restricciones de IA',
    });
  }
};

export const getRoomAIRestrictions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const restrictions = await RoomAIRestrictions.findOne({ roomId });

    if (!restrictions) {
      return res.json({
        success: true,
        data: {
          aiEnabled: true,
          restrictions: {
            aiExplanations: true,
            aiCodeSuggestions: true,
            aiDebugging: true,
          },
        },
      });
    }

    res.json({
      success: true,
      data: restrictions,
    });
  } catch (error) {
    console.error('Error getting AI restrictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo restricciones de IA',
    });
  }
};

// ============ ANALÍTICAS ============

export const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Obtener calificaciones del estudiante
    const ratings = await CodeRating.find({ userId: studentId });

    // Calcular estadísticas
    const averageRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    const analytics = {
      studentId,
      totalCodeSubmissions: ratings.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratings: ratings.map((r) => ({
        date: r.createdAt,
        rating: r.rating,
        scale: r.ratingScale,
        comments: r.comments,
      })),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting student analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo analíticas',
    });
  }
};

// ============ PERMISOS EN SALA ============

export const updateRoomPermissions = async (req, res) => {
  try {
    const { userId: professorId } = req;
    const { roomId } = req.params;
    const { permissions } = req.body;

    // permissions: { canEdit: boolean, canExecute: boolean, canChat: boolean, etc }

    // TODO: Hacer llamada a ServiceRoom para actualizar permisos
    // await updateRoomPermissionsInService(roomId, permissions);

    res.json({
      success: true,
      message: 'Permisos actualizados',
      data: {
        roomId,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error updating room permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando permisos',
    });
  }
};

// ============ GESTIÓN DE PARTICIPANTES ORG ============

/**
 * Agregar participante (número de carnet) al plan ORG
 * Solo el contractante puede hacer esto
 */
export const addOrgParticipant = async (req, res) => {
  try {
    const { userId } = req;
    const { subscriptionId } = req.params;
    const { carnetNumber, studentName, studentEmail } = req.body;

    if (!carnetNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de carnet es obligatorio'
      });
    }

    // Verificar que la suscripción pertenece al usuario
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
      planName: 'ORG',
      status: 'active'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado o suscripción no encontrada'
      });
    }

    // Verificar que hay espacio disponible
    const capacityCheck = await canAddMoreParticipants(subscriptionId);
    if (!capacityCheck.canAdd) {
      return res.status(403).json({
        success: false,
        message: `Límite de participantes alcanzado (${capacityCheck.current}/${capacityCheck.limit})`,
        stats: capacityCheck
      });
    }

    // Agregar participante
    const result = await addParticipantToORG(subscriptionId, carnetNumber, {
      name: studentName,
      email: studentEmail
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

    // Enviar email de invitación si hay email
    if (studentEmail) {
      try {
        await sendParticipantInvitationEmail(
          studentEmail,
          studentName || carnetNumber,
          carnetNumber,
          subscription.orgInfo?.institutionName || 'SynapseCode'
        );
      } catch (emailError) {
        console.warn('[WARN] Error sending invitation email:', emailError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Participante agregado exitosamente',
      data: result.participant
    });
  } catch (error) {
    console.error('addOrgParticipant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando participante'
    });
  }
};

/**
 * Obtener lista de participantes del plan ORG
 */
export const getOrgParticipantsList = async (req, res) => {
  try {
    const { userId } = req;
    const { subscriptionId } = req.params;
    const { status } = req.query;

    // Verificar que la suscripción pertenece al usuario
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
      planName: 'ORG'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Obtener participantes
    const participants = await getOrgParticipants(subscriptionId, status);

    // Obtener estadísticas
    const stats = await getParticipantsStats(subscriptionId);

    res.json({
      success: true,
      data: participants,
      stats
    });
  } catch (error) {
    console.error('getOrgParticipantsList error:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo participantes'
    });
  }
};

/**
 * Remover un participante del plan ORG
 */
export const removeOrgParticipant = async (req, res) => {
  try {
    const { userId } = req;
    const { subscriptionId, carnetNumber } = req.params;

    // Verificar que la suscripción pertenece al usuario
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
      planName: 'ORG'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Remover participante
    const result = await removeParticipant(subscriptionId, carnetNumber);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Participante removido',
      data: result.participant
    });
  } catch (error) {
    console.error('removeOrgParticipant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removiendo participante'
    });
  }
};

/**
 * Obtener estadísticas de participantes del plan ORG
 */
export const getOrgParticipantsStats = async (req, res) => {
  try {
    const { userId } = req;
    const { subscriptionId } = req.params;

    // Verificar que la suscripción pertenece al usuario
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
      planName: 'ORG'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Obtener estadísticas
    const stats = await getParticipantsStats(subscriptionId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('getOrgParticipantsStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
};

/**
 * Validar carnet para acceso (endpoint público para verificación desde otros servicios)
 * Los servicios pueden llamar esto para verificar que un carnet es válido
 */
export const validateCarnetAccess = async (req, res) => {
  try {
    const { subscriptionId, carnetNumber } = req.body;

    if (!subscriptionId || !carnetNumber) {
      return res.status(400).json({
        success: false,
        message: 'subscriptionId y carnetNumber requeridos'
      });
    }

    const validation = await validateCarnetForORG(subscriptionId, carnetNumber);

    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        message: validation.message,
        error: 'INVALID_CARNET'
      });
    }

    res.json({
      success: true,
      message: 'Carnet válido',
      data: {
        participantId: validation.participant._id,
        carnetNumber: validation.participant.carnetNumber,
        status: validation.participant.status
      }
    });
  } catch (error) {
    console.error('validateCarnetAccess error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando carnet'
    });
  }
};

// ============ UTILIDADES ============

async function callAIAnalysis(code, language) {
  try {
    // TODO: Implementar llamada a API de IA (Groq)
    return {
      correctness: 'Análisis pendiente',
      improvements: [],
      bestPractices: [],
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return null;
  }
}

export default {
  requestProfessorApproval,
  approveProfessor,
  rejectProfessor,
  getApprovedProfessors,
  rateCode,
  getCodeRatings,
  setRoomAIRestrictions,
  getRoomAIRestrictions,
  getStudentAnalytics,
  updateRoomPermissions,
  addOrgParticipant,
  getOrgParticipantsList,
  removeOrgParticipant,
  getOrgParticipantsStats,
  validateCarnetAccess,
};
