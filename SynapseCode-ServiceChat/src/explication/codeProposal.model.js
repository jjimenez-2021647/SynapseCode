'use strict'
import { Schema, model } from 'mongoose';

/**
 * Modelo para propuestas de cambios de código generadas por IA
 * Usuario puede aceptar o rechazar antes de que se aplique
 */
const CodeProposalSchema = new Schema(
    {
        // Referencias
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
        userId: {
            type: String,
            required: [true, 'El ID del usuario es obligatorio'],
        },
        chatId: {
            type: Schema.Types.ObjectId,
            default: null,
            description: 'Chat de donde se generó la propuesta (opcional)',
        },

        // Código
        originalCode: {
            type: String,
            required: [true, 'El código original es obligatorio'],
        },
        proposedCode: {
            type: String,
            required: [true, 'El código propuesto es obligatorio'],
        },
        language: {
            type: String,
            required: true,
            uppercase: true,
            default: 'JAVASCRIPT',
        },

        // Descripción de cambios
        description: {
            type: String,
            required: [true, 'La descripción de cambios es obligatoria'],
            description: 'Explicación de qué cambia en el código',
        },
        changesSummary: {
            type: String,
            default: null,
            description: 'Resumen de cambios principales (líneas añadidas, eliminadas, etc)',
        },

        // Estado
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
            default: 'PENDING',
            index: true,
        },

        // Aprobación/Rechazo
        approvedAt: {
            type: Date,
            default: null,
        },
        approvedByUserId: {
            type: String,
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectedByUserId: {
            type: String,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: null,
            description: 'Por qué el usuario rechazó la propuesta',
        },

        // Metadata
        diffLines: {
            added: {
                type: Number,
                default: 0,
            },
            removed: {
                type: Number,
                default: 0,
            },
            modified: {
                type: Number,
                default: 0,
            },
        },
        timeToExpire: {
            type: Number,
            default: 3600000, // 1 hora en ms
            description: 'Tiempo antes de que la propuesta expire',
        },

        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        expiresAt: {
            type: Date,
            description: 'Cuándo expira esta propuesta',
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

// TTL Index: eliminar propuestas expiradas automáticamente después de 24 horas
CodeProposalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

// Índices para queries
CodeProposalSchema.index({ fileId: 1, status: 1 });
CodeProposalSchema.index({ roomId: 1, status: 1 });
CodeProposalSchema.index({ userId: 1, status: 1 });
CodeProposalSchema.index({ chatId: 1 });

// Método: aprobar propuesta
CodeProposalSchema.methods.approve = function(userId, reason = '') {
    this.status = 'APPROVED';
    this.approvedAt = new Date();
    this.approvedByUserId = userId;
    return this;
};

// Método: rechazar propuesta
CodeProposalSchema.methods.reject = function(userId, reason = '') {
    this.status = 'REJECTED';
    this.rejectedAt = new Date();
    this.rejectedByUserId = userId;
    this.rejectionReason = reason;
    return this;
};

// Método: marcar como expirada
CodeProposalSchema.methods.expire = function() {
    this.status = 'EXPIRED';
    return this;
};

// Método: calcular diff
CodeProposalSchema.methods.calculateDiff = function() {
    const originalLines = this.originalCode.split('\n');
    const proposedLines = this.proposedCode.split('\n');

    const added = proposedLines.length - originalLines.length;
    const removed = Math.max(0, originalLines.length - proposedLines.length);

    this.diffLines = {
        added: Math.max(0, added),
        removed,
        modified: Math.min(originalLines.length, proposedLines.length),
    };

    // Calcular fecha de expiración
    this.expiresAt = new Date(Date.now() + (this.timeToExpire || 3600000));

    return this;
};

// Pre-save: calcular diff automáticamente
CodeProposalSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('proposedCode')) {
        this.calculateDiff();
    }
    next();
});

export default model('CodeProposal', CodeProposalSchema);
