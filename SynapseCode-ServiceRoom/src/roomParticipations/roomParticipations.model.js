'use strict'
import { Schema, model } from 'mongoose';

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
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'La sala es obligatoria'],
        },
        userId: {
            type: String,
            required: [true, 'El usuario es obligatorio'],
            trim: true,
        },
        username: {
            type: String,
            default: null,
            trim: true,
        },
        role: {
            type: String,
            required: [true, 'El rol es obligatorio'],
            enum: {
                values: PARTICIPATION_ROLES,
                message: 'Rol de participación inválido',
            },
        },
        permissions: {
            type: PermissionsSchema,
            required: true,
        },
        joinedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        leftAt: {
            type: Date,
            default: null,
        },
        totalMinutes: {
            type: Number,
            default: 0,
            min: [0, 'El tiempo total no puede ser negativo'],
        },
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

RoomParticipationSchema.index({ roomId: 1, userId: 1 }, { unique: true });
RoomParticipationSchema.index({ roomId: 1, role: 1 });
RoomParticipationSchema.index({ userId: 1 });
RoomParticipationSchema.index({ connectionStatus: 1 });

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