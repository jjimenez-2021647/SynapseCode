'use strict'
import { Schema, model } from 'mongoose';

// Valores permitidos para enums del modelo CodeSession
const SESSION_LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const SAVE_TYPES        = ['MANUAL', 'AUTO', 'CHECKPOINT'];

const CodeSessionSchema = new Schema(
    {
        // ID del archivo al que pertenece esta sesión de código
        fileId: {
            type: Schema.Types.ObjectId,
            ref: 'File',
            required: [true, 'El ID del archivo es obligatorio'],
            immutable: true, // No se puede cambiar una vez creado
        },

        // ID de la sala (referencia rápida, evita joins encadenados)
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
            immutable: true,
        },

        // Lenguaje de programación de esta versión
        language: {
            type: String,
            required: [true, 'El lenguaje es obligatorio'],
            enum: {
                values: SESSION_LANGUAGES,
                message: 'Lenguaje invalido',
            },
            uppercase: true,
            set: (value) => (value === 'C#' ? 'CSHARP' : value),
        },

        // Contenido completo del código en este snapshot
        code: {
            type: String,
            required: [true, 'El codigo es obligatorio'],
            default: '',
            maxlength: [500000, 'El codigo no puede exceder 500,000 caracteres'],
        },

        // ID del usuario que guardó esta versión (del token JWT)
        savedByUserId: {
            type: String,
            required: [true, 'El ID del usuario que guardo es obligatorio'],
            trim: true,
        },

        // Número de versión incremental por archivo (no por sala)
        version: {
            type: Number,
            required: [true, 'El numero de version es obligatorio'],
            min: [1, 'La version debe ser mayor o igual a 1'],
        },

        // Tipo de guardado: manual, automático o checkpoint
        saveType: {
            type: String,
            required: [true, 'El tipo de guardado es obligatorio'],
            enum: {
                values: SAVE_TYPES,
                message: 'Tipo de guardado invalido',
            },
            default: 'MANUAL',
            uppercase: true,
        },

        // Fecha y hora en que se guardó esta versión
        savedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // Indica si este código fue ejecutado
        wasExecuted: {
            type: Boolean,
            required: true,
            default: false,
        },

        // Resultado de la ejecución (solo si wasExecuted = true)
        executionResult: {
            // Salida estándar (stdout) de la ejecución
            output: {
                type: String,
                default: null,
            },

            // Errores estándar (stderr) de la ejecución
            errors: {
                type: String,
                default: null,
            },

            // Tiempo de ejecución en milisegundos
            executionTimeMs: {
                type: Number,
                default: null,
                min: [0, 'El tiempo de ejecucion no puede ser negativo'],
            },

            // Memoria usada en kilobytes
            memoryUsedKb: {
                type: Number,
                default: null,
                min: [0, 'La memoria usada no puede ser negativa'],
            },
        },
    },
    {
        versionKey: false,
        timestamps: false, // Usamos savedAt personalizado
    }
);

// Índice compuesto único: no puede haber dos versiones iguales en el mismo archivo
CodeSessionSchema.index({ fileId: 1, version: 1 }, { unique: true });

// Índice para búsquedas por archivo ordenadas por versión
CodeSessionSchema.index({ fileId: 1, version: -1 });

// Índice para búsquedas por sala (útil para obtener todo el historial de una sala)
CodeSessionSchema.index({ roomId: 1, savedAt: -1 });

// Índice para búsquedas por usuario
CodeSessionSchema.index({ savedByUserId: 1 });

// Índice para búsquedas por fecha
CodeSessionSchema.index({ savedAt: -1 });

// Validación: si wasExecuted es true, executionResult debe tener datos
CodeSessionSchema.pre('save', function () {
    if (this.wasExecuted) {
        const hasExecutionData =
            this.executionResult.output        !== null ||
            this.executionResult.errors         !== null ||
            this.executionResult.executionTimeMs !== null ||
            this.executionResult.memoryUsedKb   !== null;

        if (!hasExecutionData) {
            throw new Error('Si el codigo fue ejecutado, debe tener resultado de ejecucion');
        }
    }
});

export default model('CodeSession', CodeSessionSchema);
