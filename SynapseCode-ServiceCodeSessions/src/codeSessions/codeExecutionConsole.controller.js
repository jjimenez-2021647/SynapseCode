'use strict'
import CodeExecutionConsole from './codeExecutionConsole.model.js';
import CodeSession from './codeSessions.model.js';
import { executeCode } from '../../helpers/code-execution.helper.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Validar que el usuario pertenece a la sala
 */
const validateUserInRoom = async (userId, roomId) => {
    // TODO: Consultar con servicio de rooms
    return true;
};

/**
 * Iniciar una consola interactiva de ejecución
 * POST /api/v1/console/start
 */
export const startExecutionConsole = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { sessionId, fileId, roomId, code, language, stdin } = req.body;

        if (!sessionId || !fileId || !roomId || !code) {
            return res.status(400).json({
                success: false,
                message: 'sessionId, fileId, roomId y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Validar que pertenece a la sala
        const isUserInRoom = await validateUserInRoom(userId, roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Crear o actualizar consola
        let console = await CodeExecutionConsole.findOne({
            sessionId,
            fileId,
            roomId,
            status: { $ne: 'finished' },
        });

        if (console) {
            // Agregar usuario a la consola existente
            console.addActiveUser(userId);
            await console.save();

            return res.status(200).json({
                success: true,
                message: 'Usuario conectado a consola existente',
                data: {
                    consoleId: console._id,
                    status: console.status,
                    userCount: console.userCount,
                    consoleOutput: console.consoleOutput,
                },
            });
        }

        // Crear nueva consola
        console = await CodeExecutionConsole.create({
            sessionId,
            fileId,
            roomId,
            createdByUserId: userId,
            code,
            language: language || 'JAVASCRIPT',
        });

        // Agregar usuario creador
        console.addActiveUser(userId);

        // Iniciar ejecución
        console.startExecution();

        try {
            // Ejecutar código (llama a Judge0)
            const result = await executeCode(language || 'JAVASCRIPT', code, stdin || '');

            // Actualizar consola con resultado
            console.appendOutput(result.output || '');

            if (result.errors) {
                console.setError(result.errors, 'RUNTIME');
            } else if (result.executionStatus !== 'EXITOSO') {
                console.setError(`Estado: ${result.executionStatus}`, 'RUNTIME');
            } else {
                console.finishExecution(0, result.usedMemoryKb || 0);
            }

            // Guardar Judge0 token para futuro polling
            if (result.judge0TokenId) {
                console.judge0TokenId = result.judge0TokenId;
            }
        } catch (execError) {
            console.setError(execError.message, 'RUNTIME');
        }

        await console.save();

        return res.status(201).json({
            success: true,
            message: 'Consola iniciada exitosamente',
            data: {
                consoleId: console._id,
                sessionId: console.sessionId,
                status: console.status,
                consoleOutput: console.consoleOutput,
                error: console.error,
                stats: console.executionStats,
                userCount: console.userCount,
            },
        });
    } catch (error) {
        console.error('startExecutionConsole error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error iniciando consola',
            error: 'START_CONSOLE_ERROR',
        });
    }
};

/**
 * Obtener estado de consola
 * GET /api/v1/console/:consoleId
 */
export const getConsoleStatus = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, console.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Actualizar actividad del usuario
        console.updateUserActivity(userId);
        await console.save();

        return res.status(200).json({
            success: true,
            message: 'Estado de consola obtenido',
            data: {
                consoleId: console._id,
                status: console.status,
                consoleOutput: console.consoleOutput,
                pendingInput: console.pendingInput,
                activeUsers: console.getActiveUsers(),
                userCount: console.userCount,
                isInteractive: console.isInteractive,
                stats: console.executionStats,
                error: console.error,
                inputHistory: console.getInputHistory(),
            },
        });
    } catch (error) {
        console.error('getConsoleStatus error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo estado',
            error: 'GET_CONSOLE_ERROR',
        });
    }
};

/**
 * Enviar input a la consola (stdin)
 * POST /api/v1/console/:consoleId/input
 */
