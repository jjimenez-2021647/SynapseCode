'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    createRoom,
    updateRoom,
    getRoom,
    getRoomByCode,
    getRoomById,
    deleteRoom,
    deactivateRoom,
    getRoomCreatorsAudit,
    getRoomFileChanges,
    debugRoomCount,
    debugAllConnectedParticipations,
    debugRoomsWithParticipations,
    debugTokenExtraction,
    debugUserParticipations,
} from './rooms.controller.js';

const router = Router();

router.post('/', validateJWT, requireRole('USER_ROLE'), createRoom);
router.get('/', validateJWT, getRoom);
router.get('/debug/room-count', validateJWT, debugRoomCount);
router.get('/debug/all-connected', validateJWT, requireRole('ADMIN_ROLE'), debugAllConnectedParticipations);
router.get('/debug/rooms-with-participations', validateJWT, requireRole('ADMIN_ROLE'), debugRoomsWithParticipations);
router.get('/debug/token-extraction', validateJWT, requireRole('ADMIN_ROLE'), debugTokenExtraction);
router.get('/debug/user-participations', validateJWT, requireRole('ADMIN_ROLE'), debugUserParticipations);
router.get('/:roomId', validateJWT, getRoomById);
router.get('/code/:code', validateJWT, getRoomByCode);
router.put('/code/:code', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.delete('/code/:code', validateJWT, deleteRoom);
router.post('/deactivate/:code', validateJWT, deactivateRoom);
router.get('/audit/creators', validateJWT, requireRole('ADMIN_ROLE'), getRoomCreatorsAudit);
router.get('/:code/files/:fileId/changes', validateJWT, getRoomFileChanges);

export default router;