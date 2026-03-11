'use strict'
import { Schema, model } from 'mongoose';

const ExplanationSchema = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'El ID del usuario es obligatorio'],
            trim: true,
        },
        fileId: {
            type: Schema.Types.ObjectId,
            ref: 'File',
            required: [true, 'El ID del archivo es obligatorio'],
        },
        version: {
            type: Number,
            required: [true, 'La versión del archivo es obligatoria'],
            min: [0, 'La versión no puede ser negativa'],
        },
        language: {
            type: String,
            required: [true, 'El lenguaje es obligatorio'],
            uppercase: true,
        },
        code: {
            type: String,
            required: [true, 'El código explicado es obligatorio'],
        },
        explanation: {
            type: String,
            required: [true, 'La explicación es obligatoria'],
        },
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

// índices para búsquedas frecuentes
ExplanationSchema.index({ fileId: 1 });
ExplanationSchema.index({ userId: 1 });

export default model('Explanation', ExplanationSchema);