export const submitConsoleInput = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;
        const { input } = req.body;

        if (!input) {
            return res.status(400).json({
                success: false,
                message: 'input es obligatorio',
                error: 'MISSING_INPUT',
            });
        }

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, console.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        if (console.status !== 'waiting_input') {
            return res.status(400).json({
                success: false,
                message: 'La consola no está esperando input',
                error: 'INVALID_STATUS',
                data: { currentStatus: console.status },
            });
        }

        // Registrar input
        console.submitInput(input, userId);
        console.markInputProcessed();

        // Simular procesamiento (en futuro con WebSocket sería más dinámico)
        console.appendOutput(`\n${input}\n`);
        console.status = 'running';

        await console.save();

        return res.status(200).json({
            success: true,
            message: 'Input procesado',
            data: {
                consoleId: console._id,
                status: console.status,
                consoleOutput: console.consoleOutput,
            },
        });
    } catch (error) {
        console.error('submitConsoleInput error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error enviando input',
            error: 'SUBMIT_INPUT_ERROR',
        });
    }
};

/**
 * Detener ejecución
 * POST /api/v1/console/:consoleId/stop
 */
export const stopConsoleExecution = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, console.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        if (console.status === 'finished' || console.status === 'stopped') {
            return res.status(400).json({
                success: false,
                message: 'La consola ya está detenida',
                error: 'ALREADY_STOPPED',
            });
        }

        console.status = 'stopped';
        console.finishExecution();
        await console.save();

        return res.status(200).json({
            success: true,
            message: 'Ejecución detenida',
            data: {
                consoleId: console._id,
                status: console.status,
            },
        });
    } catch (error) {
        console.error('stopConsoleExecution error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deteniendo ejecución',
            error: 'STOP_EXECUTION_ERROR',
        });
    }
};

/**
 * Obtener output completo de consola
 * GET /api/v1/console/:consoleId/output
 */
export const getConsoleOutput = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, console.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Output obtenido',
            data: {
                consoleId: console._id,
                status: console.status,
                consoleOutput: console.consoleOutput,
                error: console.error,
                stats: console.executionStats,
                inputHistory: console.getInputHistory(),
            },
        });
    } catch (error) {
        console.error('getConsoleOutput error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo output',
            error: 'GET_OUTPUT_ERROR',
        });
    }
};

/**
 * Conectar usuario a consola existente
 * POST /api/v1/console/:consoleId/connect
 */
export const connectUserToConsole = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, console.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Agregar usuario
        console.addActiveUser(userId);
        await console.save();

        return res.status(200).json({
            success: true,
            message: 'Usuario conectado a la consola',
            data: {
                consoleId: console._id,
                status: console.status,
                userCount: console.userCount,
                activeUsers: console.getActiveUsers(),
                consoleOutput: console.consoleOutput,
            },
        });
    } catch (error) {
        console.error('connectUserToConsole error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error conectando usuario',
            error: 'CONNECT_USER_ERROR',
        });
    }
};

/**
 * Desconectar usuario de consola
 * POST /api/v1/console/:consoleId/disconnect
 */
export const disconnectUserFromConsole = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { consoleId } = req.params;

        const console = await CodeExecutionConsole.findById(consoleId);
        if (!console) {
            return res.status(404).json({
                success: false,
                message: 'Consola no encontrada',
                error: 'CONSOLE_NOT_FOUND',
            });
        }

        // Remover usuario
        console.removeActiveUser(userId);
        await console.save();

        return res.status(200).json({
            success: true,
            message: 'Usuario desconectado',
            data: {
                consoleId: console._id,
                userCount: console.userCount,
            },
        });
    } catch (error) {
        console.error('disconnectUserFromConsole error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error desconectando usuario',
            error: 'DISCONNECT_USER_ERROR',
        });
    }
};

export default {
    startExecutionConsole,
    getConsoleStatus,
    submitConsoleInput,
    stopConsoleExecution,
    getConsoleOutput,
    connectUserToConsole,
    disconnectUserFromConsole,
};
