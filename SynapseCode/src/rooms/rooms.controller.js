'use strict'
import Room from './rooms.model.js';
import generateUniqueRoomCode from '../../helpers/rooms.helpers.js';

export const createRoom = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (!payload.roomCode) {
            payload.roomCode = await generateUniqueRoomCode();
        } else {
            payload.roomCode = String(payload.roomCode).toUpperCase();
        }

        const room = await Room.create(payload);
        return res.status(201).json(room);
    } catch (error) {
        console.error('createRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error creando la sala' });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOneAndUpdate(
            { roomCode: String(code).toUpperCase() },
            req.body,
            {
                returnDocument: 'after',
                runValidators: true,
            }
        );

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        return res.status(200).json(room);
    } catch (error) {
        console.error('updateRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error actualizando la sala por codigo' });
    }
};

export const getRoom = async (req, res) => {
    try {
        const rooms = await Room.find();
        return res.status(200).json(rooms);
    } catch (error) {
        console.error('getRoom error:', error);
        return res.status(500).json({ message: 'Error obteniendo salas' });
    }
};

export const getRoomByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        return res.status(200).json(room);
    } catch (error) {
        console.error('getRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo la sala por codigo' });
    }
};



export const deleteRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOneAndDelete({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        return res.status(200).json({ message: 'Sala eliminada correctamente' });
    } catch (error) {
        console.error('deleteRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error eliminando la sala por codigo' });
    }
};
