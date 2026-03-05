'use strict'
import { Router } from 'express';
import {
    createMessage,
    getRoomMessages,
    getMessageById,
    editMessage,
    deleteMessage,
    getSystemMessages,
    createSystemMessage,
} from './messages.controller.js';
import validateJWT from '../../middlewares/validate-JWT.js';
import uploadMiddleware from '../../middlewares/cloudinary.js';

const router = Router();

/**
 * POST /api/messages
 * Crear un nuevo mensaje
 * Body: {
 *   "roomId": "65abc123",
 *   "messageType": "TEXTO" | "IMAGEN" | "AUDIO" | "ARCHIVO",
 *   "content": "Texto del mensaje" (para TEXTO) | null (para archivos)
 * }
 * File: archivo (para IMAGEN, AUDIO, ARCHIVO)
 */
router.post('/', validateJWT, uploadMiddleware.single('file'), createMessage);

/**
 * GET /api/messages/:messageId
 * Obtener un mensaje específico por ID
 */
router.get('/:messageId', validateJWT, getMessageById);

/**
 * GET /api/messages/room/:roomId
 * Obtener todos los mensajes de una sala con paginación
 * Query params:
 * - page: número de página (default: 1)
 * - limit: cantidad de mensajes por página (default: 50)
 */
router.get('/room/:roomId', validateJWT, getRoomMessages);

/**
 * PATCH /api/messages/:messageId
 * Editar un mensaje existente
 * Solo permite edición dentro de 30 minutos
 * Solo el autor puede editar
 * Body: {
 *   "content": "Contenido actualizado"
 * }
 */
router.patch('/:messageId', validateJWT, editMessage);

/**
 * DELETE /api/messages/:messageId
 * Eliminar un mensaje (soft delete)
 * Solo permite eliminación dentro de 30 minutos
 * Solo el autor puede eliminar
 */
router.delete('/:messageId', validateJWT, deleteMessage);

/**
 * GET /api/messages/system/:roomId
 * Obtener todos los mensajes del sistema de una sala
 */
router.get('/system/list/:roomId', validateJWT, getSystemMessages);

/**
 * POST /api/messages/system/create
 * Crear un mensaje del sistema automáticamente
 * Body: {
 *   "roomId": "65abc123",
 *   "templateKey": "USER_JOINED",
 *   "values": {
 *     "username": "Juan Pérez"
 *   }
 * }
 * Claves de plantilla disponibles:
 * - USER_JOINED: {username}
 * - USER_LEFT: {username}
 * - USER_KICKED: {username}
 * - LANGUAGE_CHANGED: {username}, {language}
 * - CODE_EXECUTED_SUCCESS: {duration}
 * - CODE_EXECUTION_ERROR: {error}
 * - SESSION_SAVED: {username}, {version}
 * - ROOM_CLOSED: (sin parámetros)
 * - ROOM_FULL: {maxUsers}
 * - PERMISSIONS_REVOKED: {username}
 * - PERMISSIONS_GRANTED: {username}
 * - CODE_EXECUTION_TIMEOUT: (sin parámetros)
 * - PARTICIPANT_ROLE_CHANGED: {username}, {role}
 * - ROOM_LANGUAGE_ENFORCED: {language}
 */
router.post('/system/create', validateJWT, createSystemMessage);

export default router;
