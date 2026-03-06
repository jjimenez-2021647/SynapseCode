'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
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

router.post('/', validateJWT, createRoomParticipation);
router.put('/:id', updateRoomParticipation);
router.get('/', getRoomParticipations);
router.get('/room/:roomId', getRoomParticipationsByRoom);
router.get('/user/:userId', getRoomParticipationsByUser);
router.patch('/:id/leave', leaveRoomParticipation);
router.delete('/:id', deleteRoomParticipation);

export default router;

