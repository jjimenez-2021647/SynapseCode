'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    createRoom,
    updateRoom,
    getRoom,
    getRoomByCode,
    deleteRoom,
    deactivateRoom,
    getRoomCreatorsAudit,
    getRoomFileChanges,
} from './rooms.controller.js';

const router = Router();

router.post('/', validateJWT, requireRole('USER_ROLE'), createRoom);
router.get('/', validateJWT, getRoom);
router.get('/code/:code', validateJWT, getRoomByCode);
router.put('/code/:code', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.delete('/code/:code', validateJWT, deleteRoom);
router.post('/deactivate/:code', validateJWT, deactivateRoom);
router.get('/audit/creators', validateJWT, requireRole('ADMIN_ROLE'), getRoomCreatorsAudit);
router.get('/:code/files/:fileId/changes', validateJWT, getRoomFileChanges);

export default router;