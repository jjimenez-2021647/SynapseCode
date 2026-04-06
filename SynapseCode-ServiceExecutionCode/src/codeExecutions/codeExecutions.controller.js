'use strict'
import CodeExecution from './codeExecutions.model.js';
import { executeCode, submitCode, getSubmissionResult } from '../../helpers/Judge0.service.js';

// ─── Limite de ejecuciones por hora ───────────────────────────────────────────
const HOURLY_LIMIT = 50;

const checkUserRateLimit = async (userId) => {
    const now = new Date();
    const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const nextHourStart = new Date(currentHourStart.getTime() + 60 * 60 * 1000);
    
    const count = await CodeExecution.countDocuments({
        userId,
        executedAt: { $gte: currentHourStart, $lt: nextHourStart },
    });
    
    return { count, limitReached: count >= HOURLY_LIMIT };
};

const getRequesterUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;

const buildExecutionDiagnosis = ({ language, result }) => {
    const errorText = String(result?.errors || '');
    const status = String(result?.executionStatus || '');

    if (!errorText && status === 'EXITOSO') {
        return { code: 'OK', message: 'Ejecución completada correctamente' };
    }

    if (/SyntaxError|unexpected token|Unexpected token|indentation|IndentationError/i.test(errorText)) {
        return {
            code: 'SYNTAX_ERROR',
            message: `Hay un error de sintaxis para ${language || 'este lenguaje'}. Revisa paréntesis, llaves, comillas y estructura.`,
        };
    }

    if (/ReferenceError|is not defined|undefined/i.test(errorText)) {
        return {
            code: 'REFERENCE_ERROR',
            message: 'Variable o función no definida. Revisa que todas las variables estén declaradas.',
        };
    }

    return {
        code: 'RUNTIME_ERROR',
        message: `Error de ejecución. Detalles: ${errorText.substring(0, 100)}`,
    };
};

/**
 * Obtener lenguajes soportados
 */
export const getSupportedLanguages = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Lenguajes soportados',
        data: [
            { language: 'JAVASCRIPT', judge0Id: 63, description: 'Node.js 12.14.0' },
            { language: 'PYTHON', judge0Id: 71, description: 'Python 3.8.1' },
            { language: 'JAVA', judge0Id: 62, description: 'Java OpenJDK 13.0.1' },
            { language: 'CSHARP', judge0Id: 51, description: 'C# Mono 6.6.0' },
            { language: 'HTML_CSS', judge0Id: 63, description: 'JavaScript/Node.js' },
        ],
    });
};

/**
 * Ejecutar código de forma síncrona con Judge0
 */
export const runCode = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, roomId, language, code, input } = req.body;

        if (!language || !code) {
            return res.status(400).json({
                success: false,
                message: 'language y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const { count, limitReached } = await checkUserRateLimit(userId);
        if (limitReached) {
            return res.status(429).json({
                success: false,
                message: `Límite de ${HOURLY_LIMIT} ejecuciones por hora alcanzado`,
                error: 'RATE_LIMIT_EXCEEDED',
                data: { executionsLastHour: count, limit: HOURLY_LIMIT, remaining: 0 },
            });
        }

        const result = await executeCode(language, code, input || '');
        const diagnosis = buildExecutionDiagnosis({ language, result });

        const codeExecution = await CodeExecution.create({
            roomId: roomId || null,
            fileId: fileId || null,
            userId,
            language: language.toUpperCase(),
            executionResult: {
                code,
                input: input || '',
                output: result.output || '',
                errors: result.errors || '',
                status: result.executionStatus,
            },
            executedAt: new Date(),
        });

        return res.status(200).json({
            success: true,
            message: 'Código ejecutado exitosamente',
            data: {
                executionId: codeExecution._id,
                output: result.output,
                errors: result.errors,
                executionStatus: result.executionStatus,
                diagnosis,
                rateLimit: {
                    executionsLastHour: count + 1,
                    limit: HOURLY_LIMIT,
                    remaining: Math.max(0, HOURLY_LIMIT - (count + 1)),
                },
            },
        });
    } catch (error) {
        console.error('runCode error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error ejecutando código',
            error: 'RUN_CODE_ERROR',
        });
    }
};

/**
 * Enviar código de forma asíncrona a Judge0
 */
export const submitCodeAsync = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { language, code, input } = req.body;

        if (!language || !code) {
            return res.status(400).json({
                success: false,
                message: 'language y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const { count, limitReached } = await checkUserRateLimit(userId);
        if (limitReached) {
            return res.status(429).json({
                success: false,
                message: `Límite de ${HOURLY_LIMIT} ejecuciones por hora alcanzado`,
                error: 'RATE_LIMIT_EXCEEDED',
            });
        }

        const token = await submitCode(language, code, input || '');

        return res.status(202).json({
            success: true,
            message: 'Código enviado a Judge0. Usa el token para consultar el resultado',
            data: { judge0TokenId: token },
        });
    } catch (error) {
        console.error('submitCodeAsync error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error enviando código a Judge0',
            error: 'SUBMIT_CODE_ERROR',
        });
    }
};

/**
 * Obtener resultado de ejecución asíncrona por token
 */
