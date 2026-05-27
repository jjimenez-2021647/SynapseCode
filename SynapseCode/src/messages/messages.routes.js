'use strict'
import { Router } from 'express';
import {
    createMessage,
    getRoomMessages,
    getMessageById,
    editMessage,
    deleteMessage,
    getSystemMessages,
} from './messages.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { upload as uploadMiddleware } from '../../middlewares/cloudinary.js';

const router = Router();

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Crear un mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               numberChat: { type: string, description: "Número del chat (ya incluye la sala)" }
 *               typeMessage: { type: string, description: "Tipo de mensaje (TEXTO, IMAGEN, AUDIO, ARCHIVO)" }
 *               content: { type: string, description: "Contenido del mensaje" }
 *               modifyCodeSessions: { type: string, description: "Modo de modificación (NO_MODIFICAR o MODIFICAR)" }
 *               file: { type: string, format: binary, description: "Archivo adjunto" }
 *             required: [numberChat, typeMessage, content]
 *     responses:
 *       201: { description: Mensaje creado }
 *       400: { description: Datos inválidos }
 */
router.post('/', validateJWT, requireRole('USER_ROLE'), uploadMiddleware.single('file'), createMessage);

/**
 * @swagger
 * /api/v1/messages/room/{roomId}/chat/{numberChat}:
 *   get:
 *     summary: Obtener mensajes de un chat específico dentro de una sala
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: numberChat
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de mensajes del chat }
 *       404: { description: Sala o chat no encontrado }
 */
router.get('/room/:roomId/chat/:numberChat', validateJWT, requireRole('USER_ROLE'), getRoomMessages);

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   get:
 *     summary: Obtener mensaje por ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del mensaje }
 *       404: { description: Mensaje no encontrado }
 */
router.get('/:messageId', validateJWT, requireRole('USER_ROLE'), getMessageById);

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   patch:
 *     summary: Editar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: Mensaje editado }
 *       404: { description: Mensaje no encontrado }
 */
router.patch('/:messageId', validateJWT, requireRole('USER_ROLE'), editMessage);

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   delete:
 *     summary: Eliminar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mensaje eliminado }
 *       404: { description: Mensaje no encontrado }
 */
router.delete('/:messageId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deleteMessage);

/**
 * @swagger
 * /api/v1/messages/system/list/{roomId}:
 *   get:
 *     summary: Obtener mensajes del sistema de una sala
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de mensajes del sistema }
 */
router.get('/system/list/:roomId', validateJWT, requireRole('USER_ROLE'), getSystemMessages);

export default router;
