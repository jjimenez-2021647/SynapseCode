'use strict'
import CodeSession from './codeSessions.model.js';
import {
    determineSaveType,
    getNextVersionByFile,
} from '../../helpers/code-sessions.helpers.js';
import { normalizeCodeContent } from '../../helpers/code-normalizer.js';

const getRequesterUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Crear nueva sesión de código
 */
export const createCodeSession = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, code, roomId, language, isAutoSave, isBeforeExecution } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        if (code === undefined || code === null) {
            return res.status(400).json({
                success: false,
                message: 'code es obligatorio',
                error: 'MISSING_CODE',
            });
        }

        const normalizedCode = normalizeCodeContent(code);
        if (normalizedCode === undefined) {
            return res.status(400).json({
                success: false,
                message: 'code inválido',
                error: 'INVALID_CODE',
            });
        }

        const version = await getNextVersionByFile(fileId);
        const saveType = determineSaveType(req.body.saveType, isAutoSave, isBeforeExecution);

        const codeSession = await CodeSession.create({
            fileId,
            roomId: roomId || null,
            language: language ? language.toUpperCase() : 'JAVASCRIPT',
            code: normalizedCode,
            savedByUserId: userId,
            version,
            saveType,
            wasExecuted: false,
            savedAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Sesión de código creada exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('createCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando la sesión de código',
            error: 'CREATE_SESSION_ERROR',
        });
    }
};

/**
 * Actualizar sesión de código existente
 */
export const updateCodeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getRequesterUserId(req);
        const { language, code, isAutoSave, isBeforeExecution } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const existingSession = await CodeSession.findById(id);
        if (!existingSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesión de código no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        const updateData = {
            savedByUserId: userId,
            savedAt: new Date(),
            saveType: determineSaveType(req.body.saveType, isAutoSave, isBeforeExecution),
        };

        if (language) updateData.language = language.toUpperCase();
        if (code !== undefined) {
            const normalizedCode = normalizeCodeContent(code);
            if (normalizedCode === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'code inválido',
                    error: 'INVALID_CODE',
                });
            }
            updateData.code = normalizedCode;
        }

        updateData.wasExecuted = existingSession.wasExecuted;

        const codeSession = await CodeSession.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: 'Sesión de código actualizada exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('updateCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando la sesión de código',
            error: 'UPDATE_SESSION_ERROR',
        });
    }
};

/**
 * Obtener todas las sesiones con filtros opcionales
 */
export const getCodeSessions = async (req, res) => {
    try {
        const { fileId, roomId, savedByUserId, wasExecuted } = req.query;

        const filters = {};
        if (fileId) filters.fileId = fileId;
        if (roomId) filters.roomId = roomId;
        if (savedByUserId) filters.savedByUserId = savedByUserId;
        if (wasExecuted !== undefined) filters.wasExecuted = wasExecuted === 'true';

        const codeSessions = await CodeSession.find(filters).sort({ savedAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            count: codeSessions.length,
            data: codeSessions,
        });
    } catch (error) {
        console.error('getCodeSessions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo sesiones de código',
            error: 'GET_SESSIONS_ERROR',
        });
    }
};

/**
 * Obtener sesión por ID
 */
export const getCodeSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId es obligatorio',
                error: 'MISSING_SESSION_ID',
            });
        }

        const session = await CodeSession.findById(sessionId).lean();

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Sesión de código no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error('getCodeSessionById error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo la sesión de código',
            error: 'GET_SESSION_ERROR',
        });
    }
};

/**
 * Obtener todas las sesiones de un archivo (historial)
 */
export const getCodeSessionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const codeSessions = await CodeSession.find({ fileId }).sort({ version: -1 }).lean();

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

/**
 * Obtener todas las sesiones de una sala (todos sus archivos)
 */
export const getCodeSessionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const codeSessions = await CodeSession.find({ roomId }).sort({ savedAt: -1 }).lean();

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

/**
 * Obtener la última versión de un archivo
 */
export const getLatestCodeSession = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const latestSession = await CodeSession.findOne({ fileId }).sort({ version: -1 }).limit(1).lean();

        if (!latestSession) {
            return res.status(404).json({
                success: false,
                message: 'No hay sesiones de código para este archivo',
                error: 'NO_SESSIONS_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Última sesión obtenida exitosamente',
            data: latestSession,
        });
    } catch (error) {
        console.error('getLatestCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo última sesión',
            error: 'GET_LATEST_SESSION_ERROR',
        });
    }
};

/**
 * Obtener una versión específica de un archivo
 */
export const getCodeSessionByVersion = async (req, res) => {
    try {
        const { fileId, version } = req.params;

        if (!fileId || !version) {
            return res.status(400).json({
                success: false,
                message: 'fileId y version son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const codeSession = await CodeSession.findOne({
            fileId,
            version: parseInt(version, 10),
        }).lean();

        if (!codeSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesión de código no encontrada para esta versión',
                error: 'VERSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesión obtenida exitosamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('getCodeSessionByVersion error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo sesión por versión',
            error: 'GET_VERSION_ERROR',
        });
    }
};

/**
 * Eliminar sesión por ID
 */
export const deleteCodeSession = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id es obligatorio',
                error: 'MISSING_SESSION_ID',
            });
        }

        const codeSession = await CodeSession.findByIdAndDelete(id);

        if (!codeSession) {
            return res.status(404).json({
                success: false,
                message: 'Sesión de código no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesión de código eliminada correctamente',
            data: codeSession,
        });
    } catch (error) {
        console.error('deleteCodeSession error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la sesión de código',
            error: 'DELETE_SESSION_ERROR',
        });
    }
};

/**
 * Eliminar todas las sesiones de un archivo
 */
export const deleteCodeSessionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

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

/**
 * Eliminar todas las sesiones de una sala
 */
export const deleteCodeSessionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

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