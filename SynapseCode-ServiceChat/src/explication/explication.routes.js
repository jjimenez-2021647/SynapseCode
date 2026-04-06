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

const router = Router();

/**
 * @swagger
 * /api/v1/explication/explain:
 *   post:
 *     summary: Genera una explicación del código usando Groq
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

export default router;