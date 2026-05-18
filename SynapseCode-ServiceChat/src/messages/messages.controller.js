'use strict'
import Message from './messages.model.js';
import Chat from '../chats/chats.model.js';
import { validateAIExplanationUsage } from '../../helpers/ai-limits-validator.js';
import { validateChatHistoryAccess } from '../../helpers/chat-limits-validator.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';

/**
 * Crear mensaje
 */
export const createMessage = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { roomId, chatId, content, typeMessage, numberChat } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (!content || !typeMessage) {
            return res.status(400).json({
                success: false,
                message: 'content y typeMessage son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // ✅ Validar límite de explicaciones IA (ServicePlans)
        if (typeMessage === 'IA' || typeMessage === 'EXPLICACION_IA' || typeMessage === 'RESPONSE_IA') {
            try {
                const token = req.headers['x-token'] || req.headers.authorization?.replace('Bearer ', '');
                const aiValidation = await validateAIExplanationUsage(userId, token, Chat);

                if (!aiValidation.valid) {
                    return res.status(403).json({
                        success: false,
                        message: aiValidation.message,
                        planName: aiValidation.planName,
                        limit: aiValidation.limit,
                        used: aiValidation.used,
                        error: 'AI_LIMIT_EXCEEDED'
                    });
                }
            } catch (error) {
                console.warn('[WARN] Validación de límites de IA fallida, continuando:', error.message);
                // Continuar aunque ServicePlans no esté disponible
            }
        }

        const message = await Message.create({
            userId,
            roomId,
            chatId: chatId || null,
            numberChat: numberChat || null,
            content,
            typeMessage: typeMessage || 'TEXTO',
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        });

        // Obtener información del chat asociado
        let chatInfo = null;
        if (chatId) {
            const chat = await Chat.findOne({ chatId }).lean();
            if (chat) {
                chatInfo = {
                    chatId: chat.chatId,
                    numberChat: chat.numberChat,
                    chatType: chat.chatType,
                };
            }
        } else if (numberChat) {
            const chat = await Chat.findOne({ numberChat }).lean();
            if (chat) {
                chatInfo = {
                    chatId: chat.chatId,
                    numberChat: chat.numberChat,
                    chatType: chat.chatType,
                };
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Mensaje creado exitosamente',
            data: message,
            chat: chatInfo,
        });
    } catch (error) {
        console.error('createMessage error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando el mensaje',
            error: 'CREATE_MESSAGE_ERROR',
        });
    }
};

/**
 * Obtener mensajes con filtros
 */
export const getMessages = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { roomId, chatId, numberChat, typeMessage } = req.query;
        const filters = { messageStatus: { $ne: 'ELIMINADO' } };

        if (roomId) filters.roomId = roomId;
        if (chatId) filters.chatId = chatId;
        if (numberChat) filters.numberChat = numberChat;
        if (typeMessage) filters.typeMessage = typeMessage;

        // ✅ Validar límite de historial según plan del usuario
        if (userId) {
            try {
                const token = req.headers['x-token'] || req.headers.authorization?.replace('Bearer ', '');
                const historyAccess = await validateChatHistoryAccess(userId, token);

                // Si el usuario tiene límite de historial, filtrar mensajes más antiguos
                if (historyAccess.minimumDate) {
                    filters.sentAt = { $gte: historyAccess.minimumDate };
                }
            } catch (error) {
                console.warn('[WARN] Validación de límites de chat fallida, continuando:', error.message);
                // Continuar aunque ServicePlans no esté disponible
            }
        }

        const messages = await Message.find(filters).sort({ sentAt: 1 }).lean();

        // Enriquecer mensajes con información del chat
        const messagesWithChatInfo = await Promise.all(
            messages.map(async (message) => {
                let chatInfo = null;
                try {
                    if (message.chatId) {
                        const chat = await Chat.findOne({ chatId: message.chatId }).lean();
                        if (chat) {
                            chatInfo = {
                                chatId: chat.chatId,
                                numberChat: chat.numberChat,
                                chatType: chat.chatType,
                            };
                        }
                    } else if (message.numberChat) {
                        const chat = await Chat.findOne({ numberChat: message.numberChat }).lean();
                        if (chat) {
                            chatInfo = {
                                chatId: chat.chatId,
                                numberChat: chat.numberChat,
                                chatType: chat.chatType,
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Error obteniendo información del chat para mensaje: ${error.message}`);
                }

                return {
                    ...message,
                    chat: chatInfo,
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: messagesWithChatInfo.length,
            data: messagesWithChatInfo,
        });
    } catch (error) {
        console.error('getMessages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo mensajes',
            error: 'GET_MESSAGES_ERROR',
        });
    }
};

/**
 * Obtener mensajes de una sala específica
 */
export const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const skipAmount = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);

        const messages = await Message.find({
            roomId,
            messageStatus: { $ne: 'ELIMINADO' },
            typeMessage: { $ne: 'SISTEMA' },
        })
            .sort({ sentAt: 1 })
            .skip(skipAmount)
            .limit(Number.parseInt(limit, 10))
            .lean();

        const totalMessages = await Message.countDocuments({
            roomId,
            messageStatus: { $ne: 'ELIMINADO' },
            typeMessage: { $ne: 'SISTEMA' },
        });

        // Enriquecer mensajes con información del chat
        const messagesWithChatInfo = await Promise.all(
            messages.map(async (message) => {
                let chatInfo = null;
                try {
                    if (message.chatId) {
                        const chat = await Chat.findOne({ chatId: message.chatId }).lean();
                        if (chat) {
                            chatInfo = {
                                chatId: chat.chatId,
                                numberChat: chat.numberChat,
                                chatType: chat.chatType,
                            };
                        }
                    } else if (message.numberChat) {
                        const chat = await Chat.findOne({ numberChat: message.numberChat }).lean();
                        if (chat) {
                            chatInfo = {
                                chatId: chat.chatId,
                                numberChat: chat.numberChat,
                                chatType: chat.chatType,
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Error obteniendo información del chat para mensaje: ${error.message}`);
                }

                return {
                    ...message,
                    chat: chatInfo,
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                messages: messagesWithChatInfo,
                pagination: {
                    currentPage: Number.parseInt(page, 10),
                    totalPages: Math.ceil(totalMessages / Number.parseInt(limit, 10)),
                    totalMessages,
                    limit: Number.parseInt(limit, 10),
                },
            },
        });
    } catch (error) {
        console.error('getRoomMessages error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo mensajes de la sala',
            error: 'GET_ROOM_MESSAGES_ERROR',
        });
    }
};

