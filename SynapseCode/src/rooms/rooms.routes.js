'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
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
    deactivateRoom,
} from './rooms.controller.js';

const router = Router();

router.post('/', validateJWT, requireRole('USER_ROLE'), createRoom);
router.get('/audit/creators', validateJWT, requireRole('ADMIN_ROLE'), getRoomCreatorsAudit);
router.put('/code/:code', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.patch('/code/:code/deactivate', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deactivateRoom);
router.get('/', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoom);
router.get('/code/:code', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), getRoomByCode);
router.delete('/code/:code', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deleteRoom);

export default router;
