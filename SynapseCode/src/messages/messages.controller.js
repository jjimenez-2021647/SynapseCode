'use strict'
import Message from './messages.model.js';
import { uploadToCloudinary } from '../../helpers/cloudinary-service.js';
import Room from '../rooms/rooms.model.js';
import Chat from '../chats/chats.model.js';
import RoomParticipation from '../roomParticipations/roomParticipations.model.js';
import mongoose from 'mongoose';

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

/**
    Crear un nuevo mensaje
    Valida que el tipo de mensaje sea coherente con el contenido
    Si es IMAGEN, AUDIO o ARCHIVO, maneja la subida a Cloudinary
    Solo HOST_ROLE y ASSISTANT_ROLE pueden crear mensajes
 */
export const createMessage = async (req, res) => {
    try {
    let { roomId, typeMessage, content, numberChat } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!roomId || !typeMessage || (!content && !req.file)) {
            return res.status(400).json({
                message: 'roomId, typeMessage y content son obligatorios',
            });
        }

        // Resolver roomId: si el cliente envía un roomCode (ej: "TYM-SBP-FJR")
        // intentar buscar la sala por roomCode y usar su _id.
        let room = null;
        if (roomId) {
            const looksLikeObjectId = mongoose.Types.ObjectId.isValid(String(roomId));
            if (looksLikeObjectId) {
                room = await Room.findById(roomId).lean();
            } else {
                // Tratar roomId como roomCode
                room = await Room.findOne({ roomCode: String(roomId).toUpperCase() }).lean();
                if (room) {
                    roomId = String(room._id);
                }
            }
        }

        // Si no se encontró sala pero tampoco se proporcionó numberChat, error
        if (!room && !numberChat) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        // Validar que el usuario sea HOST_ROLE o ASSISTANT_ROLE en la sala
        if (room) {
            const participation = await RoomParticipation.findOne({
                roomId: room._id,
                userId,
            }).lean();

            if (!participation || !['ANFITRION', 'ASISTENTE'].includes(participation.role)) {
                return res.status(403).json({
                    message: 'Solo HOST_ROLE (ANFITRION) y ASSISTANT_ROLE (ASISTENTE) pueden crear mensajes',
                });
            }
        }

        let messageContent = content;

        // Si es IMAGEN, AUDIO o ARCHIVO, procesar el archivo
        if (['IMAGEN', 'AUDIO', 'ARCHIVO'].includes(typeMessage)) {
            if (!req.file) {
                return res.status(400).json({
                    message: `Se requiere un archivo para mensajes de tipo ${typeMessage}`,
                });
            }

            try {
                const uploadResult = await uploadToCloudinary(req.file, {
                    folder: `synapse-code/messages/${roomId}`,
                    resource_type: 'auto',
                });
                messageContent = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                return res.status(500).json({
                    message: 'Error al subir el archivo',
                });
            }
        }

        // Validar contenido según tipo de mensaje
        if (typeMessage === 'TEXTO') {
            if (typeof messageContent !== 'string' || messageContent.length === 0) {
                return res.status(400).json({
                    message: 'Para mensajes de texto, el contenido debe ser una cadena no vacía',
                });
            }
            if (messageContent.length > 100) {
                return res.status(400).json({
                    message: 'El contenido no puede exceder 100 caracteres',
                });
            }
        }

        // Crear el mensaje (incluye numberChat e idChat si fue provisto)
        const messagePayload = {
            roomId,
            userId,
            typeMessage,
            content: messageContent,
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        };

        if (numberChat) {
            messagePayload.numberChat = numberChat;
        }

        if (room?.idChat) {
            messagePayload.idChat = room.idChat;
        }

        const message = await Message.create(messagePayload);

        // Si se creó con numberChat o idChat, añadir referencia al Chat.messages
        if (message.numberChat) {
            try {
                await Chat.findOneAndUpdate(
                    { numberChat: message.numberChat },
                    { $addToSet: { messages: message._id } },
                    { new: true }
                );
            } catch (err) {
                console.error('Error agregando mensaje al Chat.messages:', err);
                // no bloqueamos la creación del mensaje por un fallo aquí
            }
        } else if (message.idChat) {
            try {
                await Chat.findByIdAndUpdate(
                    message.idChat,
                    { $addToSet: { messages: message._id } },
                    { new: true }
                );
            } catch (err) {
                console.error('Error agregando mensaje al Chat.messages por idChat:', err);
                // no bloqueamos la creación del mensaje por un fallo aquí
            }
        }

        // Poblar referencias
        await message.populate('roomId');

        return res.status(201).json(message);
    } catch (error) {
        console.error('createMessage error:', error);
        return res.status(400).json({
            message: error.message || 'Error creando el mensaje',
        });
    }
};

