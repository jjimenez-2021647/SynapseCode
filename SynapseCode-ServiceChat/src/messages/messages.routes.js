'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createMessage,
    getMessages,
    getRoomMessages,
    getMessageById,
    editMessage,
    getSystemMessages,
    createSystemMessage,
    deleteMessage,
} from './messages.controller.js';

const router = Router();

// CRUD básico
router.post('/', validateJWT, createMessage);
router.get('/', validateJWT, getMessages);
router.get('/:messageId', validateJWT, getMessageById);
router.put('/:messageId', validateJWT, editMessage);
router.delete('/:messageId', validateJWT, deleteMessage);

// Obtener mensajes de sala
router.get('/room/:roomId', validateJWT, getRoomMessages);

// Mensajes de sistema
router.get('/system/all', validateJWT, getSystemMessages);
router.post('/system/create', validateJWT, createSystemMessage);

export default router;