'use strict';
import CodeExecution from './code-executions.model.js';

// Crear, consultar y eliminar ejecuciones de código para archivos en las salas
/**
    Registrar una nueva ejecución de código
    Body requerido : roomId, fileId, language, executedCode, executionStatus
    Body opcional  : input, output, errors, executionTimeMs, usedMemoryKb, judge0TokenId
    userId         → se extrae del token (req.user.userId)
    executedAt     → Date.now automático
 */
export const createCodeExecution = async (req, res) => {
    try {
        const {
            roomId,
            fileId,
            language,
            executedCode,
            executionStatus,
            input,
            output,
            errors,
            executionTimeMs,
            usedMemoryKb,
            judge0TokenId,
        } = req.body;

        if (!roomId || !fileId || !language || !executedCode || !executionStatus) {
            return res.status(400).json({
                success: false,
                message: 'roomId, fileId, language, executedCode y executionStatus son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // userId del token JWT (validado por validateJWT)
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const codeExecution = await CodeExecution.create({
            roomId,
            fileId,
            userId,
            language,
            executedCode,
            input:           input           ?? '',
            output:          output          ?? '',
            errors:          errors          ?? '',
            executionTimeMs: executionTimeMs ?? null,
            usedMemoryKb:    usedMemoryKb    ?? 0,
            executionStatus,
            judge0TokenId:   judge0TokenId   ?? null,
            executedAt:      new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Ejecucion de codigo registrada exitosamente',
            data: codeExecution,
        });
    } catch (error) {
        console.error('createCodeExecution error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error registrando la ejecucion de codigo',
            error: 'CREATE_EXECUTION_ERROR',
        });
    }
};

// Consultas
/**
    Obtener todas las ejecuciones con filtros opcionales
    Query params: roomId, fileId, userId, executionStatus, language
 */
export const getCodeExecutions = async (req, res) => {
    try {
        const { roomId, fileId, userId, executionStatus, language } = req.query;

        const filters = {};
        if (roomId)          filters.roomId          = roomId;
        if (fileId)          filters.fileId          = fileId;
        if (userId)          filters.userId          = userId;
        if (executionStatus) filters.executionStatus = executionStatus;
        if (language)        filters.language        = language;

        const executions = await CodeExecution.find(filters).sort({ executedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones obtenidas exitosamente',
            count: executions.length,
            data: executions,
        });
    } catch (error) {
        console.error('getCodeExecutions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo ejecuciones de codigo',
            error: 'GET_EXECUTIONS_ERROR',
        });
    }
};

// Obtener ejecución por ID
export const getCodeExecutionById = async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await CodeExecution.findById(id);

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Ejecucion no encontrada',
                error: 'EXECUTION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ejecucion obtenida exitosamente',
            data: execution,
        });
    } catch (error) {
        console.error('getCodeExecutionById error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo la ejecucion',
            error: 'GET_EXECUTION_ERROR',
        });
    }
};

// Obtener todas las ejecuciones de un archivo especifico
export const getCodeExecutionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const executions = await CodeExecution.find({ fileId }).sort({ executedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones del archivo obtenidas exitosamente',
            count: executions.length,
            data: executions,
        });
    } catch (error) {
        console.error('getCodeExecutionsByFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo ejecuciones del archivo',
            error: 'GET_FILE_EXECUTIONS_ERROR',
        });
    }
};

// Obtener todas las ejecuciones de una sala especifica
export const getCodeExecutionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const executions = await CodeExecution.find({ roomId }).sort({ executedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones de la sala obtenidas exitosamente',
            count: executions.length,
            data: executions,
        });
    } catch (error) {
        console.error('getCodeExecutionsByRoom error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo ejecuciones de la sala',
            error: 'GET_ROOM_EXECUTIONS_ERROR',
        });
    }
};

/**
    Verificar si el usuario alcanzó el límite de ejecuciones por hora
    Útil para rate limiting antes de llamar a Judge0
    Límite: 50 ejecuciones por hora por usuario
 */
export const checkRateLimit = async (req, res) => {
    try {
        const userId = req.user?.userId;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const count = await CodeExecution.countDocuments({
            userId,
            executedAt: { $gte: oneHourAgo },
        });

        const limit        = 50;
        const remaining    = Math.max(0, limit - count);
        const limitReached = count >= limit;

        return res.status(200).json({
            success: true,
            message: limitReached
                ? 'Limite de ejecuciones alcanzado'
                : 'Dentro del limite permitido',
            data: {
                executionsLastHour: count,
                limit,
                remaining,
                limitReached,
            },
        });
    } catch (error) {
        console.error('checkRateLimit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando el rate limit',
            error: 'RATE_LIMIT_CHECK_ERROR',
        });
    }
};

//Eliminar

// Eliminar una ejecución por ID
export const deleteCodeExecution = async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await CodeExecution.findByIdAndDelete(id);

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Ejecucion no encontrada',
                error: 'EXECUTION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ejecucion eliminada correctamente',
            data: execution,
        });
    } catch (error) {
        console.error('deleteCodeExecution error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la ejecucion',
            error: 'DELETE_EXECUTION_ERROR',
        });
    }
};

// Eliminar todas las ejecuciones de un archivo
export const deleteCodeExecutionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await CodeExecution.deleteMany({ fileId });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ejecuciones del archivo eliminadas correctamente`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('deleteCodeExecutionsByFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando ejecuciones del archivo',
            error: 'DELETE_FILE_EXECUTIONS_ERROR',
        });
    }
};

// Eliminar todas las ejecuciones de una sala
export const deleteCodeExecutionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const result = await CodeExecution.deleteMany({ roomId });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ejecuciones de la sala eliminadas correctamente`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('deleteCodeExecutionsByRoom error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando ejecuciones de la sala',
            error: 'DELETE_ROOM_EXECUTIONS_ERROR',
        });
    }
};