'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    batchCreateChats,
    getChats,
    getChatByRoomAndType,
    deleteChatsForRoom,
} from './chats.controller.js';

const router = Router();

router.post('/batch-create', validateJWT, batchCreateChats);
router.get('/', validateJWT, getChats);
router.get('/room-type', validateJWT, getChatByRoomAndType);
router.delete('/room/:roomId', validateJWT, deleteChatsForRoom);

export default router;