'use strict';
import CodeExecution from './codeExecutions.model.js';
import Room from '../rooms/rooms.model.js';
import File from '../files/files.model.js';
import CodeSession from '../codeSessions/codeSessions.model.js';
import { executeCode, submitCode, getSubmissionResult } from '../../helpers/Judge0.service.js';

// ─── Limite de ejecuciones por hora ───────────────────────────────────────────
const HOURLY_LIMIT = 50;

const checkUserRateLimit = async (userId) => {
    // Ventana fija por hora: reinicia a las horas exactas (00:00, 01:00, 02:00, etc.)
    const now = new Date();
    const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const nextHourStart = new Date(currentHourStart.getTime() + 60 * 60 * 1000);
    
    const count = await CodeExecution.countDocuments({
        userId,
        executedAt: { $gte: currentHourStart, $lt: nextHourStart },
    });
    
    return { count, limitReached: count >= HOURLY_LIMIT };
};

// ─── Helper interno: enriquecer ejecuciones con datos de Room y File ──────────
const enrichCodeExecutions = async (executions) => {
    const list = executions.map((execution) =>
        typeof execution.toObject === 'function' ? execution.toObject() : execution
    );

    if (!list.length) return list;

    const roomIds = [...new Set(list.map((e) => String(e.roomId)).filter(Boolean))];
    const fileIds = [...new Set(list.map((e) => String(e.fileId)).filter(Boolean))];

    const [rooms, files] = await Promise.all([
        Room.find({ _id: { $in: roomIds } }).select('roomName roomCode connectedUsers').lean(),
        File.find({ _id: { $in: fileIds } }).select('fileName fileExtension').lean(),
    ]);

    const roomsById = new Map(rooms.map((room) => [String(room._id), room]));
    const filesById = new Map(files.map((file) => [String(file._id), file]));

    const usernamesByRoomAndUser = new Map();
    rooms.forEach((room) => {
        (room.connectedUsers || []).forEach((user) => {
            usernamesByRoomAndUser.set(`${String(room._id)}:${user.userId}`, user.username);
        });
    });

    return list.map((execution) => {
        const room = roomsById.get(String(execution.roomId));
        const file = filesById.get(String(execution.fileId));

        return {
            ...execution,
            roomName:     room?.roomName  || null,
            roomCode:     room?.roomCode  || null,
            fileName:     file?.fileName  || null,
            fileExtension: file?.fileExtension || null,
            fullFileName: file ? `${file.fileName}.${file.fileExtension}` : null,
            username:
                usernamesByRoomAndUser.get(`${String(execution.roomId)}:${execution.userId}`) || null,
        };
    });
};


// ─── JUDGE0 ───────────────────────────────────────────────────────────────────

/**
 * Devuelve los lenguajes soportados y sus IDs en Judge0
 * GET /code-executions/languages  — público, sin JWT
 */
export const getSupportedLanguages = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Lenguajes soportados',
        data: [
            { language: 'JAVASCRIPT', judge0Id: 63, description: 'Node.js 12.14.0'        },
            { language: 'PYTHON',     judge0Id: 71, description: 'Python 3.8.1'            },
            { language: 'JAVA',       judge0Id: 62, description: 'Java OpenJDK 13'         },
            { language: 'CSHARP',     judge0Id: 51, description: 'C# Mono 6.6.0'           },
            { language: 'HTML_CSS',   judge0Id: 63, description: 'Ejecutado como Node.js'  },
        ],
    });
};

/**
 * Ejecuta código en Judge0 de forma síncrona y guarda el resultado
 * POST /code-executions/run
 * Body requerido : fileId
 * Body opcional  : input
 */
