'use strict'
import { Router } from 'express';
import {
    createMessage,
    getRoomMessages,
    getMessageById,
    editMessage,
    deleteMessage,
    getSystemMessages,
    createSystemMessage,
} from './messages.controller.js';
import validateJWT from '../../middlewares/validate-JWT.js';
import uploadMiddleware from '../../middlewares/cloudinary.js';

const router = Router();

router.post('/', validateJWT, uploadMiddleware.single('file'), createMessage);

router.get('/:messageId', validateJWT, getMessageById);

router.get('/room/:roomId', validateJWT, getRoomMessages);

router.patch('/:messageId', validateJWT, editMessage);

router.delete('/:messageId', validateJWT, deleteMessage);

router.get('/system/list/:roomId', validateJWT, getSystemMessages);

router.post('/system/create', validateJWT, createSystemMessage);

export default router;
