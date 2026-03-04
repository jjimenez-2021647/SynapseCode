'use strict'
import CodeSession from './codeSessions.model.js';
import {
    determineSaveType,
    wasCodeExecuted,
    getNextVersionByFile,
} from '../../helpers/code-sessions.helpers.js';

//Crear nueva sesión de código
/**
 * Crear nueva sesión de código
 * Body requerido : fileId, roomId, language, code
 * Body opcional  : isAutoSave, isBeforeExecution
 * savedByUserId  → se extrae del token (req.user.userId)
 * version        → auto-incremental por fileId
 * saveType       → determinado automáticamente
 * wasExecuted    → siempre false al crear
 */
export const createCodeSession = async (req, res) => {
    try {
        const { fileId, roomId, language, code, isAutoSave, isBeforeExecution } = req.body;

        if (!fileId || !roomId || !language || code === undefined) {
            return res.status(400).json({
                success: false,
                message: 'fileId, roomId, language y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // userId del token JWT (validado por validateJWT)
        const savedByUserId = req.user?.userId;
        if (!savedByUserId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // Versión incremental por archivo
        const version  = await getNextVersionByFile(fileId);
        const saveType = determineSaveType(req.body.saveType, isAutoSave, isBeforeExecution);

        const codeSession = await CodeSession.create({
            fileId,
            roomId,
            language: language.toUpperCase(),
            code,
            savedByUserId,
            version,
            saveType,
            wasExecuted: false,
            savedAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Sesion de codigo creada exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('createCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando la sesion de codigo',
            error: 'CREATE_SESSION_ERROR',
        });
    }
};

//Actualizar sesión de código existente
/**
 * Actualizar sesión de código existente
 * Campos editables : language, code
 * executionResult  → solo cuando el backend llama tras ejecutar con Judge0
 * wasExecuted      → se determina lógicamente según si viene executionResult
 * savedByUserId    → se renueva del token
 * saveType         → se redetermina
 */
export const updateCodeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { language, code, executionResult, isAutoSave, isBeforeExecution } = req.body;

        const existingSession = await CodeSession.findById(id);
        if (!existingSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesion de codigo no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        const savedByUserId = req.user?.userId;
        if (!savedByUserId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const updateData = {
            savedByUserId,
            savedAt: new Date(),
            saveType: determineSaveType(req.body.saveType, isAutoSave, isBeforeExecution),
        };

        if (language)         updateData.language = language.toUpperCase();
        if (code !== undefined) updateData.code    = code;

        if (executionResult) {
            updateData.wasExecuted      = true;
            updateData.executionResult  = {
                output:          executionResult.output          ?? null,
                errors:          executionResult.errors          ?? null,
                executionTimeMs: executionResult.executionTimeMs ?? null,
                memoryUsedKb:    executionResult.memoryUsedKb    ?? null,
            };
        } else {
            updateData.wasExecuted = wasCodeExecuted(existingSession.executionResult);
        }

        const codeSession = await CodeSession.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: 'Sesion de codigo actualizada exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('updateCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando la sesion de codigo',
            error: 'UPDATE_SESSION_ERROR',
        });
    }
};

//Consultas
/** Obtener todas las sesiones con filtros opcionales */
export const getCodeSessions = async (req, res) => {
    try {
        const { fileId, roomId, savedByUserId, wasExecuted } = req.query;

        const filters = {};
        if (fileId)        filters.fileId        = fileId;
        if (roomId)        filters.roomId        = roomId;
        if (savedByUserId) filters.savedByUserId = savedByUserId;
        if (wasExecuted !== undefined) filters.wasExecuted = wasExecuted === 'true';

        const codeSessions = await CodeSession.find(filters).sort({ savedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Sesiones obtenidas exitosamente',
            count: codeSessions.length,
            data: codeSessions,
        });
    } catch (error) {
        console.error('getCodeSessions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo sesiones de codigo',
            error: 'GET_SESSIONS_ERROR',
        });
    }
};

/** Obtener sesión por ID */
export const getCodeSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const codeSession = await CodeSession.findById(id);

        if (!codeSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesion de codigo no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesion obtenida exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('getCodeSessionById error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo la sesion de codigo',
            error: 'GET_SESSION_ERROR',
        });
    }
};

/** Obtener todas las sesiones de un archivo (historial) */
export const getCodeSessionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const codeSessions = await CodeSession.find({ fileId }).sort({ version: -1 });

        return res.status(200).json({
            success: true,
            message: 'Sesiones del archivo obtenidas exitosamente',
            count: codeSessions.length,
            data: codeSessions,
        });
    } catch (error) {
        console.error('getCodeSessionsByFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo sesiones del archivo',
            error: 'GET_FILE_SESSIONS_ERROR',
        });
    }
};

/** Obtener todas las sesiones de una sala (todos sus archivos) */
export const getCodeSessionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const codeSessions = await CodeSession.find({ roomId }).sort({ savedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Sesiones de la sala obtenidas exitosamente',
            count: codeSessions.length,
            data: codeSessions,
        });
    } catch (error) {
        console.error('getCodeSessionsByRoom error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo sesiones de la sala',
            error: 'GET_ROOM_SESSIONS_ERROR',
        });
    }
};

/** Obtener la última versión de un archivo */
export const getLatestCodeSession = async (req, res) => {
    try {
        const { fileId } = req.params;
        const latestSession = await CodeSession.findOne({ fileId }).sort({ version: -1 }).limit(1);

        if (!latestSession) {
            return res.status(404).json({
                success: false,
                message: 'No hay sesiones de codigo para este archivo',
                error: 'NO_SESSIONS_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ultima sesion obtenida exitosamente',
            data: latestSession,
        });
    } catch (error) {
        console.error('getLatestCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo ultima sesion',
            error: 'GET_LATEST_SESSION_ERROR',
        });
    }
};

/** Obtener una versión específica de un archivo */
export const getCodeSessionByVersion = async (req, res) => {
    try {
        const { fileId, version } = req.params;
        const codeSession = await CodeSession.findOne({
            fileId,
            version: parseInt(version, 10),
        });

        if (!codeSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesion de codigo no encontrada para esta version',
                error: 'VERSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesion obtenida exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('getCodeSessionByVersion error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo sesion por version',
            error: 'GET_VERSION_ERROR',
        });
    }
};

//Eliminar sesiones
/** Eliminar sesión por ID */
export const deleteCodeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const codeSession = await CodeSession.findByIdAndDelete(id);

        if (!codeSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesion de codigo no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesion de codigo eliminada correctamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('deleteCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la sesion de codigo',
            error: 'DELETE_SESSION_ERROR',
        });
    }
};

/** Eliminar todas las sesiones de un archivo */
export const deleteCodeSessionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await CodeSession.deleteMany({ fileId });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} sesiones del archivo eliminadas correctamente`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('deleteCodeSessionsByFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando sesiones del archivo',
            error: 'DELETE_FILE_SESSIONS_ERROR',
        });
    }
};

/** Eliminar todas las sesiones de una sala */
export const deleteCodeSessionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const result = await CodeSession.deleteMany({ roomId });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} sesiones de la sala eliminadas correctamente`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('deleteCodeSessionsByRoom error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando sesiones de la sala',
            error: 'DELETE_ROOM_SESSIONS_ERROR',
        });
    }
};
