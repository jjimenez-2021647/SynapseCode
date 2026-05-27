'use strict'
import CodeChat from './codeChat.model.js';
import Explanation from './explication.model.js';
import { getChatPrompt } from '../../configs/prompts.config.js';
import { generateStreamingResponseWithGroq, processGroqStream } from '../../helpers/groq.service.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Validar que el usuario pertenece a la sala
 * (Esta función debería consultar el servicio de rooms)
 */
const validateUserInRoom = async (userId, roomId) => {
    // TODO: Implementar validación con el servicio de rooms
    // Por ahora, asumimos que es válido
    return true;
};

/**
 * Iniciar una sesión de chat sobre código
 * POST /api/v1/explication/chat/start
 */
export const startCodeChat = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, roomId, code, language, explanationId, initialExplanation } = req.body;

        if (!fileId || !roomId || !code) {
            return res.status(400).json({
                success: false,
                message: 'fileId, roomId y code son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Validar que el usuario pertenece a la sala
        const isUserInRoom = await validateUserInRoom(userId, roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Crear o encontrar chat existente por fileId + roomId
        let chat = await CodeChat.findOne({
            fileId,
            roomId,
            isActive: true,
            deletedAt: null,
        });

        if (chat) {
            // Si ya existe, devolver el existente
            return res.status(200).json({
                success: true,
                message: 'Chat existente encontrado',
                data: {
                    chatId: chat._id,
                    fileId: chat.fileId,
                    roomId: chat.roomId,
                    language: chat.language,
                    messagesCount: chat.totalMessages,
                    isLoadingResponse: chat.isLoadingResponse,
                },
            });
        }

        // Crear nuevo chat
        chat = await CodeChat.create({
            fileId,
            roomId,
            createdByUserId: userId,
            code,
            lastUpdatedCode: code,
            language: language || 'JAVASCRIPT',
            explanationId: explanationId || null,
            initialExplanation: initialExplanation || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Chat iniciado exitosamente',
            data: {
                chatId: chat._id,
                fileId: chat.fileId,
                roomId: chat.roomId,
                language: chat.language,
                initialExplanation: chat.initialExplanation,
            },
        });
    } catch (error) {
        console.error('startCodeChat error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error iniciando chat',
            error: 'START_CHAT_ERROR',
        });
    }
};

/**
 * Enviar mensaje al chat con streaming SSE
 * POST /api/v1/explication/chat/:chatId/message
 */
export const sendChatMessage = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { chatId } = req.params;
        const { message, code } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es obligatorio',
                error: 'MISSING_MESSAGE',
            });
        }

        // Obtener el chat
        let chat = await CodeChat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat no encontrado',
                error: 'CHAT_NOT_FOUND',
            });
        }

        // Validar que el usuario pertenece a la sala
        const isUserInRoom = await validateUserInRoom(userId, chat.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Verificar si hay una respuesta en generación
        if (chat.isLoadingResponse) {
            return res.status(429).json({
                success: false,
                message: 'Otro usuario está esperando una respuesta. Intenta en unos segundos.',
                error: 'RESPONSE_LOADING',
                data: { generatedBy: chat.lastResponseGeneratedBy },
            });
        }

        // Actualizar código si fue proporcionado
        if (code) {
            chat.updateCode(code);
        }

        // Agregar mensaje del usuario
        chat.addMessage('user', message.trim(), userId, chat.lastUpdatedCode);

        // Marcar como cargando
        chat.setLoadingState(true, userId);
        await chat.save();

        // Generar prompt para Groq
        const recentMessages = chat.getRecentMessages(6); // Últimos 6 mensajes
        const prompt = getChatPrompt(
            chat.lastUpdatedCode,
            chat.language,
            recentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            })),
            message
        );

        // Configurar SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        try {
            // Obtener stream de Groq
            const groqResponse = await generateStreamingResponseWithGroq(prompt);
            const reader = groqResponse.body.getReader();
            const decoder = new TextDecoder();
            let fullAssistantResponse = '';

            // Enviar chunks al cliente
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json?.choices?.[0]?.delta?.content || '';

                            if (content) {
                                fullAssistantResponse += content;
                                // Enviar chunk al cliente como SSE
                                res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
                            }
                        } catch (e) {
                            // Ignorar líneas que no sean JSON válido
                        }
                    }
                }
            }

            // Guardar respuesta completa en BD
            chat.addMessage('assistant', fullAssistantResponse, null, chat.lastUpdatedCode);
            chat.setLoadingState(false);
            await chat.save();

            // Señal de fin de stream
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (streamError) {
            console.error('Error en stream de Groq:', streamError);

            // Desmarcar como cargando
            chat.setLoadingState(false);
            await chat.save();

            res.write(`data: ${JSON.stringify({ error: 'Error generando respuesta' })}\n\n`);
            res.end();
        }
    } catch (error) {
        console.error('sendChatMessage error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error enviando mensaje',
            error: 'SEND_MESSAGE_ERROR',
        });
    }
};

/**
 * Obtener historial de chat
 * GET /api/v1/explication/chat/:chatId
 */
export const getChatHistory = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { chatId } = req.params;

        const chat = await CodeChat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat no encontrado',
                error: 'CHAT_NOT_FOUND',
            });
        }

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, chat.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Historial obtenido',
            data: {
                chatId: chat._id,
                fileId: chat.fileId,
                roomId: chat.roomId,
                language: chat.language,
                isLoadingResponse: chat.isLoadingResponse,
                messages: chat.messages,
                totalMessages: chat.totalMessages,
                initialExplanation: chat.initialExplanation,
                lastUpdatedCode: chat.lastUpdatedCode,
                createdAt: chat.createdAt,
                lastActivityAt: chat.lastActivityAt,
            },
        });
    } catch (error) {
        console.error('getChatHistory error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo historial',
            error: 'GET_HISTORY_ERROR',
        });
    }
};

/**
 * Listar todos los chats de un archivo
 * GET /api/v1/explication/chat/file/:fileId
 */
export const listCodeChats = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId } = req.params;
        const { roomId } = req.query;

        const filter = {
            fileId,
            isActive: true,
            deletedAt: null,
        };

        if (roomId) {
            filter.roomId = roomId;
        }

        const chats = await CodeChat.find(filter)
            .select('_id fileId roomId language totalMessages isLoadingResponse createdAt lastActivityAt')
            .sort({ lastActivityAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Chats listados',
            data: chats,
        });
    } catch (error) {
        console.error('listCodeChats error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error listando chats',
            error: 'LIST_CHATS_ERROR',
        });
    }
};

/**
 * Eliminar (soft delete) un chat
 * DELETE /api/v1/explication/chat/:chatId
 */
export const deleteCodeChat = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { chatId } = req.params;

        const chat = await CodeChat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat no encontrado',
                error: 'CHAT_NOT_FOUND',
            });
        }

        // Solo el creador o admin puede eliminar
        if (chat.createdByUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este chat',
                error: 'FORBIDDEN',
            });
        }

        // Soft delete
        chat.deletedAt = new Date();
        chat.isActive = false;
        await chat.save();

        return res.status(200).json({
            success: true,
            message: 'Chat eliminado',
            data: { chatId: chat._id },
        });
    } catch (error) {
        console.error('deleteCodeChat error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error eliminando chat',
            error: 'DELETE_CHAT_ERROR',
        });
    }
};

export default {
    startCodeChat,
    sendChatMessage,
    getChatHistory,
    listCodeChats,
    deleteCodeChat,
};
