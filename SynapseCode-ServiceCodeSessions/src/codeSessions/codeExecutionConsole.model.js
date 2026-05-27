'use strict'
import { Schema, model } from 'mongoose';

/**
 * Modelo para consolas interactivas de ejecución de código
 * Permite I/O interactivo en tiempo real: stdin/stdout
 * Usuarios múltiples pueden ver y participar en la misma consola
 */
const CodeExecutionConsoleSchema = new Schema(
    {
        // Relaciones
        sessionId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El ID de la sesión es obligatorio'],
        },
        fileId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El ID del archivo es obligatorio'],
            index: true,
        },
        roomId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El ID de la sala es obligatorio'],
            index: true,
        },
        createdByUserId: {
            type: String,
            required: [true, 'El ID del usuario creador es obligatorio'],
        },

        // Usuarios activos en la consola
        activeUsers: {
            type: [
                {
                    _id: false,
                    userId: String,
                    username: String,
                    joinedAt: {
                        type: Date,
                        default: Date.now,
                    },
                    lastActivityAt: Date,
                },
            ],
            default: [],
            description: 'Usuarios conectados a esta consola',
        },
        userCount: {
            type: Number,
            default: 0,
            description: 'Cantidad de usuarios activos',
        },

        // Información de ejecución
        language: {
            type: String,
            required: true,
            uppercase: true,
        },
        code: {
            type: String,
            required: [true, 'El código es obligatorio'],
        },

        // Estado de ejecución
        status: {
            type: String,
            enum: ['idle', 'running', 'waiting_input', 'finished', 'error', 'stopped'],
            default: 'idle',
            index: true,
            description: 'Estado actual de la ejecución',
        },

        // Judge0 / Proceso info
        judge0TokenId: {
            type: String,
            default: null,
            description: 'Token de ejecución en Judge0 (para polling)',
        },
        processId: {
            type: String,
            default: null,
            description: 'ID del proceso (para futuro soporte local)',
        },

        // I/O
        consoleOutput: {
            type: String,
            default: '',
            description: 'Todo el output acumulado (stdout + stderr)',
        },
        pendingInput: {
            type: String,
            default: null,
            description: 'Input que está esperando recibir (si status=waiting_input)',
        },
        inputBuffer: {
            type: [
                {
                    _id: false,
                    submittedByUserId: String,
                    submittedByUsername: String,
                    input: String,
                    submittedAt: {
                        type: Date,
                        default: Date.now,
                    },
                    processedAt: Date,
                },
            ],
            default: [],
            description: 'Historial de inputs enviados',
        },

        // Configuración
        isInteractive: {
            type: Boolean,
            default: false,
            description: 'Si la ejecución espera input del usuario',
        },
        timeoutMs: {
            type: Number,
            default: 30000,
            description: 'Tiempo máximo de ejecución en ms',
        },
        maxInputWaitSeconds: {
            type: Number,
            default: 60,
            description: 'Tiempo máximo esperando input',
        },

        // Metadata de ejecución
        executionStats: {
            _id: false,
            startedAt: Date,
            finishedAt: Date,
            durationMs: Number,
            exitCode: Number,
            memoryUsedKb: Number,
        },

        // Errores
        error: {
            type: String,
            default: null,
        },
        errorType: {
            type: String,
            enum: ['COMPILATION', 'RUNTIME', 'TIMEOUT', 'MEMORY', 'OTHER'],
            default: null,
        },

        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },

        // Soft delete
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

// Índices
CodeExecutionConsoleSchema.index({ sessionId: 1 });
CodeExecutionConsoleSchema.index({ fileId: 1, roomId: 1 });
CodeExecutionConsoleSchema.index({ createdByUserId: 1 });
CodeExecutionConsoleSchema.index({ status: 1, createdAt: -1 });

// ─── Métodos helper ──────────────────────────────────────────────────────────

CodeExecutionConsoleSchema.methods.addActiveUser = function(userId, username = null) {
    const userExists = this.activeUsers.some(u => u.userId === userId);
    if (!userExists) {
        this.activeUsers.push({
            userId,
            username: username || `Usuario-${userId.slice(0, 6)}`,
            joinedAt: new Date(),
            lastActivityAt: new Date(),
        });
        this.userCount = this.activeUsers.length;
        this.updatedAt = new Date();
    }
    return this;
};

CodeExecutionConsoleSchema.methods.removeActiveUser = function(userId) {
    this.activeUsers = this.activeUsers.filter(u => u.userId !== userId);
    this.userCount = this.activeUsers.length;
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.updateUserActivity = function(userId) {
    const user = this.activeUsers.find(u => u.userId === userId);
    if (user) {
        user.lastActivityAt = new Date();
        this.updatedAt = new Date();
    }
    return this;
};

CodeExecutionConsoleSchema.methods.appendOutput = function(text) {
    this.consoleOutput += text;
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.submitInput = function(input, userId, username = null) {
    this.inputBuffer.push({
        submittedByUserId: userId,
        submittedByUsername: username || `Usuario-${userId.slice(0, 6)}`,
        input,
        submittedAt: new Date(),
    });
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.markInputProcessed = function() {
    if (this.inputBuffer.length > 0) {
        this.inputBuffer[this.inputBuffer.length - 1].processedAt = new Date();
    }
    return this;
};

CodeExecutionConsoleSchema.methods.startExecution = function() {
    this.status = 'running';
    this.executionStats = {
        startedAt: new Date(),
    };
    this.consoleOutput = '';
    this.inputBuffer = [];
    this.error = null;
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.finishExecution = function(exitCode = 0, memoryUsedKb = 0) {
    const startTime = this.executionStats?.startedAt?.getTime();
    const endTime = new Date().getTime();
    const duration = startTime ? endTime - startTime : 0;

    this.status = 'finished';
    this.executionStats = {
        ...this.executionStats,
        finishedAt: new Date(),
        durationMs: duration,
        exitCode,
        memoryUsedKb,
    };
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.setWaitingForInput = function() {
    this.status = 'waiting_input';
    this.isInteractive = true;
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.setError = function(errorMsg, errorType = 'OTHER') {
    this.status = 'error';
    this.error = errorMsg;
    this.errorType = errorType;
    if (!this.executionStats?.finishedAt) {
        this.finishExecution();
    }
    this.updatedAt = new Date();
    return this;
};

CodeExecutionConsoleSchema.methods.getActiveUsers = function() {
    return this.activeUsers.map(u => ({
        userId: u.userId,
        username: u.username,
        joinedAt: u.joinedAt,
        lastActivityAt: u.lastActivityAt,
    }));
};

CodeExecutionConsoleSchema.methods.getInputHistory = function() {
    return this.inputBuffer.map(i => ({
        submittedBy: i.submittedByUsername,
        input: i.input,
        submittedAt: i.submittedAt,
        processedAt: i.processedAt,
    }));
};

export default model('CodeExecutionConsole', CodeExecutionConsoleSchema);
