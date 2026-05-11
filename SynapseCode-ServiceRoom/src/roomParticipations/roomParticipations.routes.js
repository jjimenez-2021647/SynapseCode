'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createRoomParticipation,
    getRoomParticipations,
    getRoomParticipationsByRoom,
    getRoomParticipationsByUser,
    updateRoomParticipation,
    updateParticipationStatus,
    leaveRoomParticipation,
    deleteRoomParticipation,
} from './roomParticipations.controller.js';

const router = Router();

// CRUD básico
router.post('/', validateJWT, createRoomParticipation);
router.get('/', validateJWT, getRoomParticipations);
router.put('/:id', validateJWT, updateRoomParticipation);
router.delete('/:id', validateJWT, deleteRoomParticipation);

// Obtener participaciones por sala/usuario
router.get('/room/:roomId', validateJWT, getRoomParticipationsByRoom);
router.get('/user/:userId', validateJWT, getRoomParticipationsByUser);

// Operaciones especiales
router.put('/:participationId/status', validateJWT, updateParticipationStatus);
router.post('/:id/leave', validateJWT, leaveRoomParticipation);

export default router;