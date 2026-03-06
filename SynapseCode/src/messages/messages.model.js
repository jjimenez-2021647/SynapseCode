'use strict'
import { Schema, model } from 'mongoose';

// Enum values
const MESSAGE_TYPES = ['TEXTO', 'IMAGEN', 'AUDIO', 'ARCHIVO', 'SISTEMA'];
const MESSAGE_STATUSES = ['ENVIADO', 'EDITADO', 'ELIMINADO'];

// Possible SISTEMA message templates
const SYSTEM_MESSAGE_TEMPLATES = {
    USER_JOINED: '{username} se unió a la sala',
    USER_LEFT: '{username} abandonó la sala',
    USER_KICKED: '{username} fue expulsado de la sala',
    LANGUAGE_CHANGED: '{username} cambió el lenguaje a {language}',
    CODE_EXECUTED_SUCCESS: 'Código ejecutado exitosamente ({duration}s)',
    CODE_EXECUTION_ERROR: 'Error de compilación: {error}',
    SESSION_SAVED: '{username} guardó la sesión (versión #{version})',
    ROOM_CLOSED: 'La sala ha sido cerrada por el anfitrión',
    ROOM_FULL: 'Sala llena: se alcanzó el límite de {maxUsers} usuarios',
    PERMISSIONS_REVOKED: 'Los permisos de edición de {username} han sido revocados',
    PERMISSIONS_GRANTED: '{username} ha recibido permisos de edición',
    CODE_EXECUTION_TIMEOUT: 'Tiempo de ejecución agotado',
    PARTICIPANT_ROLE_CHANGED: '{username} ahora es {role}',
    ROOM_LANGUAGE_ENFORCED: 'El lenguaje de la sala ha sido cambiado a {language}',
};

const MessageSchema = new Schema(
    {
        // Referencia a la sala donde se envió el mensaje
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'El ID de la sala es obligatorio'],
        },

        // Referencia al usuario que envió el mensaje
        userId: {
            type: String, // ID del AuthService
            required: [true, 'El ID del usuario es obligatorio'],
        },

        // Tipo de mensaje: TEXTO, IMAGEN, AUDIO, ARCHIVO, SISTEMA
        typeMessage: {
            type: String,
            required: [true, 'El tipo de mensaje es obligatorio'],
            enum: {
                values: MESSAGE_TYPES,
                message: 'Tipo de mensaje inválido',
            },
            default: 'TEXTO',
        },

        // Contenido del mensaje (texto, URL de Cloudinary, etc.)
        content: {
            type: String,
            required: [true, 'El contenido del mensaje es obligatorio'],
            validate: {
                validator: function (value) {
                    // Validar máximo de caracteres solo para mensajes de texto
                    if (this.typeMessage === 'TEXTO' && value.length > 100) {
                        return false;
                    }
                    return value.length > 0;
                },
                message: 'El contenido no puede exceder 100 caracteres para mensajes de texto',
            },
        },

        // Fecha y hora de envío del mensaje
        sentAt: {
            type: Date,
            required: [true, 'La fecha de envío es obligatoria'],
            default: Date.now,
        },

        // Indica si el mensaje fue editado
        isEdited: {
            type: Boolean,
            default: false,
        },

        // Fecha de la última edición (nullable)
        editedAt: {
            type: Date,
            default: null,
        },

        // Estado del mensaje: ENVIADO, EDITADO, ELIMINADO
        messageStatus: {
            type: String,
            required: [true, 'El estado del mensaje es obligatorio'],
            enum: {
                values: MESSAGE_STATUSES,
                message: 'Estado de mensaje inválido',
            },
            default: 'ENVIADO',
        },

        // Numero del chat al que pertenece el mensaje (ej: chat_A&5)
        numberChat: {
            type: String,
            required: false,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Índices para optimizar consultas
MessageSchema.index({ roomId: 1, sentAt: 1 });
MessageSchema.index({ userId: 1 });
MessageSchema.index({ messageStatus: 1 });
MessageSchema.index({ numberChat: 1, sentAt: 1 });

// Validación personalizada: si está editado, fechaEdicion es obligatoria
// Usar throw en lugar de callback next() para evitar incompatibilidades
MessageSchema.pre('save', function () {
    if (this.isEdited && !this.editedAt) {
        throw new Error('Si el mensaje está editado, la fecha de edición es obligatoria');
    }
});

// Validación personalizada: no permitir edición ni eliminación después de 30 minutos
MessageSchema.methods.canBeEdited = function () {
    const now = new Date();
    const timeDiff = now - this.sentAt;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    return timeDiff <= thirtyMinutesInMs;
};

MessageSchema.methods.canBeDeleted = function () {
    const now = new Date();
    const timeDiff = now - this.sentAt;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    return timeDiff <= thirtyMinutesInMs;
};

// Statics para generar mensajes del sistema
MessageSchema.statics.createSystemMessage = async function (roomId, templateKey, values = {}) {
    const template = SYSTEM_MESSAGE_TEMPLATES[templateKey];
    if (!template) {
        throw new Error(`Template de mensaje de sistema no encontrado: ${templateKey}`);
    }

    let content = template;
    Object.keys(values).forEach((key) => {
        content = content.replace(`{${key}}`, values[key]);
    });

    return this.create({
        roomId,
        userId: 'SYSTEM',
        typeMessage: 'SISTEMA',
        content,
        messageStatus: 'ENVIADO',
    });
};

const Message = model('Message', MessageSchema);

export default Message;
export { MESSAGE_TYPES, MESSAGE_STATUSES, SYSTEM_MESSAGE_TEMPLATES };
