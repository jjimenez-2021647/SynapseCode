'use strict'
import { Schema, model } from 'mongoose';

const MESSAGE_TYPES = ['TEXTO', 'IMAGEN', 'AUDIO', 'ARCHIVO', 'SISTEMA'];
const MESSAGE_STATUSES = ['ENVIADO', 'EDITADO', 'ELIMINADO'];
const MODIFY_CODE_SESSION_VALUES = ['MODIFICAR', 'NO_MODIFICAR'];

const MessageSchema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El ID de la sala es obligatorio'],
        },
        userId: {
            type: String,
            required: [true, 'El ID del usuario es obligatorio'],
        },
        typeMessage: {
            type: String,
            required: [true, 'El tipo de mensaje es obligatorio'],
            enum: {
                values: MESSAGE_TYPES,
                message: 'Tipo de mensaje inválido',
            },
            default: 'TEXTO',
        },
        content: {
            type: String,
            required: [true, 'El contenido del mensaje es obligatorio'],
        },
        sentAt: {
            type: Date,
            required: [true, 'La fecha de envío es obligatoria'],
            default: Date.now,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
            default: null,
        },
        messageStatus: {
            type: String,
            required: [true, 'El estado del mensaje es obligatorio'],
            enum: {
                values: MESSAGE_STATUSES,
                message: 'Estado de mensaje inválido',
            },
            default: 'ENVIADO',
        },
        numberChat: {
            type: String,
            required: false,
            trim: true,
            default: null,
        },
        chatId: {
            type: String,
            required: false,
            trim: true,
            default: null,
        },
        modifyCodeSessions: {
            type: String,
            required: false,
            enum: {
                values: MODIFY_CODE_SESSION_VALUES,
            },
            default: 'NO_MODIFICAR',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

MessageSchema.index({ roomId: 1, sentAt: 1 });
MessageSchema.index({ userId: 1 });
MessageSchema.index({ numberChat: 1, sentAt: 1 });
MessageSchema.index({ chatId: 1, sentAt: 1 });

export default model('Message', MessageSchema);