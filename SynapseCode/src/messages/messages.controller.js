'use strict'
import Message from './messages.model.js';
import { uploadToCloudinary } from '../../helpers/cloudinary-service.js';
import Room from '../rooms/rooms.model.js';

/**
 * Crear un nuevo mensaje
 * Valida que el tipo de mensaje sea coherente con el contenido
 * Si es IMAGEN, AUDIO o ARCHIVO, maneja la subida a Cloudinary
 */
export const createMessage = async (req, res) => {
    try {
        const { roomId, typeMessage, content } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!roomId || !typeMessage || (!content && !req.file)) {
            return res.status(400).json({
                message: 'roomId, typeMessage y content son obligatorios',
            });
        }

        // Validar que la sala exista
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
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

        // Crear el mensaje
        const message = await Message.create({
            roomId,
            userId,
            typeMessage,
            content: messageContent,
            messageStatus: 'ENVIADO',
            sentAt: new Date(),
        });

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
 * Obtener todos los mensajes de una sala
 * Ordenados por sentAt en orden ascendente
 * Excluye mensajes eliminados (soft delete)
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
            .limit(parseInt(limit));

        const totalMessages = await Message.countDocuments({
            roomId,
            messageStatus: { $ne: 'ELIMINADO' },
        });

        return res.status(200).json({
            messages,
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

/**
 * Obtener un mensaje específico por ID
 */
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
 * Editar un mensaje existente
 * Solo permite edición dentro de 30 minutos desde su creación
 * Solo el autor del mensaje puede editarlo
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
 * Eliminar un mensaje (soft delete)
 * Solo permite eliminación dentro de 30 minutos desde su creación
 * Solo el autor del mensaje puede eliminarlo
 * Cambia el estado a ELIMINADO en lugar de eliminar físicamente
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
 * Obtener mensajes del sistema de una sala
 */
export const getSystemMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: 'Sala no encontrada',
            });
        }

        const messages = await Message.find({
            roomId,
            typeMessage: 'SISTEMA',
            messageStatus: { $ne: 'ELIMINADO' },
        }).sort({ sentAt: -1 });

        return res.status(200).json(messages);
    } catch (error) {
        console.error('getSystemMessages error:', error);
        return res.status(500).json({
            message: error.message || 'Error obteniendo los mensajes del sistema',
        });
    }
};

/**
 * Crear un mensaje del sistema automáticamente
 * Utiliza templates predefinidos
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
