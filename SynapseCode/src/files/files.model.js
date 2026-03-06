'use strict'
import { Schema, model } from 'mongoose';

// Valores permitidos para enums del modelo File
const FILE_LANGUAGES  = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];

// Solo extensiones que tienen un lenguaje asignado:
// java → JAVA | py → PYTHON | js, jsx → JAVASCRIPT | html, css → HTML_CSS | cs → CSHARP
const FILE_EXTENSIONS = ['java', 'py', 'js', 'jsx', 'html', 'css', 'cs'];

const FileSchema = new Schema(
    {
        // ID de la sala a la que pertenece este archivo
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
            immutable: true,
        },

        // Nombre del archivo sin extensión 
        fileName: {
            type: String,
            required: [true, 'El nombre del archivo es obligatorio'],
            trim: true,
            minlength: [1, 'El nombre del archivo debe tener al menos 1 caracter'],
            maxlength: [100, 'El nombre del archivo no puede exceder 100 caracteres'],
            match: [/^[a-zA-Z0-9_\-\.]+$/, 'El nombre del archivo solo puede contener letras, numeros, guiones y puntos'],
        },

        // Extensión del archivo — debe coincidir con uno de los lenguajes soportados
        fileExtension: {
            type: String,
            required: [true, 'La extension del archivo es obligatoria'],
            trim: true,
            lowercase: true,
            enum: {
                values: FILE_EXTENSIONS,
                message: 'Extension no soportada. Permitidas: java, py, js, jsx, html, css, cs',
            },
        },

        // Lenguaje detectado automáticamente según la extensión
        language: {
            type: String,
            required: [true, 'El lenguaje es obligatorio'],
            enum: {
                values: FILE_LANGUAGES,
                message: 'Lenguaje no soportado',
            },
            uppercase: true,
        },

        // Contenido actual del archivo
        currentCode: {
            type: String,
            required: false,
            default: '',
            maxlength: [500000, 'El codigo no puede exceder 500,000 caracteres'],
        },

        // ID del usuario que creó el archivo (del token JWT)
        createdByUserId: {
            type: String,
            required: [true, 'El ID del usuario creador es obligatorio'],
            trim: true,
        },

        // Fecha de creación del archivo
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // Última modificación del archivo
        lastModifiedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // ID del usuario que hizo la última modificación
        lastModifiedByUserId: {
            type: String,
            required: [true, 'El ID del usuario que modifico es obligatorio'],
            trim: true,
        },

        // Si el archivo está activo (no eliminado — soft delete)
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },

        // Orden de visualización en el explorador de archivos
        displayOrder: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'El orden de visualizacion no puede ser negativo'],
        },

        // Tamaño del archivo en bytes (calculado automáticamente)
        fileSize: {
            type: Number,
            default: 0,
            min: [0, 'El tamaño del archivo no puede ser negativo'],
        },

        // Si el archivo es de solo lectura
        isReadOnly: {
            type: Boolean,
            default: false,
        },
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

// Índice compuesto único: no puede haber dos archivos con mismo nombre y extensión en la misma sala
FileSchema.index({ roomId: 1, fileName: 1, fileExtension: 1 }, { unique: true });

// Índice para búsquedas por sala filtrando activos
FileSchema.index({ roomId: 1, isActive: 1 });

// Índice para búsquedas por usuario creador
FileSchema.index({ createdByUserId: 1 });

// Índice para orden de visualización dentro de una sala
FileSchema.index({ roomId: 1, displayOrder: 1 });

// Pre-save: calcular tamaño del archivo automáticamente
FileSchema.pre('save', function () {
    this.fileSize = Buffer.byteLength(this.currentCode, 'utf8');
});

// Pre-update: actualizar lastModifiedAt automáticamente
FileSchema.pre('findOneAndUpdate', function () {
    this.set({ lastModifiedAt: new Date() });
});

// Virtual: nombre completo del archivo (ej: "main.py")
FileSchema.virtual('fullFileName').get(function () {
    return `${this.fileName}.${this.fileExtension}`;
});

// Método: verificar si el archivo está vacío
FileSchema.methods.isEmpty = function () {
    return !this.currentCode || this.currentCode.trim().length === 0;
};

// Método: obtener extensión con punto (ej: ".js")
FileSchema.methods.getExtensionWithDot = function () {
    return `.${this.fileExtension}`;
};

export default model('File', FileSchema);
