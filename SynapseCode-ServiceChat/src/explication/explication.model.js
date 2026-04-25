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
        codeType: {
            type: String,
            enum: ['ALGORITHM', 'DATASTRUCTURE', 'BASIC'],
            default: 'BASIC',
            description: 'Tipo de código detectado (algoritmo, estructura de datos, o básico)',
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

ExplanationSchema.index({ fileId: 1 });
ExplanationSchema.index({ userId: 1 });
ExplanationSchema.index({ codeType: 1 });

export default model('Explanation', ExplanationSchema);