export const runCode = async (req, res) => {
    try {
        const { fileId, input } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const { roomId, language, code } = await resolveExecutionContextByFileId(fileId);

        if (!String(code || '').trim()) {
            return res.status(400).json({
                success: false,
                message: 'No hay codigo para ejecutar en la ultima codeSession del archivo',
                error: 'EMPTY_CODE',
            });
        }

        const likelyLanguage = detectLikelyLanguageFromCode(code);
        if (likelyLanguage && likelyLanguage !== language) {
            return res.status(400).json({
                success: false,
                message: `El codigo parece ser ${likelyLanguage}, pero el archivo esta configurado como ${language}`,
                error: 'CODE_LANGUAGE_MISMATCH',
                data: {
                    expectedLanguage: language,
                    detectedLanguage: likelyLanguage,
                },
            });
        }

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // 1. Verificar rate limit antes de llamar a Judge0
        const { count, limitReached } = await checkUserRateLimit(userId);
        if (limitReached) {
            return res.status(429).json({
                success: false,
                message: `Limite de ${HOURLY_LIMIT} ejecuciones por hora alcanzado`,
                error: 'RATE_LIMIT_EXCEEDED',
                data: {
                    executionsLastHour: count,
                    limit:     HOURLY_LIMIT,
                    remaining: 0,
                },
            });
        }

        // 2. Ejecutar en Judge0 (síncrono, espera resultado)
        const result = await executeCode(language, code, input || '');
        const diagnosis = buildExecutionDiagnosis({ language, result });

        // 3. Guardar resultado en la base de datos
        const codeExecution = await CodeExecution.create({
            roomId,
            fileId,
            userId,
            language,
            executedCode:    code,
            input:           input           || '',
            output:          result.output,
            errors:          result.errors,
            executionTimeMs: result.executionTimeMs,
            usedMemoryKb:    result.usedMemoryKb,
            executionStatus: result.executionStatus,
            judge0TokenId:   result.judge0TokenId,
            executedAt:      new Date(),
        });

        // 4. Devolver resultado al frontend
        return res.status(200).json({
            success: true,
            message: 'Codigo ejecutado exitosamente',
            data: {
                executionId:     codeExecution._id,
                output:          result.output,
                errors:          result.errors,
                executionTimeMs: result.executionTimeMs,
                usedMemoryKb:    result.usedMemoryKb,
                executionStatus: result.executionStatus,
                judge0TokenId:   result.judge0TokenId,
                diagnosis,
                rateLimit: {
                    executionsLastHour: count + 1,
                    limit:     HOURLY_LIMIT,
                    remaining: HOURLY_LIMIT - (count + 1),
                },
            },
        });
    } catch (error) {
        console.error('runCode error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Error ejecutando el codigo',
            error: error.error || 'RUN_CODE_ERROR',
        });
    }
};

/**
 * Envía código a Judge0 de forma asíncrona y devuelve el token inmediatamente
 * POST /code-executions/submit
 * Body requerido : fileId
 * Body opcional  : input
 */
export const submitCodeAsync = async (req, res) => {
    try {
        const { fileId, input } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const { language, code } = await resolveExecutionContextByFileId(fileId);

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // Verificar rate limit
        const { count, limitReached } = await checkUserRateLimit(userId);
        if (limitReached) {
            return res.status(429).json({
                success: false,
                message: `Limite de ${HOURLY_LIMIT} ejecuciones por hora alcanzado`,
                error: 'RATE_LIMIT_EXCEEDED',
                data: {
                    executionsLastHour: count,
                    limit:     HOURLY_LIMIT,
                    remaining: 0,
                },
            });
        }

        // Enviar a Judge0 sin esperar resultado
        const token = await submitCode(language, code, input || '');

        return res.status(202).json({
            success: true,
            message: 'Codigo enviado a Judge0, usa el token para consultar el resultado',
            data: {
                judge0TokenId: token,
            },
        });
    } catch (error) {
        console.error('submitCodeAsync error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Error enviando el codigo a Judge0',
            error: error.error || 'SUBMIT_CODE_ERROR',
        });
    }
};

/**
 * Consulta el resultado de una ejecución asíncrona por su token
 * GET /code-executions/result/:token
 * Query params opcionales para guardar en BD: fileId, input
 */
export const getResultByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const {
            roomId: queryRoomId,
            fileId,
            language: queryLanguage,
            code: queryCode,
            input,
        } = req.query;

        const result = await getSubmissionResult(token);
        const diagnosis = buildExecutionDiagnosis({ language: queryLanguage, result });

        // statusId 1 = In Queue, 2 = Processing → todavía corriendo
        const stillRunning = result._raw?.statusId === 1 || result._raw?.statusId === 2;

        // Si ya terminó y se pasaron los datos necesarios, guardar en BD
        if (!stillRunning) {
            let roomId = queryRoomId;
            let language = queryLanguage;
            let code = queryCode;

            if (fileId && (!roomId || !language || !code)) {
                const context = await resolveExecutionContextByFileId(fileId);
                roomId = roomId || context.roomId;
                language = language || context.language;
                code = code || context.code;
            }

            if (roomId && fileId && language && code) {
                const userId = req.user?.userId;

                await CodeExecution.create({
                    roomId,
                    fileId,
                    userId,
                    language,
                    executedCode:    code,
                    input:           input           || '',
                    output:          result.output,
                    errors:          result.errors,
                    executionTimeMs: result.executionTimeMs,
                    usedMemoryKb:    result.usedMemoryKb,
                    executionStatus: result.executionStatus,
                    judge0TokenId:   token,
                    executedAt:      new Date(),
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Resultado obtenido exitosamente',
            data: {
                output:          result.output,
                errors:          result.errors,
                executionTimeMs: result.executionTimeMs,
                usedMemoryKb:    result.usedMemoryKb,
                executionStatus: result.executionStatus,
                judge0TokenId:   token,
                diagnosis,
                stillRunning,
            },
        });
    } catch (error) {
        console.error('getResultByToken error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Error obteniendo el resultado de Judge0',
            error: error.error || 'GET_RESULT_ERROR',
        });
    }
};

