'use strict'
import { Router } from 'express';
import {
    createRoom,
    updateRoom,
    getRoom,
    getRoomByCode,
    deleteRoom,
} from './rooms.controller.js';

const router = Router();

router.post('/', createRoom);
router.put('/:id', updateRoom);
router.get('/', getRoom);
router.get('/code/:code', getRoomByCode);
router.delete('/code/:code', deleteRoom);

export default router;