export const getResultByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { fileId, roomId, language, code, input } = req.query;

        const result = await getSubmissionResult(token);
        const diagnosis = buildExecutionDiagnosis({ language, result });

        const stillRunning = result._raw?.statusId === 1 || result._raw?.statusId === 2;

        if (!stillRunning && fileId && roomId && language && code) {
            const userId = getRequesterUserId(req);
            if (userId) {
                try {
                    await CodeExecution.create({
                        roomId,
                        fileId,
                        userId,
                        language: language.toUpperCase(),
                        executionResult: {
                            code,
                            input: input || '',
                            output: result.output || '',
                            errors: result.errors || '',
                            status: result.executionStatus,
                        },
                        executedAt: new Date(),
                    });
                } catch (dbError) {
                    console.error('Error saving async execution result:', dbError);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Resultado obtenido exitosamente',
            data: {
                output: result.output,
                errors: result.errors,
                executionStatus: result.executionStatus,
                judge0TokenId: token,
                diagnosis,
                stillRunning,
            },
        });
    } catch (error) {
        console.error('getResultByToken error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo resultado del token',
            error: 'GET_RESULT_ERROR',
        });
    }
};

/**
 * Registrar ejecución manualmente
 */
export const createCodeExecution = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, roomId, language, code, input, output, errors, executionStatus } = req.body;

        if (!language || !code) {
            return res.status(400).json({
                success: false,
                message: 'language y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const codeExecution = await CodeExecution.create({
            roomId: roomId || null,
            fileId: fileId || null,
            userId,
            language: language.toUpperCase(),
            executionResult: {
                code,
                input: input || '',
                output: output || '',
                errors: errors || '',
                status: executionStatus || (errors ? 'ERROR' : 'EXITOSO'),
            },
            executedAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Ejecución registrada exitosamente',
            data: codeExecution,
        });
    } catch (error) {
        console.error('createCodeExecution error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error registrando ejecución',
            error: 'CREATE_EXECUTION_ERROR',
        });
    }
};

/**
 * Obtener ejecuciones con filtros
 */
export const getCodeExecutions = async (req, res) => {
    try {
        const { fileId, roomId, userId, executionStatus, language } = req.query;
        const filters = {};

        if (fileId) filters.fileId = fileId;
        if (roomId) filters.roomId = roomId;
        if (userId) filters.userId = userId;
        if (executionStatus) filters['executionResult.status'] = executionStatus;
        if (language) filters.language = language;

        const executions = await CodeExecution.find(filters).sort({ executedAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            count: executions.length,
            data: executions,
        });
    } catch (error) {
        console.error('getCodeExecutions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo ejecuciones',
            error: 'GET_EXECUTIONS_ERROR',
        });
    }
};

/**
 * Obtener ejecución por ID
 */
export const getCodeExecutionById = async (req, res) => {
    try {
        const { executionId } = req.params;

        if (!executionId) {
            return res.status(400).json({
                success: false,
                message: 'executionId es obligatorio',
                error: 'MISSING_EXECUTION_ID',
            });
        }

        const execution = await CodeExecution.findById(executionId).lean();

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Ejecución no encontrada',
                error: 'EXECUTION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            data: execution,
        });
    } catch (error) {
        console.error('getCodeExecutionById error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo ejecución',
            error: 'GET_EXECUTION_ERROR',
        });
    }
};

/**
 * Obtener ejecuciones por archivo
 */
export const getCodeExecutionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const executions = await CodeExecution.find({ fileId }).sort({ executedAt: -1 }).lean();

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

/**
 * Obtener ejecuciones por sala
 */
export const getCodeExecutionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const executions = await CodeExecution.find({ roomId }).sort({ executedAt: -1 }).lean();

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
 * Audit: obtener todas las ejecuciones (solo ADMIN)
 */
export const getCodeExecutionsAudit = async (req, res) => {
    try {
        const isAdmin = String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Solo ADMIN_ROLE puede acceder a auditoría',
                error: 'FORBIDDEN',
            });
        }

        const executions = await CodeExecution.find({}).sort({ executedAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            message: 'Auditoría de ejecuciones obtenida exitosamente',
            count: executions.length,
            data: executions.map((e) => ({
                executionId: e._id,
                fileId: e.fileId,
                roomId: e.roomId,
                userId: e.userId,
                language: e.language,
                executionStatus: e.executionResult?.status || 'UNKNOWN',
                executedAt: e.executedAt,
                judge0TokenId: e.executionResult?.judge0TokenId || null,
            })),
        });
    } catch (error) {
        console.error('getCodeExecutionsAudit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo auditoría',
            error: 'GET_AUDIT_ERROR',
        });
    }
};

/**
 * Verificar rate limit del usuario
 */
export const checkRateLimit = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { count, limitReached } = await checkUserRateLimit(userId);
        const remaining = Math.max(0, HOURLY_LIMIT - count);

        return res.status(200).json({
            success: true,
            message: limitReached ? 'Límite de ejecuciones alcanzado' : 'Dentro del límite permitido',
            data: {
                executionsLastHour: count,
                limit: HOURLY_LIMIT,
                remaining,
                limitReached,
            },
        });
    } catch (error) {
        console.error('checkRateLimit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando rate limit',
            error: 'RATE_LIMIT_CHECK_ERROR',
        });
    }
};

/**
 * Eliminar ejecución por ID
 */
export const deleteCodeExecution = async (req, res) => {
    try {
        const { id } = req.params;

        const execution = await CodeExecution.findByIdAndDelete(id);

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Ejecución no encontrada',
                error: 'EXECUTION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ejecución eliminada correctamente',
            data: execution,
        });
    } catch (error) {
        console.error('deleteCodeExecution error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando ejecución',
            error: 'DELETE_EXECUTION_ERROR',
        });
    }
};

/**
 * Eliminar todas las ejecuciones de un archivo
 */
export const deleteCodeExecutionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

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

/**
 * Eliminar todas las ejecuciones de una sala
 */
export const deleteCodeExecutionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

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