'use strict'
import { Schema, model } from 'mongoose';

// Enums for role and connection status
const PARTICIPATION_ROLES = ['ANFITRION', 'MIEMBRO'];
const CONNECTION_STATUSES = ['CONECTADO', 'DESCONECTADO', 'AUSENTE'];

const PermissionsSchema = new Schema(
    {
        canEdit: {
            type: Boolean,
            required: true,
        },
        canRun: {
            type: Boolean,
            required: true,
        },
        canInvite: {
            type: Boolean,
            required: true,
        },
        canKick: {
            type: Boolean,
            required: true,
        },
        canCloseRoom: {
            type: Boolean,
            required: true,
        },
    },
    { _id: false }
);

const RoomParticipationSchema = new Schema(
    {
        // salaId -> referencia a la sala (Room)
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'La sala es obligatoria'],
        },

        // usuarioId -> ID del usuario (proveído por AuthService)
        userId: {
            type: String,
            required: [true, 'El usuario es obligatorio'],
            trim: true,
        },

        // Rol del usuario dentro de la sala
        role: {
            type: String,
            required: [true, 'El rol es obligatorio'],
            enum: {
                values: PARTICIPATION_ROLES,
                message: 'Rol de participación inválido',
            },
        },

        // Permisos específicos del usuario en la sala
        permissions: {
            type: PermissionsSchema,
            required: true,
        },

        // Momento en el que el usuario ingresó a la sala
        joinedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // Momento en el que el usuario salió de la sala (null si sigue conectado)
        // La regla leftAt > joinedAt se valida en el controller (en update el schema no tiene acceso a joinedAt)
        leftAt: {
            type: Date,
            default: null,
        },

        // Tiempo total acumulado en la sala en minutos
        totalMinutes: {
            type: Number,
            default: 0,
            min: [0, 'El tiempo total no puede ser negativo'],
        },

        // Estado actual de conexión
        connectionStatus: {
            type: String,
            required: true,
            enum: {
                values: CONNECTION_STATUSES,
                message: 'Estado de conexión inválido',
            },
            default: 'CONECTADO',
        },
    },
    {
        versionKey: false,
    }
);

// Un usuario no puede tener dos participaciones en la misma sala
RoomParticipationSchema.index({ roomId: 1, userId: 1 }, { unique: true });

// Índice para consultas por sala y rol
RoomParticipationSchema.index({ roomId: 1, role: 1 });

// Índice para consultas por usuario
RoomParticipationSchema.index({ userId: 1 });

// Índice para consultas por estado de conexión
RoomParticipationSchema.index({ connectionStatus: 1 });

// Validación: Solo puede haber un ANFITRION por sala (async sin next para evitar "next is not a function")
RoomParticipationSchema.pre('save', async function () {
    if (this.role !== 'ANFITRION') return;

    const existingHost = await this.constructor.findOne({
        roomId: this.roomId,
        role: 'ANFITRION',
        _id: { $ne: this._id },
    });

    if (existingHost) {
        throw new Error('Ya existe un anfitrión para esta sala');
    }
});

export default model('RoomParticipation', RoomParticipationSchema);

