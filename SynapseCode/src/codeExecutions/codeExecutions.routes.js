'use strict';
import { Router } from 'express';
import multer from 'multer';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    requireCodeExecutionRoomAccessByBodyFileId,
    requireCodeExecutionRoomAccessByFileIdParam,
    requireCodeExecutionRoomAccessByRoomIdParam,
    requireCodeExecutionRoomAccessByExecutionIdParam,
    requireCodeExecutionRoomAccessByQueryScope,
    requireCodeExecutionRoomAccessByResultQuery,
} from '../../middlewares/validate-code-execution-room-access.js';
import {
    // Judge0
    getSupportedLanguages,
    runCode,
    submitCodeAsync,
    getResultByToken,
    // CRUD
    createCodeExecution,
    getCodeExecutionsAudit,
    getCodeExecutions,
    getCodeExecutionById,
    getCodeExecutionsByFile,
    getCodeExecutionsByRoom,
    checkRateLimit,
    deleteCodeExecution,
    deleteCodeExecutionsByFile,
    deleteCodeExecutionsByRoom,
} from './codeExecutions.controller.js';

const router = Router();
const formDataParser = multer();

// JUDGE0
/**
 * @swagger
 * /api/v1/codeExecutions/languages:
 *   get:
 *     summary: Obtener lenguajes soportados por Judge0
 *     tags: [CodeExecutions]
 *     responses:
 *       200: { description: Lista de lenguajes }
 */
router.get('/languages', getSupportedLanguages); // Publica, sin JWT
router.get('/audit/executors', validateJWT, requireRole('ADMIN_ROLE'), getCodeExecutionsAudit);

/**
 * @swagger
 * /api/v1/codeExecutions/run:
 *   post:
 *     summary: Ejecutar código de forma síncrona
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language: { type: string, description: "Lenguaje de programación" }
 *               code: { type: string, description: "Código a ejecutar" }
 *               input: { type: string, description: "Entrada estándar" }
 *               fileId: { type: string, description: "ID del archivo" }
 *     responses:
 *       200: { description: Resultado de la ejecución }
 *       400: { description: Error en la ejecución }
 */
router.post('/run', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), runCode); // Ejecucion sincrona (recomendada)

/**
 * @swagger
 * /api/v1/codeExecutions/submit:
 *   post:
 *     summary: Enviar código para ejecución asíncrona
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language: { type: string }
 *               code: { type: string }
 *               input: { type: string }
 *               fileId: { type: string }
 *     responses:
 *       200: { description: Token para consultar resultado }
 */
router.post('/submit', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), submitCodeAsync); // Ejecucion asincrona

/**
 * @swagger
 * /api/v1/codeExecutions/result/{token}:
 *   get:
 *     summary: Obtener resultado de ejecución por token
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Resultado de la ejecución }
 *       404: { description: Token no encontrado }
 */
router.get('/result/:token', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByResultQuery, getResultByToken); // Polling resultado por token

// RATE LIMIT
router.get('/rate-limit', validateJWT, requireRole('USER_ROLE'), checkRateLimit);

// CONSULTAS
/**
 * @swagger
 * /api/v1/codeExecutions:
 *   get:
 *     summary: Obtener ejecuciones de código con filtros
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema: { type: string }
 *       - in: query
 *         name: fileId
 *         schema: { type: string }
 *       - in: query
 *         name: executionStatus
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de ejecuciones }
 */
router.get('/', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByQueryScope, getCodeExecutions); // Todas (filtros: ?roomId= &fileId= &userId= &executionStatus= &language=)
router.get('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByFileIdParam, getCodeExecutionsByFile); // Historial de un archivo
router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByRoomIdParam, getCodeExecutionsByRoom); // Todas las de una sala
router.get('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByExecutionIdParam, getCodeExecutionById); // Por ID

// CREAR
router.post('/', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), createCodeExecution);

// ELIMINAR
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByFileIdParam, deleteCodeExecutionsByFile);
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByRoomIdParam, deleteCodeExecutionsByRoom);
router.delete('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByExecutionIdParam, deleteCodeExecution);

export default router;