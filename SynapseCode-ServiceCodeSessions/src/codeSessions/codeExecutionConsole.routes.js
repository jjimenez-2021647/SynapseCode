'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    startExecutionConsole,
    getConsoleStatus,
    submitConsoleInput,
    stopConsoleExecution,
    getConsoleOutput,
    connectUserToConsole,
    disconnectUserFromConsole,
} from './codeExecutionConsole.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/console/start:
 *   post:
 *     summary: Iniciar consola interactiva de ejecución
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: "ID de la sesión"
 *               fileId:
 *                 type: string
 *                 description: "ID del archivo"
 *               roomId:
 *                 type: string
 *                 description: "ID de la sala"
 *               code:
 *                 type: string
 *                 description: "Código a ejecutar"
 *               language:
 *                 type: string
 *                 default: javascript
 *               stdin:
 *                 type: string
 *                 description: "Input estándar (opcional)"
 *     responses:
 *       201:
 *         description: "Consola iniciada"
 */
router.post('/start', validateJWT, startExecutionConsole);

/**
 * @swagger
 * /api/v1/console/{consoleId}:
 *   get:
 *     summary: Obtener estado de consola
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Estado obtenido"
 */
router.get('/:consoleId', validateJWT, getConsoleStatus);

/**
 * @swagger
 * /api/v1/console/{consoleId}/output:
 *   get:
 *     summary: Obtener output completo
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Output obtenido"
 */
router.get('/:consoleId/output', validateJWT, getConsoleOutput);

/**
 * @swagger
 * /api/v1/console/{consoleId}/input:
 *   post:
 *     summary: Enviar input a la consola
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *                 description: "Input a enviar"
 *     responses:
 *       200:
 *         description: "Input procesado"
 */
router.post('/:consoleId/input', validateJWT, submitConsoleInput);

/**
 * @swagger
 * /api/v1/console/{consoleId}/stop:
 *   post:
 *     summary: Detener ejecución
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Ejecución detenida"
 */
router.post('/:consoleId/stop', validateJWT, stopConsoleExecution);

/**
 * @swagger
 * /api/v1/console/{consoleId}/connect:
 *   post:
 *     summary: Conectar usuario a consola
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Usuario conectado"
 */
router.post('/:consoleId/connect', validateJWT, connectUserToConsole);

/**
 * @swagger
 * /api/v1/console/{consoleId}/disconnect:
 *   post:
 *     summary: Desconectar usuario de consola
 *     tags: [CodeExecutionConsole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Usuario desconectado"
 */
router.post('/:consoleId/disconnect', validateJWT, disconnectUserFromConsole);

export default router;
