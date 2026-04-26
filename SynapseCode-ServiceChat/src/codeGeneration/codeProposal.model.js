'use strict'
import { Schema, model } from 'mongoose';

/**
 * Modelo para propuestas de cambios de código generadas por IA
 * Almacena el código actual y el propuesto para que el usuario apruebe o rechace
 */
const CodeProposalSchema = new Schema(
    {
        // Relaciones
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
            required: [true, 'El ID del usuario es obligatorio'],
        },

        // Código
        language: {
            type: String,
            required: true,
            uppercase: true,
            default: 'JAVASCRIPT',
        },
        currentCode: {
            type: String,
            required: [true, 'El código actual es obligatorio'],
            description: 'Código ANTES de los cambios',
        },
        proposedCode: {
            type: String,
            required: [true, 'El código propuesto es obligatorio'],
            description: 'Código DESPUÉS de los cambios (generado por IA)',
        },

        // Metadata de cambios
        changeDescription: {
            type: String,
            default: null,
            description: 'Descripción de qué cambió (generada por IA)',
        },
        changeLines: {
            type: [
                {
                    _id: false,
                    lineNumber: Number,
                    type: {
                        type: String,
                        enum: ['added', 'modified', 'removed'],
                    },
                    oldLine: String,
                    newLine: String,
                },
            ],
            default: [],
            description: 'Detalles línea por línea de cambios',
        },

        // Estado
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
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
        },

        // Prompt/contexto que generó esta propuesta
        generationPrompt: {
            type: String,
            default: null,
            description: 'El prompt que usó IA para generar este código',
        },
        generationContext: {
            type: String,
            default: null,
            description: 'Contexto adicional (ej: "agregar función de validación")',
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
CodeProposalSchema.index({ fileId: 1, roomId: 1 });
CodeProposalSchema.index({ fileId: 1, status: 1 });
CodeProposalSchema.index({ createdByUserId: 1 });
CodeProposalSchema.index({ status: 1, createdAt: -1 });

// Métodos helper
CodeProposalSchema.methods.approve = function(userId) {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.approvedByUserId = userId;
    this.updatedAt = new Date();
    return this;
};

CodeProposalSchema.methods.reject = function(userId, reason = null) {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectedByUserId = userId;
    this.rejectionReason = reason;
    this.updatedAt = new Date();
    return this;
};

CodeProposalSchema.methods.getDiffSummary = function() {
    const added = this.changeLines.filter(l => l.type === 'added').length;
    const modified = this.changeLines.filter(l => l.type === 'modified').length;
    const removed = this.changeLines.filter(l => l.type === 'removed').length;

    return {
        added,
        modified,
        removed,
        total: added + modified + removed,
    };
};

export default model('CodeProposal', CodeProposalSchema);
