'use strict'
import { Schema, model } from 'mongoose';

/**
 * Modelo para sesiones de Chat sobre Código
 * Permite conversaciones entre usuarios sobre un archivo específico
 * Con rate limiting y bloqueo de respuestas múltiples
 */
const CodeChatSchema = new Schema(
    {
        // Relaciones y contexto
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

        // Usuarios activos en el chat
        activeUsers: {
            type: [
                {
                    _id: false,
                    userId: String,
                    username: String,
                    connectedAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            default: [],
            description: 'Usuarios conectados actualmente al chat',
        },
        userCount: {
            type: Number,
            default: 0,
            description: 'Cantidad de usuarios conectados en este momento',
        },

        // Estado del chat
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        // Control de respuestas concurrentes
        isLoadingResponse: {
            type: Boolean,
            default: false,
            description: 'Indica si hay una respuesta en generación. Bloquea nuevos mensajes mientras sea true',
        },
        lastResponseGeneratedBy: {
            type: String,
            default: null,
            description: 'ID del usuario que está generando la respuesta actual',
        },

        // Código asociado
        language: {
            type: String,
            required: true,
            uppercase: true,
            default: 'JAVASCRIPT',
        },
        lastUpdatedCode: {
            type: String,
            required: [true, 'El código es obligatorio'],
            description: 'Código más reciente en esta sesión',
        },
        lastCodeUpdateAt: {
            type: Date,
            default: Date.now,
            description: 'Timestamp de cuándo se actualizó el código por última vez',
        },

        // Explicación inicial (referencia)
        explanationId: {
            type: Schema.Types.ObjectId,
            default: null,
            description: 'ID de la explicación que generó este chat',
        },
        initialExplanation: {
            type: String,
            default: null,
            description: 'Explicación inicial del código',
        },

        // Historial de mensajes
        messages: [
            {
                _id: false,
                role: {
                    type: String,
                    enum: ['user', 'assistant'],
                    required: true,
                },
                userId: {
                    type: String,
                    default: null,
                    description: 'ID del usuario (solo para mensajes de usuario)',
                },
                content: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                codeSnapshot: {
                    type: String,
                    default: null,
                    description: 'Snapshot del código en este punto de la conversación',
                },
            },
        ],

        // Metadata
        totalMessages: {
            type: Number,
            default: 0,
            description: 'Cantidad total de mensajes en el chat',
        },
        totalUserMessages: {
            type: Number,
            default: 0,
            description: 'Cantidad de mensajes del usuario (excluyendo asistente)',
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
        lastActivityAt: {
            type: Date,
            default: Date.now,
            description: 'Último momento de actividad en este chat',
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

// Índices para queries frecuentes
CodeChatSchema.index({ fileId: 1, roomId: 1 });
CodeChatSchema.index({ fileId: 1, isActive: 1 });
CodeChatSchema.index({ roomId: 1, isActive: 1 });
CodeChatSchema.index({ createdByUserId: 1 });
CodeChatSchema.index({ lastActivityAt: -1 });

// ─── Métodos para manejar usuarios activos ───────────────────────────────────

// Método helper: agregar usuario activo
CodeChatSchema.methods.addActiveUser = function(userId, username = null) {
    const userExists = this.activeUsers.some(u => u.userId === userId);
    if (!userExists) {
        this.activeUsers.push({
            userId,
            username: username || `Usuario-${userId.slice(0, 6)}`,
            connectedAt: new Date(),
        });
        this.userCount = this.activeUsers.length;
        this.updatedAt = new Date();
    }
    return this;
};

// Método helper: remover usuario activo
CodeChatSchema.methods.removeActiveUser = function(userId) {
    this.activeUsers = this.activeUsers.filter(u => u.userId !== userId);
    this.userCount = this.activeUsers.length;
    this.updatedAt = new Date();
    return this;
};

// Método helper: obtener usuarios activos
CodeChatSchema.methods.getActiveUsers = function() {
    return this.activeUsers.map(u => ({
        userId: u.userId,
        username: u.username,
        connectedAt: u.connectedAt,
    }));
};

// Método helper: verificar si usuario está activo
CodeChatSchema.methods.isUserActive = function(userId) {
    return this.activeUsers.some(u => u.userId === userId);
};

// Método helper: obtener cantidad de usuarios activos
CodeChatSchema.methods.getActiveUserCount = function() {
    return this.userCount;
};

// Método helper: agregar mensaje al chat
CodeChatSchema.methods.addMessage = function(role, content, userId = null, codeSnapshot = null) {
    this.messages.push({
        role,
        userId: role === 'user' ? userId : null,
        content,
        timestamp: new Date(),
        codeSnapshot,
    });

    this.totalMessages += 1;
    if (role === 'user') {
        this.totalUserMessages += 1;
    }

    this.lastActivityAt = new Date();
    this.updatedAt = new Date();

    return this;
};

// Método helper: obtener últimos N mensajes
CodeChatSchema.methods.getRecentMessages = function(count = 10) {
    return this.messages.slice(-count);
};

// Método helper: establecer estado de carga
CodeChatSchema.methods.setLoadingState = function(isLoading, userId = null) {
    this.isLoadingResponse = isLoading;
    this.lastResponseGeneratedBy = isLoading ? userId : null;
    this.updatedAt = new Date();
    return this;
};

// Método helper: actualizar código
CodeChatSchema.methods.updateCode = function(newCode) {
    this.lastUpdatedCode = newCode;
    this.lastCodeUpdateAt = new Date();
    this.updatedAt = new Date();
    return this;
};

export default model('CodeChat', CodeChatSchema);