/**
    Obtener todos los mensajes de una sala
    Ordenados por sentAt en orden ascendente
    Excluye mensajes eliminados (soft delete)
 */
export const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Validar que la sala exista
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        const skipAmount = (page - 1) * limit;

        const messages = await Message.find({
            roomId,
            messageStatus: { $ne: 'ELIMINADO' },
        })
            .sort({ sentAt: 1 })
            .skip(skipAmount)
            .limit(parseInt(limit))
            .lean();

        const enrichedMessages = enrichMessagesWithRoomContext(messages, room);
        const totalMessages = await Message.countDocuments({
            roomId,
            messageStatus: { $ne: 'ELIMINADO' },
        });

        return res.status(200).json({
            messages: enrichedMessages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('getRoomMessages error:', error);
        return res.status(500).json({
            message: error.message || 'Error obteniendo los mensajes',
        });
    }
};

// Obtener un mensaje especifico por id
export const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Mensaje no encontrado',
            });
        }

        if (message.messageStatus === 'ELIMINADO') {
            return res.status(404).json({
                message: 'Este mensaje ha sido eliminado',
            });
        }

        return res.status(200).json(message);
    } catch (error) {
        console.error('getMessageById error:', error);
        return res.status(400).json({
            message: error.message || 'Error obteniendo el mensaje',
        });
    }
};

/**
    Editar un mensaje existente
    Solo permite edición dentro de 30 minutos desde su creación
    Solo el autor del mensaje puede editarlo
 */
export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id || req.user?._id;

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

        // Verificar que el usuario sea el autor del mensaje
        if (message.userId !== userId) {
            return res.status(403).json({
                message: 'No tienes permiso para editar este mensaje',
            });
        }

        // Verificar que el mensaje no haya sido eliminado
        if (message.messageStatus === 'ELIMINADO') {
            return res.status(400).json({
                message: 'No se puede editar un mensaje eliminado',
            });
        }

        // Verificar que esté dentro de 30 minutos
        if (!message.canBeEdited()) {
            return res.status(400).json({
                message: 'Solo puedes editar mensajes dentro de 30 minutos después de su envío',
            });
        }

        // Validar contenido según tipo de mensaje
        if (message.typeMessage === 'TEXTO') {
            if (typeof content !== 'string' || content.length === 0) {
                return res.status(400).json({
                    message: 'Para mensajes de texto, el contenido debe ser una cadena no vacía',
                });
            }
            if (content.length > 5000) {
                return res.status(400).json({
                    message: 'El contenido no puede exceder 5000 caracteres',
                });
            }
        }

        // Actualizar el mensaje
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

/**
    Eliminar un mensaje (soft delete)
    Solo permite eliminación dentro de 30 minutos desde su creación
    Solo el autor del mensaje puede eliminarlo
    Cambia el estado a ELIMINADO en lugar de eliminar físicamente
 */
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id || req.user?._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Mensaje no encontrado',
            });
        }

        // Verificar que el usuario sea el autor del mensaje
        if (message.userId !== userId) {
            return res.status(403).json({
                message: 'No tienes permiso para eliminar este mensaje',
            });
        }

        // Verificar que no esté ya eliminado
        if (message.messageStatus === 'ELIMINADO') {
            return res.status(400).json({
                message: 'Este mensaje ya ha sido eliminado',
            });
        }

        // Verificar que esté dentro de 30 minutos
        if (!message.canBeDeleted()) {
            return res.status(400).json({
                message: 'Solo puedes eliminar mensajes dentro de 30 minutos después de su envío',
            });
        }

        // Soft delete: cambiar estado a ELIMINADO
        message.messageStatus = 'ELIMINADO';
        message.content = '[Mensaje eliminado]';
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

/**
    Obtener mensajes del sistema de una sala
 */
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

/**
    Crear un mensaje del sistema automáticamente
    Utiliza templates predefinidos
 */
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