/**
 * Obtener mensaje por ID
 */
export const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: 'messageId es obligatorio',
                error: 'MISSING_MESSAGE_ID',
            });
        }

        const message = await Message.findById(messageId).lean();

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado',
                error: 'MESSAGE_NOT_FOUND',
            });
        }

        if (message.messageStatus === 'ELIMINADO') {
            return res.status(404).json({
                success: false,
                message: 'Este mensaje ha sido eliminado',
                error: 'MESSAGE_DELETED',
            });
        }

        return res.status(200).json({
            success: true,
            data: message,
        });
    } catch (error) {
        console.error('getMessageById error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo el mensaje',
            error: 'GET_MESSAGE_ERROR',
        });
    }
};

/**
 * Editar mensaje de texto
 */
export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = getRequesterUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido es obligatorio y no puede estar vacío',
                error: 'MISSING_CONTENT',
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado',
                error: 'MESSAGE_NOT_FOUND',
            });
        }

        // Solo el autor puede editar su mensaje
        if (message.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este mensaje',
                error: 'FORBIDDEN',
            });
        }

        // No se pueden editar mensajes eliminados
        if (message.messageStatus === 'ELIMINADO') {
            return res.status(400).json({
                success: false,
                message: 'No se puede editar un mensaje eliminado',
                error: 'MESSAGE_DELETED',
            });
        }

        // Solo mensajes de texto pueden ser editados
        if (message.typeMessage !== 'TEXTO') {
            return res.status(400).json({
                success: false,
                message: `Los mensajes de tipo ${message.typeMessage} no pueden ser editados`,
                error: 'INVALID_TYPE_FOR_EDIT',
            });
        }

        // Límite de caracteres
        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'El contenido no puede exceder 5000 caracteres',
                error: 'CONTENT_TOO_LONG',
            });
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        message.messageStatus = 'EDITADO';

        await message.save();

        return res.status(200).json({
            success: true,
            message: 'Mensaje actualizado exitosamente',
            data: message,
        });
    } catch (error) {
        console.error('editMessage error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error editando el mensaje',
            error: 'EDIT_MESSAGE_ERROR',
        });
    }
};

/**
 * Obtener mensajes de sistema
 */
export const getSystemMessages = async (req, res) => {
    try {
        const { roomId } = req.query;
        const filters = { typeMessage: 'SISTEMA', messageStatus: { $ne: 'ELIMINADO' } };

        if (roomId) filters.roomId = roomId;

        const messages = await Message.find(filters).sort({ sentAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });
    } catch (error) {
        console.error('getSystemMessages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo mensajes de sistema',
            error: 'GET_SYSTEM_MESSAGES_ERROR',
        });
    }
};

/**
 * Crear mensaje de sistema
 */
export const createSystemMessage = async (req, res) => {
    try {
        const requesterIsAdmin = isAdminRole(req);

        if (!requesterIsAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Solo ADMIN_ROLE puede crear mensajes de sistema',
                error: 'FORBIDDEN',
            });
        }

        const { roomId, content, numberChat } = req.body;

        if (!roomId || !content) {
            return res.status(400).json({
                success: false,
                message: 'roomId y content son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const message = await Message.create({
            roomId,
            userId: 'SYSTEM',
            typeMessage: 'SISTEMA',
            content,
            numberChat: numberChat || null,
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Mensaje de sistema creado exitosamente',
            data: message,
        });
    } catch (error) {
        console.error('createSystemMessage error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando mensaje de sistema',
            error: 'CREATE_SYSTEM_MESSAGE_ERROR',
        });
    }
};

/**
 * Eliminar mensaje (soft delete)
 */
export const deleteMessage = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { messageId } = req.params;
        const requesterIsAdmin = isAdminRole(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado',
                error: 'MESSAGE_NOT_FOUND',
            });
        }

        // Solo el autor o admin pueden eliminar
        if (!requesterIsAdmin && message.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este mensaje',
                error: 'FORBIDDEN',
            });
        }

        message.messageStatus = 'ELIMINADO';
        await message.save();

        return res.status(200).json({
            success: true,
            message: 'Mensaje eliminado exitosamente',
            data: message,
        });
    } catch (error) {
        console.error('deleteMessage error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando el mensaje',
            error: 'DELETE_MESSAGE_ERROR',
        });
    }
};