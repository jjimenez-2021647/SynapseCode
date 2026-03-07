'use strict';
import { Router } from 'express';
import multer from 'multer';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole }  from '../../middlewares/validate-role.js';
import { requireRoomMembershipByFileId } from '../../middlewares/validate-user-room-membership-by-file.js';
import {
    // Judge0
    getSupportedLanguages,
    runCode,
    submitCodeAsync,
    getResultByToken,
    // CRUD
    createCodeExecution,
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
router.get('/languages', getSupportedLanguages); // Pública, sin JWT
router.post('/run', validateJWT, requireRole('USER_ROLE'), requireRoomMembershipByFileId, formDataParser.none(), runCode); // Ejecución síncrona (recomendada)
router.post('/submit', validateJWT, requireRole('USER_ROLE'), requireRoomMembershipByFileId, formDataParser.none(), submitCodeAsync); // Ejecución asíncrona
router.get('/result/:token', validateJWT, getResultByToken); // Polling resultado por token

// RATE LIMIT
router.get('/rate-limit', validateJWT, checkRateLimit);

// CONSULTAS 
router.get('/', validateJWT, getCodeExecutions); // Todas (filtros: ?roomId= &fileId= &userId= &executionStatus= &language=)
router.get('/file/:fileId', validateJWT, getCodeExecutionsByFile); // Historial de un archivo
router.get('/room/:roomId', validateJWT, getCodeExecutionsByRoom); // Todas las de una sala
router.get('/:id', validateJWT, getCodeExecutionById);        // Por ID

// CREAR
router.post('/', validateJWT, requireRole('USER_ROLE'), formDataParser.none(), createCodeExecution);

// ELIMINAR 
router.delete('/file/:fileId', validateJWT, requireRole('USER_ROLE'), deleteCodeExecutionsByFile);
router.delete('/room/:roomId', validateJWT, requireRole('USER_ROLE'), deleteCodeExecutionsByRoom);
router.delete('/:id', validateJWT, requireRole('USER_ROLE'), deleteCodeExecution);

export default router;
