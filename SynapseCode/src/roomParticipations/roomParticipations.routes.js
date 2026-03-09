'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
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
router.post('/', validateJWT, requireRole('USER_ROLE'), createRoomParticipation);

// Solo USER_ROLE puede editar (el controller filtra si es HOST_ROLE de esa sala)
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateRoomParticipation);

router.get('/', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipations);

// Solo USER_ROLE puede listar integrantes de su sala
router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipationsByRoom);

router.get('/user/:userId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomParticipationsByUser);

// Cualquier USER_ROLE puede salir de la sala
router.patch('/:id/leave', validateJWT, requireRole('USER_ROLE'), leaveRoomParticipation);

// Solo USER_ROLE puede eliminar (el controller filtra si es HOST_ROLE de esa sala)
router.delete('/:id', validateJWT, requireRole('USER_ROLE'), deleteRoomParticipation);

export default router;

