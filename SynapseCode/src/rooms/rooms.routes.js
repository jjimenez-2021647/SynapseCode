'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    createRoom,
    updateRoom,
    getRoom,
    getRoomByCode,
    getRoomCreatorsAudit,
    deleteRoom,
    deactivateRoom,
    getRoomFileChanges
} from './rooms.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/rooms:
 *   post:
 *     summary: Crear una nueva sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: "Nombre de la sala" }
 *               description: { type: string, description: "Descripción de la sala" }
 *               isPrivate: { type: boolean, description: "Si la sala es privada" }
 *     responses:
 *       201: { description: Sala creada exitosamente }
 *       400: { description: Datos inválidos }
 *       401: { description: No autorizado }
 */
router.post('/', validateJWT, requireRole('USER_ROLE'), createRoom);

/**
 * @swagger
 * /api/v1/rooms/audit/creators:
 *   get:
 *     summary: Obtener auditoría de creadores de salas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de creadores }
 *       401: { description: No autorizado }
 *       403: { description: Rol insuficiente }
 */
router.get('/audit/creators', validateJWT, requireRole('ADMIN_ROLE'), getRoomCreatorsAudit);

/**
 * @swagger
 * /api/v1/rooms/code/{code}:
 *   put:
 *     summary: Actualizar sala por código
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Sala actualizada }
 *       404: { description: Sala no encontrada }
 */
router.put('/code/:code', validateJWT, requireRole('USER_ROLE'), updateRoom);

/**
 * @swagger
 * /api/v1/rooms/{id}:
 *   put:
 *     summary: Actualizar sala por ID
 *     tags: [Rooms]
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
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Sala actualizada }
 *       404: { description: Sala no encontrada }
 */
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateRoom);

/**
 * @swagger
 * /api/v1/rooms/code/{code}/deactivate:
 *   patch:
 *     summary: Desactivar sala por código
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sala desactivada }
 *       404: { description: Sala no encontrada }
 */
router.patch('/code/:code/deactivate', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deactivateRoom);

/**
 * @swagger
 * /api/v1/rooms:
 *   get:
 *     summary: Obtener salas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de salas }
 *       401: { description: No autorizado }
 */
router.get('/', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoom);

/**
 * @swagger
 * /api/v1/rooms/code/{code}:
 *   get:
 *     summary: Obtener sala por código
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos de la sala }
 *       404: { description: Sala no encontrada }
 */
router.get('/code/:code', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomByCode);

/**
 * @swagger
 * /api/v1/rooms/code/{code}:
 *   delete:
 *     summary: Eliminar sala por código
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sala eliminada }
 *       404: { description: Sala no encontrada }
 */
router.delete('/code/:code', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deleteRoom);

/**
 * @swagger
 * /api/v1/rooms/code/{code}/file/{fileId}:
 *   get:
 *     summary: Obtener cambios recientes en un archivo dentro de una sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cambios del archivo }
 *       404: { description: Sala o archivo no encontrado }
 */
router.get('/code/:code/file/:fileId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomFileChanges);

export default router;
