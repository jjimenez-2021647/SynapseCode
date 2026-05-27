'use strict'
import Chat from './chats.model.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

// Crear múltiples chats a la vez (usado por ServiceRoom al crear una sala)
export const batchCreateChats = async (req, res) => {
    try {
        const chatsData = Array.isArray(req.body) ? req.body : [req.body];

        if (!chatsData.length) {
            return res.status(400).json({
                message: 'Debe proporcionar al menos un chat para crear',
            });
        }

        const chats = await Chat.insertMany(chatsData, { ordered: false });

        return res.status(201).json({
            success: true,
            message: 'Chats creados exitosamente',
            chats: chats.map(chat => ({
                chatId: chat.chatId,
                numberChat: chat.numberChat,
                chatType: chat.chatType,
                roomId: chat.roomId,
            })),
        });
    } catch (error) {
        console.error('batchCreateChats error:', error);
        return res.status(400).json({
            success: false,
            message: 'Error creando los chats',
            error: error.message,
        });
    }
};

export const getChats = async (req, res) => {
    try {
        const { roomId } = req.query;
        const filters = {};

        if (roomId) {
            filters.roomId = roomId;
        }

        const chats = await Chat.find(filters).lean();
        return res.status(200).json(chats);
    } catch (error) {
        console.error('getChats error:', error);
        return res.status(500).json({ message: 'Error obteniendo chats' });
    }
};

export const getChatByRoomAndType = async (req, res) => {
    try {
        const { roomId, chatType } = req.query;

        const chat = await Chat.findOne({
            roomId: roomId,
            chatType: chatType,
        }).lean();

        if (!chat) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        return res.status(200).json(chat);
    } catch (error) {
        console.error('getChatByRoomAndType error:', error);
        return res.status(400).json({ message: error.message });
    }
};

export const deleteChatsForRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const result = await Chat.deleteMany({ roomId: roomId });

        return res.status(200).json({
            message: 'Chats eliminados correc tamente',
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('deleteChatsForRoom error:', error);
        return res.status(400).json({ message: error.message });
    }
};