'use strict'
import mongoose from 'mongoose';
import Message from './messages.model.js';
import Room from '../rooms/rooms.model.js';
import Chat from '../chats/chats.model.js';
import RoomParticipation from '../roomParticipations/roomParticipations.model.js';
import File from '../files/files.model.js';
import CodeSession from '../codeSessions/codeSessions.model.js';
import { uploadToCloudinary } from '../../helpers/cloudinary-service.js';
import { getNextVersionByFile } from '../../helpers/code-sessions.helpers.js';
import { generateCodeWithGroq } from '../../helpers/groq.service.js';
import { normalizeCodeContent } from '../../helpers/code-normalizer.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?._id || req.user?.sub || null;
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';

const normalizeModifyCodeSessions = (value) => {
    const normalized = String(value || 'NO_MODIFICAR').toUpperCase();
    return normalized === 'MODIFICAR' ? 'MODIFICAR' : 'NO_MODIFICAR';
};

const normalizeCodeForSession = (aiContent) => {
    let raw = String(aiContent || '').trim();
    if (!raw) return '';

    // Si viene en bloque markdown, extraer solo el codigo interno
    if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-zA-Z0-9_+-]*\s*/u, '').replace(/\s*```$/u, '').trim();
    }

    raw = normalizeCodeContent(raw).trim();

    // Quitar envolturas de comillas dobles repetidas: "code", "\"code\"", etc.
    for (let i = 0; i < 3; i += 1) {
        if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
            raw = raw.slice(1, -1).trim();
            continue;
        }
        break;
    }

    return raw;
};

const resolveChatAndRoom = async ({ idChat, numberChat, roomId }) => {
    let chat = null;

    if (idChat) {
        chat = await Chat.findOne({ chatId: String(idChat).trim() }).lean();
    } else if (numberChat) {
        chat = await Chat.findOne({ numberChat: String(numberChat).trim() }).lean();
    }

    let resolvedRoom = null;
    let resolvedRoomId = roomId;

    if (chat) {
        resolvedRoomId = String(chat.roomId);
        resolvedRoom = await Room.findById(chat.roomId).lean();
    } else if (roomId) {
        if (mongoose.Types.ObjectId.isValid(String(roomId))) {
            resolvedRoom = await Room.findById(roomId).lean();
        } else {
            resolvedRoom = await Room.findOne({ roomCode: String(roomId).toUpperCase() }).lean();
        }
        resolvedRoomId = resolvedRoom ? String(resolvedRoom._id) : roomId;
    }

    return {
        chat,
        room: resolvedRoom,
        roomId: resolvedRoomId,
    };
};

const ensureUserBelongsToRoom = async ({ roomId, userId }) => {
    if (!roomId || !userId) return false;

    const participation = await RoomParticipation.exists({
        roomId,
        userId,
        connectionStatus: { $ne: 'DESCONECTADO' },
    });

    return Boolean(participation);
};

const enrichMessagesWithRoomContext = (messages, room) => {
    const usernamesByUserId = new Map(
        (room?.connectedUsers || []).map((user) => [user.userId, user.username])
    );

    return messages.map((message) => ({
        ...message,
        roomName: room?.roomName || null,
        roomCode: room?.roomCode || null,
        username:
            message.userId === 'SYSTEM'
                ? 'SYSTEM'
                : usernamesByUserId.get(message.userId) || null,
    }));
};

const appendMessageToChat = async (chatId, messageId) => {
    if (!chatId) return;
    await Chat.findByIdAndUpdate(
        chatId,
        { $addToSet: { messages: messageId } },
        { new: false }
    );
};

export const createMessage = async (req, res) => {
    try {
        let {
            idChat,
            numberChat,
            typeMessage,
            content,
            modifyCodeSessions,
            fileId,
        } = req.body;

        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        if (!numberChat || !typeMessage) {
            return res.status(400).json({
                message: 'numberChat y typeMessage son obligatorios',
            });
        }

        // Para mensajes con archivo (IMAGEN, AUDIO, ARCHIVO), content es opcional
        // Para TEXTO, content es requerido
        const isFileType = ['IMAGEN', 'AUDIO', 'ARCHIVO'].includes(String(typeMessage).toUpperCase());
        if (!isFileType && !content) {
            return res.status(400).json({
                message: 'content es obligatorio para mensajes de tipo TEXTO',
            });
        }

        typeMessage = String(typeMessage).toUpperCase();

        const resolved = await resolveChatAndRoom({ idChat, numberChat });
        const room = resolved.room;
        const chat = resolved.chat;
        const roomId = resolved.roomId;

        if (!chat) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        if (!roomId || roomId === 'null' || roomId === 'undefined') {
            return res.status(400).json({ message: 'Chat sin sala valida' });
        }

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        const belongsToRoom = await ensureUserBelongsToRoom({ roomId, userId });
        if (!belongsToRoom) {
            return res.status(403).json({
                message: 'No tienes permisos para enviar mensajes en esta sala',
            });
        }

        const chatType = chat.chatType;
        const requestedModifyMode = normalizeModifyCodeSessions(modifyCodeSessions);

        if (chatType !== 'CHAT_IA' && requestedModifyMode === 'MODIFICAR') {
            return res.status(400).json({
                message: 'modifyCodeSessions=MODIFICAR solo se permite para CHAT_IA',
            });
        }

        let messageContent = content;
        if (['IMAGEN', 'AUDIO', 'ARCHIVO'].includes(typeMessage)) {
            console.log('Archivo recibido:', req.file);
            if (!req.file) {
                return res.status(400).json({
                    message: `Se requiere un archivo para mensajes de tipo ${typeMessage}`,
                });
            }

            try {
                console.log('Subiendo archivo a Cloudinary...');
                const uploadResult = await uploadToCloudinary(req.file, {
                    folder: `synapse-code/messages/${roomId}`,
                });
                console.log('Upload result:', uploadResult);
                messageContent = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                const errorMessage = uploadError?.message || uploadError?.toString() || 'Error desconocido al subir archivo';
                return res.status(500).json({ message: `Error al subir el archivo: ${errorMessage}` });
            }
        }

        if (typeMessage === 'TEXTO') {
            if (typeof messageContent !== 'string' || messageContent.trim().length === 0) {
                return res.status(400).json({
                    message: 'Para mensajes de texto, el contenido debe ser una cadena no vacia',
                });
            }

            if (messageContent.length > 5000) {
                return res.status(400).json({
                    message: 'El contenido no puede exceder 5000 caracteres',
                });
            }
        }

        const userMessage = await Message.create({
            roomId,
            userId,
            chatId: chat.chatId,
            numberChat: chat.numberChat,
            typeMessage,
            content: messageContent,
            modifyCodeSessions: chatType === 'CHAT_IA' ? requestedModifyMode : 'NO_MODIFICAR',
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        });

        await appendMessageToChat(chat._id, userMessage._id);

        await userMessage.populate('roomId');

        if (chatType !== 'CHAT_IA' || typeMessage !== 'TEXTO') {
            return res.status(201).json({
                userMessage,
                aiMessage: null,
                codeSession: null,
            });
        }

        const aiContent = await generateCodeWithGroq({
            prompt: messageContent,
            languageHint: room.roomLanguage || '',
        });

        const aiMessage = await Message.create({
            roomId,
            userId: 'SYSTEM',
            chatId: chat.chatId,
            numberChat: chat.numberChat,
            typeMessage: 'TEXTO',
            content: aiContent,
            modifyCodeSessions: requestedModifyMode,
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        });

        await appendMessageToChat(chat._id, aiMessage._id);

        let createdCodeSession = null;
        if (requestedModifyMode === 'MODIFICAR') {
            if (!fileId) {
                return res.status(400).json({
                    message: 'fileId es obligatorio cuando modifyCodeSessions es MODIFICAR',
                    userMessage,
                    aiMessage,
                });
            }

            const file = await File.findById(fileId).lean();
            if (!file) {
                return res.status(404).json({
                    message: 'El archivo indicado por fileId no existe',
                    userMessage,
                    aiMessage,
                });
            }

            if (String(file.roomId) !== String(roomId)) {
                return res.status(403).json({
                    message: 'El archivo no pertenece a la sala del chat IA',
                    userMessage,
                    aiMessage,
                });
            }

            const cleanCode = normalizeCodeForSession(aiContent);
            const version = await getNextVersionByFile(fileId);

            createdCodeSession = await CodeSession.create({
                fileId: file._id,
                roomId: roomId,
                language: file.language,
                code: cleanCode,
                savedByUserId: userId,
                version,
                saveType: 'MANUAL',
                wasExecuted: false,
                savedAt: new Date(),
            });

            await File.findByIdAndUpdate(fileId, {
                currentCode: cleanCode,
                lastModifiedByUserId: userId,
                lastModifiedAt: new Date(),
            });
        }

        return res.status(201).json({
            userMessage,
            aiMessage,
            codeSession: createdCodeSession,
        });
    } catch (error) {
        console.error('createMessage error:', error);
        const errorMessage = error?.message || error?.toString() || 'Error creando el mensaje';
        return res.status(400).json({
            message: errorMessage,
        });
    }
};

export const getRoomMessages = async (req, res) => {
    try {
        const { roomId, numberChat } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        const chat = await Chat.findOne({ numberChat, roomId }).lean();
        if (!chat) {
            return res.status(404).json({
                message: 'Chat no encontrado en la sala',
            });
        }

        // membership / admin check
        const userId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const belongs = await ensureUserBelongsToRoom({ roomId, userId });
        if (!belongs && !requesterIsAdmin) {
            return res.status(403).json({ message: 'No tienes permiso para ver los mensajes de esta sala' });
        }

        const skipAmount = (page - 1) * limit;

        const messages = await Message.find({
            roomId,
            numberChat,
            messageStatus: { $ne: 'ELIMINADO' },
            typeMessage: { $ne: 'SISTEMA' },
        })
            .sort({ sentAt: 1 })
            .skip(skipAmount)
            .limit(parseInt(limit, 10))
            .lean();

        const enrichedMessages = enrichMessagesWithRoomContext(messages, room);

        const totalMessages = await Message.countDocuments({
            roomId,
            numberChat,
            messageStatus: { $ne: 'ELIMINADO' },
            typeMessage: { $ne: 'SISTEMA' },
        });

        return res.status(200).json({
            messages: enrichedMessages,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                limit: parseInt(limit, 10),
            },
        });
    } catch (error) {
        console.error('getRoomMessages error:', error);
        return res.status(500).json({
            message: error.message || 'Error obteniendo los mensajes',
        });
    }
};

export const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Mensaje no encontrado',
            });
        }

        // membership check: only participants or admins can read
        const userId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const belongs = await ensureUserBelongsToRoom({ roomId: message.roomId, userId });
        if (!belongs && !requesterIsAdmin) {
            return res.status(403).json({
                message: 'No tienes permiso para ver este mensaje',
            });
        }

        if (message.messageStatus === 'ELIMINADO') {
            return res.status(404).json({
                message: 'Este mensaje ha sido eliminado',
            });
        }

        // Build response object, filtering modifyCodeSessions for non-CHAT_IA messages
        const messageResponse = message;
        const chatType = message.chatType || 'CHAT_SALA'; // default to CHAT_SALA
        
        // Only include modifyCodeSessions if chat is CHAT_IA
        if (chatType !== 'CHAT_IA') {
            delete messageResponse.modifyCodeSessions;
        }

        return res.status(200).json(messageResponse);
    } catch (error) {
        console.error('getMessageById error:', error);
        return res.status(400).json({
            message: error.message || 'Error obteniendo el mensaje',
        });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = getRequesterUserId(req);

        if (!content) {
            return res.status(400).json({
                message: 'El contenido es obligatorio',
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Mensaje no encontrado',
            });
        }

        // must be the author and still belong to room
        if (message.userId !== userId) {
            return res.status(403).json({
                message: 'No tienes permiso para editar este mensaje',
            });
        }
        const stillInRoom = await ensureUserBelongsToRoom({ roomId: message.roomId, userId });
        if (!stillInRoom) {
            return res.status(403).json({
                message: 'Ya no perteneces a la sala asociada a este mensaje',
            });
        }

        if (message.messageStatus === 'ELIMINADO') {
            return res.status(400).json({
                message: 'No se puede editar un mensaje eliminado',
            });
        }

        // Only TEXTO messages can be edited
        if (message.typeMessage !== 'TEXTO') {
            return res.status(400).json({
                message: `Los mensajes de tipo ${message.typeMessage} no pueden ser editados, solo eliminados`,
            });
        }

        // Only CHAT_SALA messages can be edited, not CHAT_IA
        const chatType = message.chatType || 'CHAT_SALA';
        if (chatType === 'CHAT_IA') {
            return res.status(400).json({
                message: 'Los mensajes de CHAT_IA no pueden ser editados, solo eliminados',
            });
        }

        if (!message.canBeEdited()) {
            return res.status(400).json({
                message: 'Solo puedes editar mensajes dentro de 30 minutos despues de su envio',
            });
        }

        if (message.typeMessage === 'TEXTO') {
            if (typeof content !== 'string' || content.length === 0) {
                return res.status(400).json({
                    message: 'Para mensajes de texto, el contenido debe ser una cadena no vacia',
                });
            }
            if (content.length > 5000) {
                return res.status(400).json({
                    message: 'El contenido no puede exceder 5000 caracteres',
                });
            }
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        message.messageStatus = 'EDITADO';

        await message.save();

        return res.status(200).json(message);
    } catch (error) {
        console.error('editMessage error:', error);
        return res.status(400).json({
            message: error.message || 'Error editando el mensaje',
        });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Mensaje no encontrado',
            });
        }

        if (!requesterIsAdmin && message.userId !== userId) {
            return res.status(403).json({
                message: 'No tienes permiso para eliminar este mensaje',
            });
        }
        if (!requesterIsAdmin) {
            const stillInRoom = await ensureUserBelongsToRoom({ roomId: message.roomId, userId });
            if (!stillInRoom) {
                return res.status(403).json({
                    message: 'Ya no perteneces a la sala asociada a este mensaje',
                });
            }
        }

        if (message.messageStatus === 'ELIMINADO') {
            return res.status(400).json({
                message: 'Este mensaje ya ha sido eliminado',
            });
        }

        if (!requesterIsAdmin && !message.canBeDeleted()) {
            return res.status(400).json({
                message: 'Solo puedes eliminar mensajes dentro de 30 minutos despues de su envio',
            });
        }

        message.messageStatus = 'ELIMINADO';
        message.content = requesterIsAdmin
            ? '[Mensaje eliminado por moderacion administrativa]'
            : '[Mensaje eliminado]';
        await message.save();

        return res.status(200).json({
            message: 'Mensaje eliminado exitosamente',
            deletedMessage: message,
        });
    } catch (error) {
        console.error('deleteMessage error:', error);
        return res.status(400).json({
            message: error.message || 'Error eliminando el mensaje',
        });
    }
};

export const getSystemMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId).lean();
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        const messages = await Message.find({
            roomId,
            typeMessage: 'SISTEMA',
            messageStatus: { $ne: 'ELIMINADO' },
        })
            .sort({ sentAt: -1 })
            .lean();

        const enrichedMessages = enrichMessagesWithRoomContext(messages, room);

        return res.status(200).json(enrichedMessages);
    } catch (error) {
        console.error('getSystemMessages error:', error);
        return res.status(500).json({
            message: error.message || 'Error obteniendo los mensajes del sistema',
        });
    }
};

export const createSystemMessage = async (req, res) => {
    try {
        const { roomId, templateKey, values } = req.body;

        if (!roomId || !templateKey) {
            return res.status(400).json({
                message: 'roomId y templateKey son obligatorios',
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        const message = await Message.createSystemMessage(roomId, templateKey, values);

        return res.status(201).json(message);
    } catch (error) {
        console.error('createSystemMessage error:', error);
        return res.status(400).json({
            message: error.message || 'Error creando el mensaje del sistema',
        });
    }
};
