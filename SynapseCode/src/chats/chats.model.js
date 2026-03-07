'use strict'
import { Schema, model } from 'mongoose';
import { randomBytes } from 'crypto';
import { generateNumberChat } from '../../helpers/chat.helper.js';

const generateChatId = () => {
    const bytes = randomBytes(6).toString('hex');
    return `cht_${bytes}`;
};

const ChatSchema = new Schema(
    {
        // numero para identificar el chat
        chatId: {
            type: String,
            required: true,
            unique: true,
            default: generateChatId,
        },

        // numero del chat que se usara para relacionar mensajes
        numberChat: {
            type: String,
            required: true,
            unique: true,
            uppercase: false,
            trim: true,
        },

        // Lista de mensajes asociados (referencias a Message)
        messages: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Message',
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Antes de validar, generar un numberChat unico si no viene ingresado
ChatSchema.pre('validate', async function () {
    if (this.numberChat) return;

    // Intentar generar un valor unico con hasta 10 intentos
    const Chat = model('Chat');
    for (let i = 0; i < 10; i++) {
        const candidate = generateNumberChat();
        // comprobar existencia
        // eslint-disable-next-line no-await-in-loop
        const exists = await Chat.countDocuments({ numberChat: candidate });
        if (!exists) {
            this.numberChat = candidate;
            return;
        }
    }

    // Fallback: usar timestamp si colapsa la generacion aleatoria
    this.numberChat = `chat_${Date.now()}`;
    return;
});

export default model('Chat', ChatSchema);
