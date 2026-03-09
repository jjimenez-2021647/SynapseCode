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
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { upload as uploadMiddleware } from '../../middlewares/cloudinary.js';

const router = Router();

router.post('/', validateJWT, requireRole('USER_ROLE'), uploadMiddleware.single('file'), createMessage);

router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE'), getRoomMessages);
router.get('/:messageId', validateJWT, requireRole('USER_ROLE'), getMessageById);

router.patch('/:messageId', validateJWT, requireRole('USER_ROLE'), editMessage);

router.delete('/:messageId', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), deleteMessage);

router.get('/system/list/:roomId', validateJWT, requireRole('USER_ROLE'), getSystemMessages);

router.post('/system/create', validateJWT, requireRole('USER_ROLE'), createSystemMessage);

export default router;
