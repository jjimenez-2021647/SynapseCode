'use strict'
import Chat from './chats.model.js';
import Message from '../messages/messages.model.js';

// Crear un chat nuevo
export const createChat = async (req, res) => {
    try {
        //permite que el usuario ingrese un numero de chat personalizado
        // y si no quiere se crea uno por default
        const { numberChat: providedNumber } = req.body;

        //creamos el chat con el numero ya generado 
        const chat = await Chat.create({ numberChat: providedNumber });

        //retornamos nuestro chat creado con el numero de chat generado o creado por nosotros
        return res.status(201).json(chat);
    } catch (error) {
        console.error('createChat error:', error);
        return res.status(400).json({ message: error.message || 'Error creando chat' });
    }
};

// Obtener un chat por numberChat
export const getChatByNumber = async (req, res) => {
    try {
        const { numberChat } = req.params;

        const chat = await Chat.findOne({ numberChat }).lean();

        if (!chat) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        return res.status(200).json(chat);
    } catch (error) {
        console.error('getChatByNumber error:', error);
        return res.status(500).json({ message: error.message || 'Error obteniendo chat' });
    }
};

// Obtener mensajes asociados a un numberChat
export const getChatMessages = async (req, res) => {
    try {
        //obtenemos los valores que vienen de la ruta
        const { numberChat } = req.params;

        // Comprobar que el chat exista en la db
        const chat = await Chat.findOne({ numberChat }).lean();
        // si el chat no existe mandamos un 404
        if (!chat) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        // Buscamos los mensajes asociados a este numberchat si y solo si su estado no es eliminado
        const messages = await Message.find({ numberChat, messageStatus: { $ne: 'ELIMINADO' } })
            .sort({ sentAt: 1 })
            .lean();

        // si no hay ensajes no devuelve nada
        return res.status(200).json({ messages: messages || [] });
    } catch (error) {
        // si hay un error lo mostramos por consola y mandamos un 500 con el mensaje del error
        console.error('getChatMessages error:', error);
        return res.status(500).json({ message: error.message || 'Error obteniendo mensajes del chat' });
    }
};

// Agregar referencia de mensaje al chat 
export const addMessageToChat = async (numberChat, messageId) => {
    try {
        //buscamos el chat pos su numberchat en la db
        // si llega a existir le agregamos los ids de los mensajes que le pertenece
        const chat = await Chat.findOne({ numberChat });
        // si el chat no existe entonces devolvemos null porque no va a tener nada 
        if (!chat) return null;
        // si el chat existe entonces le ponemos el mendaje Id para que lo muestre
        chat.messages.push(messageId);
        //guardamos el chat con sus nuevos mensajes ingresados
        await chat.save();
        //retornamos el chat con los datos ya guardados
        return chat;
    } catch (error) {
        console.error('addMessageToChat error:', error);
        return null;
    }
};

