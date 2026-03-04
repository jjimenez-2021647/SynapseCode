'use strict'
import { Router } from 'express';
import { validateJWT }  from '../../middlewares/validate-JWT.js';
import { requireRole }  from '../../middlewares/validate-role.js';
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
router.post('/', validateJWT, requireRole('USER_ROLE'), createCodeSession);

// UPDATE
router.put('/:id', validateJWT, requireRole('USER_ROLE'), updateCodeSession);

// GET 
router.get('/file/:fileId/latest',           validateJWT, getLatestCodeSession);
router.get('/file/:fileId/version/:version', validateJWT, getCodeSessionByVersion);
router.get('/file/:fileId',                  validateJWT, getCodeSessionsByFile);
router.get('/room/:roomId',                  validateJWT, getCodeSessionsByRoom);
router.get('/',                              validateJWT, getCodeSessions);
router.get('/:id',                           validateJWT, getCodeSessionById);

// DELETE 
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), deleteCodeSessionsByFile);
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), deleteCodeSessionsByRoom);
router.delete('/:id',          validateJWT, requireRole('USER_ROLE'), deleteCodeSession);

export default router;