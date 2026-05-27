'use strict'
import { Router } from 'express';
import { validateJWT }  from '../../middlewares/validate-JWT.js';
import { requireRole }  from '../../middlewares/validate-role.js';
import {
    requireCodeSessionRoomAccessByBodyFileId,
    requireCodeSessionRoomAccessBySessionIdParam,
    requireCodeSessionRoomAccessByFileIdParam,
    requireCodeSessionRoomAccessByRoomIdParam,
    requireCodeSessionRoomAccessByQueryScope,
} from '../../middlewares/validate-code-session-room-access.js';
import {
    createCodeSession,
    updateCodeSession,
    getCodeSessions,
    getCodeSessionById,
    getCodeSessionsByFile,
    getCodeSessionsByRoom,
    getLatestCodeSession,
    getCodeSessionByVersion,
    deleteCodeSession,
    deleteCodeSessionsByFile,
    deleteCodeSessionsByRoom,
} from './codeSessions.controller.js';

const router = Router();

// CREATE
/**
 * @swagger
 * /api/v1/codeSessions:
 *   post:
 *     summary: Crear sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId: { type: string, description: "ID del archivo" }
 *               // `code` opcional: si se omite, se utiliza el contenido actual del archivo
 *               code: { type: string, description: "Código de la sesión (opcional)" }
 *     responses:
 *       201: { description: Sesión creada }
 *       400: { description: Datos inválidos }
 */
router.post('/', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByBodyFileId, createCodeSession);

// UPDATE
/**
 * @swagger
 * /api/v1/codeSessions/{id}:
 *   put:
 *     summary: Actualizar sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, description: "Nuevo código" }
 *     responses:
 *       200: { description: Sesión actualizada }
 *       404: { description: Sesión no encontrada }
 */
router.put('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessBySessionIdParam, updateCodeSession);

// GET 
/**
 * @swagger
 * /api/v1/codeSessions/file/{fileId}/latest:
 *   get:
 *     summary: Obtener última sesión de código de un archivo
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Última sesión }
 *       404: { description: Archivo no encontrado }
 */
router.get('/file/:fileId/latest',           validateJWT, requireCodeSessionRoomAccessByFileIdParam, getLatestCodeSession);

/**
 * @swagger
 * /api/v1/codeSessions/file/{fileId}/version/{version}:
 *   get:
 *     summary: Obtener sesión de código por versión
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: version
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sesión por versión }
 *       404: { description: Sesión no encontrada }
 */
router.get('/file/:fileId/version/:version', validateJWT, requireCodeSessionRoomAccessByFileIdParam, getCodeSessionByVersion);

/**
 * @swagger
 * /api/v1/codeSessions/file/{fileId}:
 *   get:
 *     summary: Obtener sesiones de código de un archivo
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de sesiones }
 *       404: { description: Archivo no encontrado }
 */
router.get('/file/:fileId',                  validateJWT, requireCodeSessionRoomAccessByFileIdParam, getCodeSessionsByFile);

/**
 * @swagger
 * /api/v1/codeSessions/room/{roomId}:
 *   get:
 *     summary: Obtener sesiones de código de una sala
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de sesiones }
 *       404: { description: Sala no encontrada }
 */
router.get('/room/:roomId',                  validateJWT, requireCodeSessionRoomAccessByRoomIdParam, getCodeSessionsByRoom);

/**
 * @swagger
 * /api/v1/codeSessions:
 *   get:
 *     summary: Obtener sesiones de código con filtros
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema: { type: string }
 *       - in: query
 *         name: fileId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de sesiones }
 */
router.get('/',                              validateJWT, requireCodeSessionRoomAccessByQueryScope, getCodeSessions);

/**
 * @swagger
 * /api/v1/codeSessions/{id}:
 *   get:
 *     summary: Obtener sesión de código por ID
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos de la sesión }
 *       404: { description: Sesión no encontrada }
 */
router.get('/:id',                           validateJWT, requireCodeSessionRoomAccessBySessionIdParam, getCodeSessionById);

// DELETE 
/**
 * @swagger
 * /api/v1/codeSessions/file/{fileId}:
 *   delete:
 *     summary: Eliminar sesiones de código de un archivo
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sesiones eliminadas }
 *       404: { description: Archivo no encontrado }
 */
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByFileIdParam, deleteCodeSessionsByFile);

/**
 * @swagger
 * /api/v1/codeSessions/room/{roomId}:
 *   delete:
 *     summary: Eliminar sesiones de código de una sala
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sesiones eliminadas }
 *       404: { description: Sala no encontrada }
 */
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByRoomIdParam, deleteCodeSessionsByRoom);

/**
 * @swagger
 * /api/v1/codeSessions/{id}:
 *   delete:
 *     summary: Eliminar sesión de código por ID
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sesión eliminada }
 *       404: { description: Sesión no encontrada }
 */
router.delete('/:id',          validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessBySessionIdParam, deleteCodeSession);

export default router;
