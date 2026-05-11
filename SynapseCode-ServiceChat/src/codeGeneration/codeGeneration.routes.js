'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    generateCodeProposal,
    getCodeProposal,
    approveCodeProposal,
    rejectCodeProposal,
    listCodeProposals,
} from './codeGeneration.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/code-generation/propose:
 *   post:
 *     summary: Generar una propuesta de código incremental
 *     tags: [CodeGeneration]
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
 *               currentCode:
 *                 type: string
 *                 description: "Código actual (base)"
 *               language:
 *                 type: string
 *                 default: javascript
 *               request:
 *                 type: string
 *                 description: "Solicitud del usuario (ej: 'agregar función validar')"
 *               context:
 *                 type: string
 *                 description: "Contexto adicional (opcional)"
 *     responses:
 *       201:
 *         description: "Propuesta generada"
 *       400:
 *         description: "Datos inválidos"
 */
router.post('/propose', validateJWT, generateCodeProposal);

/**
 * @swagger
 * /api/v1/code-generation/proposal/{proposalId}:
 *   get:
 *     summary: Obtener una propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Propuesta obtenida"
 *       404:
 *         description: "Propuesta no encontrada"
 */
router.get('/proposal/:proposalId', validateJWT, getCodeProposal);

/**
 * @swagger
 * /api/v1/code-generation/proposal/{proposalId}/approve:
 *   post:
 *     summary: Aprobar una propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Propuesta aprobada"
 *       400:
 *         description: "Propuesta ya fue procesada"
 */
router.post('/proposal/:proposalId/approve', validateJWT, approveCodeProposal);

/**
 * @swagger
 * /api/v1/code-generation/proposal/{proposalId}/reject:
 *   post:
 *     summary: Rechazar una propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: "Razón del rechazo (opcional)"
 *     responses:
 *       200:
 *         description: "Propuesta rechazada"
 */
router.post('/proposal/:proposalId/reject', validateJWT, rejectCodeProposal);

/**
 * @swagger
 * /api/v1/code-generation/proposals/file/{fileId}:
 *   get:
 *     summary: Listar propuestas de código de un archivo
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: "Filtrar por estado (pending, approved, rejected)"
 *       - in: query
 *         name: roomId
 *         schema: { type: string }
 *         description: "Filtrar por sala"
 *     responses:
 *       200:
 *         description: "Lista de propuestas"
 */
router.get('/proposals/file/:fileId', validateJWT, listCodeProposals);

export default router;
