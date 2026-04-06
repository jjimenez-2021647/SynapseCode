'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    getSupportedLanguages,
    runCode,
    submitCodeAsync,
    getResultByToken,
    createCodeExecution,
    getCodeExecutions,
    getCodeExecutionById,
    getCodeExecutionsByFile,
    getCodeExecutionsByRoom,
    getCodeExecutionsAudit,
    checkRateLimit,
    deleteCodeExecution,
    deleteCodeExecutionsByFile,
    deleteCodeExecutionsByRoom,
} from './codeExecutions.controller.js';

const router = Router();

// Lenguajes soportados (público)
router.get('/languages', getSupportedLanguages);

// Ejecución síncrona
router.post('/run', validateJWT, runCode);

// Ejecución asíncrona
router.post('/submit-async', validateJWT, submitCodeAsync);
router.get('/result/:token', validateJWT, getResultByToken);

// CRUD básico
router.post('/', validateJWT, createCodeExecution);
router.get('/', validateJWT, getCodeExecutions);
router.get('/audit/all', validateJWT, getCodeExecutionsAudit);
router.get('/rate-limit/check', validateJWT, checkRateLimit);

// Obtener por ID
router.get('/:executionId', validateJWT, getCodeExecutionById);

// Obtener por archivo/sala
router.get('/file/:fileId', validateJWT, getCodeExecutionsByFile);
router.get('/room/:roomId', validateJWT, getCodeExecutionsByRoom);

// Eliminar
router.delete('/:id', validateJWT, deleteCodeExecution);
router.delete('/file/:fileId/all', validateJWT, deleteCodeExecutionsByFile);
router.delete('/room/:roomId/all', validateJWT, deleteCodeExecutionsByRoom);

export default router;