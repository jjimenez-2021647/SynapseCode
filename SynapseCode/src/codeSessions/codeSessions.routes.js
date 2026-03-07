'use strict'
import { Router } from 'express';
import { validateJWT }  from '../../middlewares/validate-JWT.js';
import { requireRole }  from '../../middlewares/validate-role.js';
import {
    requireCodeSessionRoomAccessByBodyFileId,
    requireCodeSessionRoomAccessBySessionIdParam,
    requireCodeSessionRoomAccessByFileIdParam,
    requireCodeSessionRoomAccessByRoomIdParam,
    requireCodeSessionRoomAccessByQueryScope,
} from '../../middlewares/validate-code-session-room-access.js';
import {
    createCodeSession,
    updateCodeSession,
    getCodeSessions,
    getCodeSessionById,
    getCodeSessionsByFile,
    getCodeSessionsByRoom,
    getLatestCodeSession,
    getCodeSessionByVersion,
    deleteCodeSession,
    deleteCodeSessionsByFile,
    deleteCodeSessionsByRoom,
} from './codeSessions.controller.js';

const router = Router();

// CREATE
router.post('/', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByBodyFileId, createCodeSession);

// UPDATE
router.put('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessBySessionIdParam, updateCodeSession);

// GET 
router.get('/file/:fileId/latest',           validateJWT, requireCodeSessionRoomAccessByFileIdParam, getLatestCodeSession);
router.get('/file/:fileId/version/:version', validateJWT, requireCodeSessionRoomAccessByFileIdParam, getCodeSessionByVersion);
router.get('/file/:fileId',                  validateJWT, requireCodeSessionRoomAccessByFileIdParam, getCodeSessionsByFile);
router.get('/room/:roomId',                  validateJWT, requireCodeSessionRoomAccessByRoomIdParam, getCodeSessionsByRoom);
router.get('/',                              validateJWT, requireCodeSessionRoomAccessByQueryScope, getCodeSessions);
router.get('/:id',                           validateJWT, requireCodeSessionRoomAccessBySessionIdParam, getCodeSessionById);

// DELETE 
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByFileIdParam, deleteCodeSessionsByFile);
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessByRoomIdParam, deleteCodeSessionsByRoom);
router.delete('/:id',          validateJWT, requireRole('USER_ROLE'), requireCodeSessionRoomAccessBySessionIdParam, deleteCodeSession);

export default router;
