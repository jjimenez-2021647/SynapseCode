'use strict';
import { Router } from 'express';
import { validateJWT } from '../middlewares/validate-JWT.js';
import { requireRole }  from '../middlewares/validate-role.js';
import {
    createCodeExecution,
    getCodeExecutions,
    getCodeExecutionById,
    getCodeExecutionsByFile,
    getCodeExecutionsByRoom,
    checkRateLimit,
    deleteCodeExecution,
    deleteCodeExecutionsByFile,
    deleteCodeExecutionsByRoom,
} from './code-executions.controller.js';

const router = Router();

// Crear
// Solo USER_ROLE puede registrar ejecuciones (HOST y ASSISTANT)
router.post('/', validateJWT, requireRole('USER_ROLE'), createCodeExecution);

// Rate Limit 
// Consultar cuántas ejecuciones le quedan al usuario en la hora actual
// Llamar esto ANTES de ejecutar en Judge0 para no desperdiciar llamadas a la API
router.get('/rate-limit', validateJWT, checkRateLimit);

// Consultas
router.get('/',                    validateJWT, getCodeExecutions);           // Todas (filtros: ?roomId= &fileId= &userId= &executionStatus= &language=)
router.get('/:id',                 validateJWT, getCodeExecutionById);        // Por ID
router.get('/file/:fileId',        validateJWT, getCodeExecutionsByFile);     // Historial de ejecuciones de un archivo
router.get('/room/:roomId',        validateJWT, getCodeExecutionsByRoom);     // Todas las ejecuciones de una sala

// Eliminar ejecuciones es solo para limpieza de datos, no se expone en el frontend
router.delete('/:id',              validateJWT, requireRole('USER_ROLE'), deleteCodeExecution);
router.delete('/file/:fileId',     validateJWT, requireRole('USER_ROLE'), deleteCodeExecutionsByFile);
router.delete('/room/:roomId',     validateJWT, requireRole('USER_ROLE'), deleteCodeExecutionsByRoom);

export default router;