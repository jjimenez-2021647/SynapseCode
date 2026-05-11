'use strict';

import { Schema, model } from 'mongoose';

const FolderSchema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
            immutable: true,
        },
        folderName: {
            type: String,
            required: [true, 'El nombre de la carpeta es obligatorio'],
            trim: true,
            minlength: [1, 'El nombre de la carpeta debe tener al menos 1 caracter'],
            maxlength: [100, 'El nombre de la carpeta no puede exceder 100 caracteres'],
            match: [/^[a-zA-Z0-9_\-\. ]+$/, 'El nombre de la carpeta contiene caracteres no permitidos'],
        },
        parentFolderId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
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
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

FolderSchema.index(
    { roomId: 1, parentFolderId: 1, folderName: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true },
    }
);
FolderSchema.index({ roomId: 1, parentFolderId: 1, isActive: 1 });
FolderSchema.index({ roomId: 1, displayOrder: 1 });
FolderSchema.index({ createdByUserId: 1 });

FolderSchema.pre('findOneAndUpdate', function () {
    this.set({ lastModifiedAt: new Date() });
});

export default model('Folder', FolderSchema);