// ─── CRUD EJECUCIONES ─────────────────────────────────────────────────────────

/**
 * Registrar una nueva ejecución de código manualmente
 * POST /code-executions
 * Body requerido : fileId
 * Body opcional  : input, output, errors, executionTimeMs, usedMemoryKb, judge0TokenId
 */
export const createCodeExecution = async (req, res) => {
    try {
        const {
            fileId, executionStatus,
            input, output, errors, executionTimeMs, usedMemoryKb, judge0TokenId,
        } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const { roomId, language, code } = await resolveExecutionContextByFileId(fileId);

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'El token no contiene un userId valido',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const resolvedExecutionStatus =
            executionStatus || (String(errors || '').trim() ? 'ERROR_RUNTIME' : 'EXITOSO');

        const codeExecution = await CodeExecution.create({
            roomId, fileId, userId, language, executedCode: code,
            input:           input           ?? '',
            output:          output          ?? '',
            errors:          errors          ?? '',
            executionTimeMs: executionTimeMs ?? null,
            usedMemoryKb:    usedMemoryKb    ?? 0,
            executionStatus: resolvedExecutionStatus,
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
        return res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error registrando la ejecucion de codigo',
            error: error.error || 'CREATE_EXECUTION_ERROR',
        });
    }
};

/**
 * Obtener todas las ejecuciones con filtros opcionales
 * GET /code-executions
 * Query params: roomId, fileId, userId, executionStatus, language
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

        const executions = await CodeExecution.find(filters).sort({ executedAt: -1 }).lean();
        const data = await enrichCodeExecutions(executions);

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones obtenidas exitosamente',
            count: data.length,
            data,
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

export const getCodeExecutionsAudit = async (_req, res) => {
    try {
        const executions = await CodeExecution.find({})
            .sort({ executedAt: -1 })
            .lean();
        const data = await enrichCodeExecutions(executions);

        return res.status(200).json({
            success: true,
            message: 'Auditoria de ejecuciones obtenida exitosamente',
            count: data.length,
            data: data.map((execution) => ({
                executionId: execution._id,
                roomId: execution.roomId,
                roomCode: execution.roomCode || null,
                roomName: execution.roomName || null,
                fileId: execution.fileId,
                fullFileName: execution.fullFileName || null,
                executedByUserId: execution.userId,
                executedByUsername: execution.username || null,
                language: execution.language,
                executionStatus: execution.executionStatus,
                executedAt: execution.executedAt,
                judge0TokenId: execution.judge0TokenId || null,
            })),
        });
    } catch (error) {
        console.error('getCodeExecutionsAudit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo auditoria de ejecuciones',
            error: 'GET_CODE_EXECUTIONS_AUDIT_ERROR',
        });
    }
};

// Obtener ejecución por ID
export const getCodeExecutionById = async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await CodeExecution.findById(id).lean();

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: 'Ejecucion no encontrada',
                error: 'EXECUTION_NOT_FOUND',
            });
        }

        const [enrichedExecution] = await enrichCodeExecutions([execution]);

        return res.status(200).json({
            success: true,
            message: 'Ejecucion obtenida exitosamente',
            data: enrichedExecution,
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

// Obtener todas las ejecuciones de un archivo específico
export const getCodeExecutionsByFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const executions = await CodeExecution.find({ fileId }).sort({ executedAt: -1 }).lean();
        const data = await enrichCodeExecutions(executions);

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones del archivo obtenidas exitosamente',
            count: data.length,
            data,
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

// Obtener todas las ejecuciones de una sala específica
export const getCodeExecutionsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const executions = await CodeExecution.find({ roomId }).sort({ executedAt: -1 }).lean();
        const data = await enrichCodeExecutions(executions);

        return res.status(200).json({
            success: true,
            message: 'Ejecuciones de la sala obtenidas exitosamente',
            count: data.length,
            data,
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
 * Verificar rate limit del usuario autenticado
 * GET /code-executions/rate-limit
 */
