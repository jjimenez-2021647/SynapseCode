'use strict'
import { Schema, model } from 'mongoose';
import { generateNumberChat } from '../../helpers/chat.helper.js';
import { generatePasswordRoom } from '../../helpers/rooms.helpers.js';

const ROOM_TYPES = ['PUBLICA', 'PRIVADA'];
const ROOM_LANGUAGES = [
    'JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP',
    'TYPESCRIPT', 'GO', 'RUST', 'CPP', 'C',
    'BASH', 'SQL', 'PHP', 'RUBY', 'KOTLIN',
    'SWIFT', 'R', 'HASKELL', 'DART', 'SCALA',
    'ELIXIR', 'CLOJURE', 'OBJECTIVEC', 'FSHARP', 'GROOVY',
    'ERLANG', 'PERL', 'PASCAL', 'LUA', 'ASSEMBLY',
    'FORTRAN', 'PROLOG', 'JULIA'
];
const ROOM_STATUSES = ['ACTIVA', 'PAUSADA', 'CERRADA', 'ARCHIVADA'];
const PLAN_NAMES = ['FREE', 'PRO', 'ORG'];

const RoomSchema = new Schema(
    {
        roomCode: {
            type: String,
            required: [true, 'El codigo de sala es obligatorio'],
            unique: true,
            trim: true,
            uppercase: true,
            minlength: [11, 'El codigo de sala debe tener 11 caracteres'],
            maxlength: [11, 'El codigo de sala debe tener 11 caracteres'],
            match: [/^[A-Z]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/, 'Formato invalido para codigo de sala (ej: ABC-A1B-22C)'],
        },
        roomName: {
            type: String,
            required: [true, 'El nombre de la sala es obligatorio'],
            trim: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        },
        roomType: {
            type: String,
            required: [true, 'El tipo de sala es obligatorio'],
            enum: {
                values: ROOM_TYPES,
                message: 'Tipo de sala invalido',
            },
        },
        passwordRoom: {
            type: String,
            default: null,
        },
        roomLanguage: {
            type: Schema.Types.Mixed,  // Aceptar tanto strings como números (ID de Judge0)
            required: false,
            default: null,
            description: 'String para mono-lenguaje o Array de IDs/nombres para multi-lenguaje',
        },

        // Indica si la sala soporta múltiples lenguajes
        isMultiLanguage: {
            type: Boolean,
            required: false,
            default: false,
            description: 'true si la sala permite múltiples lenguajes, false si es mono-lenguaje',
        },
        hostId: {
            type: String,
            required: [true, 'El anfitrion es obligatorio'],
            trim: true,
            minlength: [1, 'El ID del anfitrion es inválido'],
        },
        hostPlan: {
            type: String,
            enum: {
                values: PLAN_NAMES,
                message: 'Plan del anfitrion invalido',
            },
            default: 'FREE',
            uppercase: true,
            trim: true,
        },
        maxUsers: {
            type: Number,
            required: [true, 'Debe definir el maximo de usuarios'],
            default: 10,
            min: [2, 'El maximo de usuarios no puede ser menor a 2'],
            validate: {
                validator: function(value) {
                    // Si no hay hostPlan definido aún, permitir la validación
                    // La validación final ocurrirá en el controller según el plan
                    if (!this.hostPlan || this.hostPlan === 'FREE') {
                        return value <= 5;
                    }
                    if (this.hostPlan === 'PRO') {
                        return value <= 20;
                    }
                    if (this.hostPlan === 'ORG') {
                        return value <= 10000; // Permitir hasta 10000 usuarios (cantidad de estudiantes en factura)
                    }
                    return value <= 12; // fallback
                },
                message: function() {
                    const plan = this.hostPlan || 'FREE';
                    const limits = { FREE: 5, PRO: 20, ORG: 10000 };
                    const max = limits[plan] || 12;
                    return `El maximo de usuarios para plan ${plan} es ${max}`;
                }
            }
        },
        connectedUsers: {
            type: [
                {
                    userId: {
                        type: String,
                        required: true,
                    },
                    username: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    subRole: {
                        type: String,
                        enum: ['HOST_ROLE', 'ASSISTANT_ROLE'],
                        required: true,
                        default: 'ASSISTANT_ROLE',
                    },
                    _id: false,
                },
            ],
            default: [],
        },
        currentCode: {
            type: String,
            default: '',
        },
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        lastActivity: {
            date: {
                type: Date,
                required: true,
                default: Date.now,
            },
            action: {
                type: String,
                trim: true,
                default: 'Creación de sala',
            },
            performedBy: {
                userId: {
                    type: String,
                    default: null,
                },
                username: {
                    type: String,
                    trim: true,
                    default: null,
                },
            },
        },
        roomStatus: {
            type: String,
            required: true,
            enum: {
                values: ROOM_STATUSES,
                message: 'Estado de sala invalido',
            },
            default: 'ACTIVA',
        },
        numberChat: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            default: null,
        },
    },
    {
        versionKey: false,
    }
);

RoomSchema.pre('validate', async function () {
    if (this.numberChat) return;

    const Room = model('Room');
    for (let i = 0; i < 10; i++) {
        const candidate = generateNumberChat();
        // eslint-disable-next-line no-await-in-loop
        const exists = await Room.countDocuments({ numberChat: candidate });
        if (!exists) {
            this.numberChat = candidate;
            return;
        }
    }

    this.numberChat = `chat_${Date.now()}`;
    return;
});

RoomSchema.pre('save', function () {
    if (this.roomType === 'PRIVADA' && !this.passwordRoom) {
        this.passwordRoom = generatePasswordRoom();
    }
});

export default model('Room', RoomSchema);
