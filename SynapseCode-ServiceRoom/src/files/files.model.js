'use strict'
import { Schema, model } from 'mongoose';

const FILE_LANGUAGES  = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const FILE_EXTENSIONS = ['java', 'py', 'js', 'jsx', 'html', 'css', 'cs'];

const FileSchema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
            immutable: true,
        },
        fileName: {
            type: String,
            required: [true, 'El nombre del archivo es obligatorio'],
            trim: true,
            minlength: [1, 'El nombre del archivo debe tener al menos 1 caracter'],
            maxlength: [100, 'El nombre del archivo no puede exceder 100 caracteres'],
            match: [/^[a-zA-Z0-9_\-\.]+$/, 'El nombre del archivo solo puede contener letras, numeros, guiones y puntos'],
        },
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
        language: {
            type: String,
            required: [true, 'El lenguaje es obligatorio'],
            enum: {
                values: FILE_LANGUAGES,
                message: 'Lenguaje no soportado',
            },
            uppercase: true,
        },
        currentCode: {
            type: String,
            required: false,
            default: '',
            maxlength: [500000, 'El codigo no puede exceder 500,000 caracteres'],
        },
        createdByUserId: {
            type: String,
            required: [true, 'El ID del usuario creador es obligatorio'],
            trim: true,
        },
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        lastModifiedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        lastModifiedByUserId: {
            type: String,
            required: [true, 'El ID del usuario que modifico es obligatorio'],
            trim: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        displayOrder: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'El orden de visualizacion no puede ser negativo'],
        },
        fileSize: {
            type: Number,
            default: 0,
            min: [0, 'El tamaño del archivo no puede ser negativo'],
        },
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

FileSchema.index({ roomId: 1, fileName: 1, fileExtension: 1 }, { unique: true });
FileSchema.index({ roomId: 1, isActive: 1 });
FileSchema.index({ createdByUserId: 1 });
FileSchema.index({ roomId: 1, displayOrder: 1 });

FileSchema.pre('save', function () {
    this.fileSize = Buffer.byteLength(this.currentCode, 'utf8');
});

FileSchema.pre('findOneAndUpdate', function () {
    this.set({ lastModifiedAt: new Date() });
});

FileSchema.virtual('fullFileName').get(function () {
    return `${this.fileName}.${this.fileExtension}`;
});

FileSchema.methods.isEmpty = function () {
    return !this.currentCode || this.currentCode.trim().length === 0;
};

FileSchema.methods.getExtensionWithDot = function () {
    return `.${this.fileExtension}`;
};

export default model('File', FileSchema);