export const checkRateLimit = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { count, limitReached } = await checkUserRateLimit(userId);
        const remaining = Math.max(0, HOURLY_LIMIT - count);

        return res.status(200).json({
            success: true,
            message: limitReached ? 'Limite de ejecuciones alcanzado' : 'Dentro del limite permitido',
            data: {
                executionsLastHour: count,
                limit:       HOURLY_LIMIT,
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

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────

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

function buildContextError(message, error, status = 400) {
    const contextError = new Error(message);
    contextError.error = error;
    contextError.status = status;
    return contextError;
}

function detectLikelyLanguageFromCode(code) {
    const source = String(code || '');

    if (/<html[\s>]|<!doctype html>/i.test(source)) return 'HTML_CSS';
    if (/^\s*body\s*\{[\s\S]*\}\s*$/im.test(source) || /font-family\s*:/i.test(source)) return 'HTML_CSS';
    if (/\bpublic\s+class\b[\s\S]*\bSystem\.out\.println\b/.test(source)) return 'JAVA';
    if (/\busing\s+System\s*;[\s\S]*\bConsole\.Write(Line)?\b/.test(source)) return 'CSHARP';
    if (/^\s*def\s+\w+\s*\(|^\s*import\s+\w+/m.test(source) && /print\s*\(/.test(source)) return 'PYTHON';
    if (/\bconsole\.log\s*\(|\b(const|let|var)\b|=>/.test(source)) return 'JAVASCRIPT';

    return null;
}

function buildExecutionDiagnosis({ language, result }) {
    const errorText = String(result?.errors || '');
    const status = String(result?.executionStatus || '');

    if (!errorText && status === 'EXITOSO') {
        return {
            code: 'OK',
            message: 'Ejecucion completada correctamente',
        };
    }

    if (/SyntaxError|unexpected token|Unexpected token|indentation|IndentationError/i.test(errorText)) {
        return {
            code: 'SYNTAX_ERROR',
            message: `Hay un error de sintaxis para ${language || 'este lenguaje'}. Revisa parentesis, llaves, comillas y estructura del codigo.`,
        };
    }

    if (/Compilation Error|error CS\d+|javac|cannot find symbol|; expected/i.test(errorText) || status === 'ERROR_COMPILACION') {
        return {
            code: 'COMPILATION_ERROR',
            message: `El codigo no compila para ${language || 'este lenguaje'}. Revisa tipos, imports/usings y declaracion de clases/metodos.`,
        };
    }

    if (/ReferenceError|TypeError|NameError|NullPointerException|Exception in thread/i.test(errorText) || status === 'ERROR_RUNTIME') {
        return {
            code: 'RUNTIME_ERROR',
            message: 'El codigo compilo pero fallo en ejecucion. Revisa variables no definidas, nulos y accesos invalidos.',
        };
    }

    if (status === 'TIMEOUT') {
        return {
            code: 'TIMEOUT',
            message: 'La ejecucion supero el tiempo limite. Revisa ciclos infinitos o algoritmos costosos.',
        };
    }

    if (status === 'MEMORIA_EXCEDIDA') {
        return {
            code: 'MEMORY_LIMIT',
            message: 'La ejecucion excedio la memoria permitida. Reduce estructuras grandes o recursion profunda.',
        };
    }

    return {
        code: 'UNKNOWN_EXECUTION_ERROR',
        message: 'No se pudo clasificar el error de ejecucion. Revisa el campo errors para el detalle tecnico.',
    };
}

async function resolveExecutionContextByFileId(fileId) {
    const file = await File.findById(fileId).select('roomId language').lean();
    if (!file) {
        throw buildContextError('El archivo no existe', 'FILE_NOT_FOUND', 404);
    }

    const room = await Room.findById(file.roomId).select('_id').lean();
    if (!room) {
        throw buildContextError('La sala asociada al archivo no existe', 'ROOM_NOT_FOUND', 404);
    }

    const latestCodeSession = await CodeSession.findOne({ fileId })
        .sort({ version: -1, savedAt: -1 })
        .select('code')
        .lean();

    if (!latestCodeSession) {
        throw buildContextError(
            'No hay codeSession para este archivo. Guarda una sesion antes de ejecutar.',
            'CODE_SESSION_NOT_FOUND',
            400
        );
    }

    return {
        roomId: file.roomId,
        language: file.language,
        code: latestCodeSession.code ?? '',
    };
}
