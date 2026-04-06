'use strict'
import { Schema, model } from 'mongoose';
import { generateNumberChat } from '../../helpers/chat.helper.js';

const CHAT_TYPES = ['CHAT_SALA', 'CHAT_IA'];

const generateChatId = () => {
    const bytes = require('crypto').randomBytes(6).toString('hex');
    return `cht_${bytes}`;
};

const ChatSchema = new Schema(
    {
        chatId: {
            type: String,
            required: true,
            unique: true,
            default: generateChatId,
        },
        numberChat: {
            type: String,
            required: true,
            unique: true,
            uppercase: false,
            trim: true,
        },
        roomId: {
            type: Schema.Types.ObjectId,
            required: [true, 'El roomId del chat es obligatorio'],
            index: true,
        },
        chatType: {
            type: String,
            required: [true, 'El tipo de chat es obligatorio'],
            enum: {
                values: CHAT_TYPES,
                message: 'Tipo de chat invalido',
            },
        },
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

ChatSchema.pre('validate', async function () {
    if (this.numberChat) return;

    const Chat = model('Chat');
    for (let i = 0; i < 10; i++) {
        const candidate = generateNumberChat();
        // eslint-disable-next-line no-await-in-loop
        const exists = await Chat.countDocuments({ numberChat: candidate });
        if (!exists) {
            this.numberChat = candidate;
            return;
        }
    }

    this.numberChat = `chat_${Date.now()}`;
    return;
});

ChatSchema.index(
    { roomId: 1, chatType: 1 },
    {
        unique: true,
        partialFilterExpression: {
            roomId: { $exists: true },
            chatType: { $exists: true },
        },
    }
);

const Chat = model('Chat', ChatSchema);

export default Chat;