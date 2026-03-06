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
} from './rooms.controller.js';

const router = Router();

router.post('/', validateJWT, requireRole('USER_ROLE'), createRoom);
router.put('/code/:code', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateRoom);
router.get('/', validateJWT, requireRole('USER_ROLE'), getRoom);
router.get('/code/:code', validateJWT, requireRole('USER_ROLE'), getRoomByCode);
router.delete('/code/:code', validateJWT, requireRole('USER_ROLE'), deleteRoom);

export default router;
