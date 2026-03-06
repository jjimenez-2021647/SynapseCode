'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createRoom,
    updateRoom,
    getRoom,
    getRoomByCode,
    deleteRoom,
} from './rooms.controller.js';

const router = Router();

router.post('/', validateJWT, createRoom);
router.put('/:id', updateRoom);
router.get('/', getRoom);
router.get('/code/:code', getRoomByCode);
router.delete('/code/:code', deleteRoom);

export default router;
