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
    getMyParticipationStatus,
    cleanupParticipations,
} from './roomParticipations.controller.js';

const router = Router();

// DIAGNÓSTICO Y LIMPIEZA (rutas específicas PRIMERO)
router.get('/my/status', validateJWT, getMyParticipationStatus);
router.post('/my/cleanup', validateJWT, cleanupParticipations);

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