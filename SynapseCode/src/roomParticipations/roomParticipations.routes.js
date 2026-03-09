'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    createRoomParticipation,
    updateRoomParticipation,
    getRoomParticipations,
    getRoomParticipationsByRoom,
    getRoomParticipationsByUser,
    deleteRoomParticipation,
    leaveRoomParticipation,
} from './roomParticipations.controller.js';

const router = Router();

// Cualquier USER_ROLE puede unirse a una sala
/**
 * @swagger
 * /api/v1/room-participations:
 *   post:
 *     summary: Unirse a una sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId: { type: string, description: "ID de la sala" }
 *               role: { type: string, enum: ['HOST_ROLE', 'ASSISTANT_ROLE'], description: "Rol en la sala" }
 *     responses:
 *       201: { description: Participación creada }
 *       400: { description: Datos inválidos }
 */
router.post('/', validateJWT, requireRole('USER_ROLE'), createRoomParticipation);

// Solo USER_ROLE puede editar (el controller filtra si es HOST_ROLE de esa sala)
 /**
 * @swagger
 * /api/v1/room-participations/{id}:
 *   put:
 *     summary: Actualizar participación en sala
 *     tags: [RoomParticipations]
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
 *               role: { type: string, enum: ['HOST_ROLE', 'ASSISTANT_ROLE'] }
 *     responses:
 *       200: { description: Participación actualizada }
 *       404: { description: Participación no encontrada }
 */
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateRoomParticipation);

/**
 * @swagger
 * /api/v1/room-participations:
 *   get:
 *     summary: Obtener participaciones en salas
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de participaciones }
 */
router.get('/', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipations);

// Solo USER_ROLE puede listar integrantes de su sala
/**
 * @swagger
 * /api/v1/room-participations/room/{roomId}:
 *   get:
 *     summary: Obtener participaciones de una sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de participaciones en la sala }
 *       404: { description: Sala no encontrada }
 */
router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipationsByRoom);

/**
 * @swagger
 * /api/v1/room-participations/user/{userId}:
 *   get:
 *     summary: Obtener participaciones de un usuario
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de participaciones del usuario }
 */
router.get('/user/:userId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipationsByUser);

// Cualquier USER_ROLE puede salir de la sala
/**
 * @swagger
 * /api/v1/room-participations/{id}/leave:
 *   patch:
 *     summary: Salir de una sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Salida de la sala exitosa }
 *       404: { description: Participación no encontrada }
 */
router.patch('/:id/leave', validateJWT, requireRole('USER_ROLE'), leaveRoomParticipation);

// Solo USER_ROLE puede eliminar (el controller filtra si es HOST_ROLE de esa sala)
 /**
 * @swagger
 * /api/v1/room-participations/{id}:
 *   delete:
 *     summary: Eliminar participación en sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Participación eliminada }
 *       404: { description: Participación no encontrada }
 */
router.delete('/:id', validateJWT, requireRole('USER_ROLE'), deleteRoomParticipation);

export default router;

