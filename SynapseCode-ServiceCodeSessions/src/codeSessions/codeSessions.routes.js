'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
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

// CRUD básico
router.post('/', validateJWT, createCodeSession);
router.get('/', validateJWT, getCodeSessions);
router.get('/:sessionId', validateJWT, getCodeSessionById);
router.put('/:id', validateJWT, updateCodeSession);
router.delete('/:id', validateJWT, deleteCodeSession);

// Obtener sesiones por archivo
router.get('/file/:fileId', validateJWT, getCodeSessionsByFile);
router.get('/file/:fileId/latest', validateJWT, getLatestCodeSession);
router.get('/file/:fileId/version/:version', validateJWT, getCodeSessionByVersion);

// Obtener sesiones por sala
router.get('/room/:roomId', validateJWT, getCodeSessionsByRoom);

// Eliminar en batch
router.delete('/file/:fileId/all', validateJWT, deleteCodeSessionsByFile);
router.delete('/room/:roomId/all', validateJWT, deleteCodeSessionsByRoom);

export default router;