'use strict'
import { Schema, model } from 'mongoose';
import { generateNumberChat } from '../../helpers/chat.helper.js';
import { generatePasswordRoom } from '../../helpers/rooms.helpers.js';

// Valores permitidos para enums del modelo Room
const ROOM_TYPES = ['PUBLICA', 'PRIVADA'];
const ROOM_LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const ROOM_STATUSES = ['ACTIVA', 'PAUSADA', 'CERRADA', 'ARCHIVADA'];

const RoomSchema = new Schema(
    {
        // Codigo de la sala con formato ABC-DEF-GHI, unico y obligatorio
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
        //nombre de la sala cuenta como si fuera una validacion extra para entrar a la sala        
        roomName: {
            type: String,
            required: [true, 'El nombre de la sala es obligatorio'],
            trim: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        },

        // el tipo de la sala puede ser publica o privada
        roomType: {
            type: String,
            required: [true, 'El tipo de sala es obligatorio'],
            enum: {
                values: ROOM_TYPES,
                message: 'Tipo de sala invalido',
            },
        },

        // contrasenaa de la sala, solo para salas privadas
        passwordRoom: {
            type: String,
            default: null,
        },

        // lenguaje de progra que se va a usar en la sala
        roomLanguage: {
            type: String,
            required: false,
            default: null,
            enum: {
                values: ROOM_LANGUAGES,
                message: 'Lenguaje por defecto invalido',
            },
            uppercase: true,
            set: (value) => (value === 'C#' ? 'CSHARP' : value),
        },

        // se refiere al usuario que creo la sala pero se vuelve con un sub role tipo anfrition
        // ID personalizado del AuthService (ej: usr_XRzSuMfRwu9M)
        hostId: {
            type: String,
            required: [true, 'El anfitrion es obligatorio'],
            trim: true,
            minlength: [1, 'El ID del anfitrion es invÃ¡lido'],
        },

        // maximo de usuarios que estan permitidos dentro de la sala 2-12
        maxUsers: {
            type: Number,
            required: [true, 'Debe definir el maximo de usuarios'],
            default: 10,
            min: [2, 'El maximo de usuarios no puede ser menor a 2'],
            max: [12, 'El maximo de usuarios no puede ser mayor a 12'],
        },

        // listar los usuarios que estan dentro de la sala con su username, su id y su subRole dentro de la sala
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

        // es el codigo que se estara trabajando dentro de la sala pero por el momento se queda vacio
        currentCode: {
            type: String,
            default: '',
        },

        // la fecha que se creo la sala
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // la ultima actividad que se realizo dentro de la sala
        // tiene que indicar que se hizo junto con quien lo hizo
        lastActivity: {
            // fecha que se realizo esa modificaion se actualiza cada vez que se hace una accion dentro de la sala
            date: {
                type: Date,
                required: true,
                default: Date.now,
            },
            // accion que se realizo dentro de la sala, por ejemplo: "Sala creada", "Usuario X se unio a la sala", "Usuario Y salio de la sala", "Codigo actualizado por Usuario Z"
            action: {
                type: String,
                trim: true,
                default: 'CreaciÃ³n de sala',
            },
            // quien realizo la accion dentro de la sala, se guarda el id y el username del usuario que realizo la accion
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

        // Estado de sala esta indica si la sala esta Activa, pausada, cerrada o archivada
        roomStatus: {
            type: String,
            required: true,
            enum: {
                values: ROOM_STATUSES,
                message: 'Estado de sala invalido',
            },
            default: 'ACTIVA',
        },
        // numero del chat asociado a la sala (usado para agrupar mensajes fuera/ademas de roomId)
        numberChat: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            default: null,
        },

        // ID del chat asociado a la sala
        idChat: {
            type: Schema.Types.ObjectId,
            ref: 'Chat',
            required: false,
            default: null,
        },
    },
    {
        versionKey: false,
    }
);

// Antes de validar, generar numberChat unico si no viene provisto
RoomSchema.pre('validate', async function () {
    // Si ya tiene numberChat, nothing to do
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

    // fallback
    this.numberChat = `chat_${Date.now()}`;
    return;
});

// Antes de guardar, generar passwordRoom si es privada y no tiene
RoomSchema.pre('save', function () {
    if (this.roomType === 'PRIVADA' && !this.passwordRoom) {
        this.passwordRoom = generatePasswordRoom();
    }
});



export default model('Room', RoomSchema);

