'use strict';
import { Router } from 'express';
import multer from 'multer';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    requireCodeExecutionRoomAccessByBodyFileId,
    requireCodeExecutionRoomAccessByFileIdParam,
    requireCodeExecutionRoomAccessByRoomIdParam,
    requireCodeExecutionRoomAccessByExecutionIdParam,
    requireCodeExecutionRoomAccessByQueryScope,
    requireCodeExecutionRoomAccessByResultQuery,
} from '../../middlewares/validate-code-execution-room-access.js';
import {
    // Judge0
    getSupportedLanguages,
    runCode,
    submitCodeAsync,
    getResultByToken,
    // CRUD
    createCodeExecution,
    getCodeExecutionsAudit,
    getCodeExecutions,
    getCodeExecutionById,
    getCodeExecutionsByFile,
    getCodeExecutionsByRoom,
    checkRateLimit,
    deleteCodeExecution,
    deleteCodeExecutionsByFile,
    deleteCodeExecutionsByRoom,
} from './codeExecutions.controller.js';

const router = Router();
const formDataParser = multer();

// JUDGE0
router.get('/languages', getSupportedLanguages); // Publica, sin JWT
router.get('/audit/executors', validateJWT, requireRole('ADMIN_ROLE'), getCodeExecutionsAudit);
router.post('/run', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), runCode);
router.post('/submit', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), submitCodeAsync);
router.get('/result/:token', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByResultQuery, getResultByToken);

// RATE LIMIT
router.get('/rate-limit', validateJWT, requireRole('USER_ROLE'), checkRateLimit);

// CONSULTAS
router.get('/', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByQueryScope, getCodeExecutions);
router.get('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByFileIdParam, getCodeExecutionsByFile);
router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByRoomIdParam, getCodeExecutionsByRoom);
router.get('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByExecutionIdParam, getCodeExecutionById);

// CREAR
router.post('/', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByBodyFileId, formDataParser.none(), createCodeExecution);

// ELIMINAR
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByFileIdParam, deleteCodeExecutionsByFile);
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByRoomIdParam, deleteCodeExecutionsByRoom);
router.delete('/:id', validateJWT, requireRole('USER_ROLE'), requireCodeExecutionRoomAccessByExecutionIdParam, deleteCodeExecution);

export default router;
