import { Router } from 'express';
import { validateCodeRating, validateRoomAIRestrictions } from '../../middlewares/validation.js';
import { validateCarnetFormat, validateCarnetParam } from '../../middlewares/validate-carnet.js';
import {
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
} from './org-management.controller.js';

const router = Router();

// ============ PROFESORES ============

/**
 * @route POST /api/v1/org-management/professors/request-approval
 * @desc Solicitar aprobación como profesor (ORG_ROLE)
 * @access Private (ORG_ROLE)
 */
router.post('/professors/request-approval', requestProfessorApproval);

/**
 * @route POST /api/v1/org-management/professors/:professorId/approve
 * @desc Aprobar profesor (solo quien contrató el servicio ORG)
 * @access Private (ORG contractor)
 */
router.post('/professors/:professorId/approve', approveProfessor);

/**
 * @route POST /api/v1/org-management/professors/:professorId/reject
 * @desc Rechazar profesor
 * @access Private (ORG contractor)
 */
router.post('/professors/:professorId/reject', rejectProfessor);

/**
 * @route GET /api/v1/org-management/professors/approved
 * @desc Listar profesores aprobados de la institución
 * @access Private (ORG contractor)
 */
router.get('/professors/approved', getApprovedProfessors);

// ============ CALIFICACIÓN DE CÓDIGO ============

/**
 * @route POST /api/v1/org-management/code/rate
 * @desc Calificar código de un estudiante
 * @access Private (ORG_ROLE profesor)
 */
router.post('/code/rate', validateCodeRating, rateCode);

/**
 * @route GET /api/v1/org-management/code/ratings/:roomId
 * @desc Obtener calificaciones de un código
 * @access Private (ORG_ROLE)
 */
router.get('/code/ratings/:roomId', getCodeRatings);

// ============ RESTRICCIONES DE IA ============

/**
 * @route POST /api/v1/org-management/rooms/:roomId/ai-restrictions
 * @desc Establecer restricciones de IA en una sala
 * @access Private (ORG_ROLE profesor - creator de sala)
 */
router.post('/rooms/:roomId/ai-restrictions', validateRoomAIRestrictions, setRoomAIRestrictions);

/**
 * @route GET /api/v1/org-management/rooms/:roomId/ai-restrictions
 * @desc Obtener restricciones de IA de una sala
 * @access Private
 */
router.get('/rooms/:roomId/ai-restrictions', getRoomAIRestrictions);

// ============ ANALÍTICAS ============

/**
 * @route GET /api/v1/org-management/analytics/student/:studentId
 * @desc Obtener analíticas de un estudiante
 * @access Private (ORG_ROLE profesor)
 */
router.get('/analytics/student/:studentId', getStudentAnalytics);

// ============ PERMISOS EN SALA ============

/**
 * @route PUT /api/v1/org-management/rooms/:roomId/permissions
 * @desc Actualizar permisos en la sala (editar, ejecutar, etc.)
 * @access Private (ORG_ROLE profesor - host)
 */
router.put('/rooms/:roomId/permissions', updateRoomPermissions);

// ============ GESTIÓN DE PARTICIPANTES (CARNETS) ============

/**
 * @route POST /api/v1/org-management/:subscriptionId/participants
 * @desc Agregar un nuevo participante (carnet) al plan ORG
 * @access Private (ORG contractor)
 */
router.post('/:subscriptionId/participants', validateCarnetFormat, addOrgParticipant);

/**
 * @route GET /api/v1/org-management/:subscriptionId/participants
 * @desc Obtener lista de participantes del plan ORG
 * @access Private (ORG contractor)
 */
router.get('/:subscriptionId/participants', getOrgParticipantsList);

/**
 * @route DELETE /api/v1/org-management/:subscriptionId/participants/:carnetNumber
 * @desc Remover un participante del plan ORG
 * @access Private (ORG contractor)
 */
router.delete('/:subscriptionId/participants/:carnetNumber', validateCarnetParam, removeOrgParticipant);

/**
 * @route GET /api/v1/org-management/:subscriptionId/participants/stats
 * @desc Obtener estadísticas de participantes del plan ORG
 * @access Private (ORG contractor)
 */
router.get('/:subscriptionId/participants/stats', getOrgParticipantsStats);

/**
 * @route POST /api/v1/org-management/validate-carnet
 * @desc Validar si un carnet tiene acceso a un plan ORG (endpoint público para otros servicios)
 * @access Public (con subscriptionId y carnetNumber)
 */
router.post('/validate-carnet', validateCarnetFormat, validateCarnetAccess);

export default router;
