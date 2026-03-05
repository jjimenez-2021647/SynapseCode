'use strict';

import { Schema, model } from 'mongoose';

const EXECUTION_LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const EXECUTION_STATUS = ['EXITOSO', 'ERROR_COMPILACION', 'ERROR_RUNTIME', 'TIMEOUT', 'MEMORIA_EXECEDIDA'];

const CodeExecutionSchema = new Schema(
    {
        // ID de la sala donde se ejecuto el codigo
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
            immutable: true,
        },

        // ID del archivo que se ejecuto
        fileId: {
            type: Schema.Types.ObjectId,
            ref: 'File',
            required: [true, 'El ID del archivo es obligatorio'],
            immutable: true,
        },

        // ID del usuario que ejecuto el codigo (del token JWT)
        userId: {
            type: String,
            required: [true, 'El ID del usuario es obligatorio'],
            trim: true,
        },

        // Lenguaje de programacion de la ejecucion
        language: {
            type: String,
            required: [true, 'El lenguaje es obligatorio'],
            enum: {
                values: EXECUTION_LANGUAGES,
                message: 'Lenguaje invalido',
            },
            uppercase: true,
            set: (value) => (value === 'C#' ? 'CSHARP' : value),
        },

        // Codigo que se ejecuto 
        executedCode: {
            type: String,
            required: [true, 'El codigo ejecutado es obligatorio'],
            maxlength: [5000, 'El codigo no puede exceder 5,000 caracteres'],
        },

        // Entrada proporcionada para la ejecucion
        input: {
            type: String,
            default: '',
        },

        // Salida producida por la ejecucion
        output: {
            type: String,
            default: '',
        },

        // Errores producidos durante la ejecucion (compilacion o runtime)
        errors: {
            type: String,
            default: '',
        },

        // Tiempo de ejecucion en milisegundos
        executionTimeMs: {
            type: Number,
            min: [0, 'El tiempo de ejecución debe ser mayor o igual a 0'],
            max: [5000, 'El tiempo de ejecución no puede exceder 5,000 ms (5 segundos)'],
        },

        // Memoria consumida durante la ejecucion en KB
        usedMemoryKb: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'La memoria usada debe ser mayor o igual a 0'],
            max: [131072, 'La memoria usada no puede exceder 131,072 KB (128 MB)'],
        },

        // Estado de la ejecucion 
        executionStatus: {
            type: String,
            required: [true, 'El estado de la ejecución es obligatorio'],
            enum: {
                values: EXECUTION_STATUS,
                message: 'Estado de ejecución invalido',
            },
            uppercase: true,
        },

        // Fecha y hora en que se ejecuto el codigo
        executedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // ID de la ejecucion en Jugde() API
        judge0TokenId: {
            type: String,
            default: null,
            trim: true,
        }
    },
    {
        versionKey: false,
        timestamps: false
    }
)

// Indice para consultas frecuentes / rate limiting
CodeExecutionSchema.index({ userId: 1, executedAt: -1 });

// Indice para consultas por archivo y orden cronologico
CodeExecutionSchema.index({ fileId: 1, executedAt: -1 });

// Indice para consultas por sala y orden cronologico
CodeExecutionSchema.index({ roomId: 1, executedAt: -1 });

// Indice para consultas por estado de ejecucion
CodeExecutionSchema.index({ executionStatus: 1 });

// Indice compuesto para consultas por usuario, estado de ejecucion y orden cronologico
CodeExecutionSchema.index({ userId: 1, executionStatus: 1, executedAt: -1 });

export default model('CodeExecution', CodeExecutionSchema);