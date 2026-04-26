'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createExplanation,
    listExplanations,
    getExplanationById,
    deleteExplanation,
    explainCode,
} from './explication.controller.js';
import {
    startCodeChat,
    sendChatMessage,
    getChatHistory,
    listCodeChats,
    deleteCodeChat,
} from './codeChat.controller.js';
import {
    generateCodeProposal,
    getCodeProposal,
    listCodeProposals,
    approveCodeProposal,
    rejectCodeProposal,
} from './codeProposal.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE EXPLICACIONES (versión específica del código)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/explication/explain:
 *   post:
 *     summary: Genera una explicación del código usando Groq (con detección automática de tipo)
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: "ID del archivo (referencia)"
 *               code:
 *                 type: string
 *                 description: "Código a explicar"
 *               language:
 *                 type: string
 *                 default: javascript
 *                 description: "Lenguaje de programación"
 *               version:
 *                 type: number
 *                 default: 0
 *                 description: "Versión del archivo"
 *     responses:
 *       200:
 *         description: "Explicación generada exitosamente"
 *       401:
 *         description: "No autorizado"
 *       400:
 *         description: "Datos inválidos"
 *       500:
 *         description: "Error generando explicación"
 */
router.post('/explain', validateJWT, explainCode);

/**
 * @swagger
 * /api/v1/explication:
 *   post:
 *     summary: Crear una explicación manualmente
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               code:
 *                 type: string
 *               explanation:
 *                 type: string
 *               language:
 *                 type: string
 *               version:
 *                 type: number
 *     responses:
 *       201:
 *         description: "Explicación creada"
 *       400:
 *         description: "Datos inválidos"
 *   get:
 *     summary: Listar explicaciones con filtros opcionales
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileId
 *         schema: { type: string }
 *         description: "Filtrar por ID del archivo"
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: "Filtrar por ID del usuario"
 *       - in: query
 *         name: version
 *         schema: { type: number }
 *         description: "Filtrar por versión"
 *     responses:
 *       200:
 *         description: "Lista de explicaciones"
 */
router.post('/', validateJWT, createExplanation);
router.get('/', validateJWT, listExplanations);

/**
 * @swagger
 * /api/v1/explication/{id}:
 *   get:
 *     summary: Obtener una explicación por ID
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID de la explicación"
 *     responses:
 *       200:
 *         description: "Explicación encontrada"
 *       404:
 *         description: "Explicación no encontrada"
 *   delete:
 *     summary: Eliminar una explicación
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID de la explicación"
 *     responses:
 *       200:
 *         description: "Explicación eliminada"
 *       404:
 *         description: "Explicación no encontrada"
 */
router.get('/:id', validateJWT, getExplanationById);
router.delete('/:id', validateJWT, deleteExplanation);

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE CHAT SOBRE CÓDIGO (conversación dinámico)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/explication/chat/start:
 *   post:
 *     summary: Iniciar una sesión de chat sobre código
 *     tags: [CodeChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: "ID del archivo"
 *               roomId:
 *                 type: string
 *                 description: "ID de la sala"
 *               code:
 *                 type: string
 *                 description: "Código actual"
 *               language:
 *                 type: string
 *                 default: javascript
 *               explanationId:
 *                 type: string
 *                 description: "ID de la explicación inicial (opcional)"
 *               initialExplanation:
 *                 type: string
 *                 description: "Explicación inicial (opcional)"
 *     responses:
 *       201:
 *         description: "Chat iniciado"
 *       400:
 *         description: "Datos inválidos"
 */
router.post('/chat/start', validateJWT, startCodeChat);

/**
 * @swagger
 * /api/v1/explication/chat/{chatId}/message:
 *   post:
 *     summary: Enviar mensaje al chat (con streaming SSE)
 *     tags: [CodeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: "Mensaje del usuario"
 *               code:
 *                 type: string
 *                 description: "Código actualizado (opcional)"
 *     responses:
 *       200:
 *         description: "Stream de respuesta SSE"
 *       429:
 *         description: "Otra respuesta en generación"
 */
router.post('/chat/:chatId/message', validateJWT, sendChatMessage);

/**
 * @swagger
 * /api/v1/explication/chat/{chatId}:
 *   get:
 *     summary: Obtener historial de chat
 *     tags: [CodeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Historial obtenido"
 *   delete:
 *     summary: Eliminar un chat
 *     tags: [CodeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Chat eliminado"
 */
router.get('/chat/:chatId', validateJWT, getChatHistory);
router.delete('/chat/:chatId', validateJWT, deleteCodeChat);

/**
 * @swagger
 * /api/v1/explication/chat/file/{fileId}:
 *   get:
 *     summary: Listar todos los chats de un archivo
 *     tags: [CodeChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: roomId
 *         schema: { type: string }
 *         description: "Filtrar por sala (opcional)"
 *     responses:
 *       200:
 *         description: "Lista de chats"
 */
router.get('/chat/file/:fileId', validateJWT, listCodeChats);

export default router;