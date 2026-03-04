'use strict'
import RoomParticipation from './roomParticipations.model.js';
import Room from '../rooms/rooms.model.js';
import {
    getRoleDefaultPermissions,
    mergePermissions,
    calculateTotalMinutes,
    mapSubRoleToParticipationRole,
} from '../../helpers/roomParticipations.helpers.js';

export const createRoomParticipation = async (req, res) => {
    try {
        const payload = { ...req.body };

        // Si no se envía role explícitamente, intentamos inferirlo desde req.subRole (HOST_ROLE / ASSISTANT_ROLE)
        if (!payload.role && req.subRole) {
            const mappedRole = mapSubRoleToParticipationRole(req.subRole);
            if (mappedRole) {
                payload.role = mappedRole;
            }
        }

        if (!payload.roomId || !payload.userId || !payload.role) {
            return res.status(400).json({
                message: 'roomId, userId y role son obligatorios',
            });
        }

        payload.role = String(payload.role).toUpperCase();

        // Solo el creador de la sala (hostId) puede tener rol ANFITRION
        if (payload.role === 'ANFITRION') {
            const room = await Room.findById(payload.roomId).lean();
            if (!room) {
                return res.status(404).json({ message: 'Sala no encontrada' });
            }
            if (room.hostId !== payload.userId) {
                return res.status(403).json({
                    message: 'Solo el creador de la sala puede ser anfitrión (ANFITRION)',
                });
            }
        }

        if (!payload.permissions) {
            payload.permissions = getRoleDefaultPermissions(payload.role);
        } else {
            payload.permissions = mergePermissions(payload.role, payload.permissions);
        }

        if (payload.leftAt) {
            const joined = payload.joinedAt ? new Date(payload.joinedAt) : new Date();
            if (new Date(payload.leftAt).getTime() <= joined.getTime()) {
                return res.status(400).json({
                    message: 'La fecha de salida debe ser posterior a la fecha de ingreso',
                });
            }
        }

        const participation = await RoomParticipation.create(payload);
        return res.status(201).json(participation);
    } catch (error) {
        console.error('createRoomParticipation error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'El usuario ya tiene una participación registrada en esta sala',
            });
        }

        return res.status(400).json({
            message: error.message || 'Error creando la participación en sala',
        });
    }
};

export const updateRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Las fechas de entrada y salida son registro único: ni anfitrión ni miembro pueden modificarlas
        delete updates.joinedAt;
        delete updates.leftAt;
        delete updates.totalMinutes;

        const existing = await RoomParticipation.findById(id);

        if (!existing) {
            return res.status(404).json({ message: 'Participación no encontrada' });
        }

        let newRole = existing.role;

        if (updates.role) {
            newRole = String(updates.role).toUpperCase();
            updates.role = newRole;
        }

        if (updates.permissions || updates.role) {
            const partialPermissions = updates.permissions || {};
            updates.permissions = mergePermissions(newRole, partialPermissions);
        }

        // Validación manual de anfitrión único si cambia a ANFITRION
        if (newRole === 'ANFITRION' && existing.role !== 'ANFITRION') {
            const existingHost = await RoomParticipation.findOne({
                roomId: existing.roomId,
                role: 'ANFITRION',
                _id: { $ne: existing._id },
            });

            if (existingHost) {
                return res.status(400).json({
                    message: 'Ya existe un anfitrión para esta sala',
                });
            }
        }

        const updated = await RoomParticipation.findByIdAndUpdate(id, updates, {
            returnDocument: 'after',
            runValidators: true,
        });

        return res.status(200).json(updated);
    } catch (error) {
        console.error('updateRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error actualizando la participación en sala',
        });
    }
};

export const getRoomParticipations = async (_req, res) => {
    try {
        const participations = await RoomParticipation.find();
        return res.status(200).json(participations);
    } catch (error) {
        console.error('getRoomParticipations error:', error);
        return res.status(500).json({
            message: 'Error obteniendo participaciones de sala',
        });
    }
};

export const getRoomParticipationsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const participations = await RoomParticipation.find({ roomId });
        return res.status(200).json(participations);
    } catch (error) {
        console.error('getRoomParticipationsByRoom error:', error);
        return res.status(400).json({
            message: error.message || 'Error obteniendo participaciones por sala',
        });
    }
};

export const getRoomParticipationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const participations = await RoomParticipation.find({ userId });
        return res.status(200).json(participations);
    } catch (error) {
        console.error('getRoomParticipationsByUser error:', error);
        return res.status(400).json({
            message: error.message || 'Error obteniendo participaciones por usuario',
        });
    }
};

// Marca la salida del usuario de la sala: registra leftAt, recalcula tiempo total y cambia estado de conexión
export const leaveRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;

        const participation = await RoomParticipation.findById(id);

        if (!participation) {
            return res.status(404).json({ message: 'Participación no encontrada' });
        }

        if (participation.leftAt) {
            return res.status(400).json({
                message: 'La salida ya fue registrada para esta participación',
            });
        }

        const now = new Date();
        participation.leftAt = now;
        participation.totalMinutes = calculateTotalMinutes(
            participation.joinedAt,
            now,
            participation.totalMinutes
        );
        participation.connectionStatus = 'DESCONECTADO';

        await participation.save();

        return res.status(200).json(participation);
    } catch (error) {
        console.error('leaveRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error registrando la salida de la sala',
        });
    }
};

export const deleteRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;

        const participation = await RoomParticipation.findByIdAndDelete(id);

        if (!participation) {
            return res.status(404).json({ message: 'Participación no encontrada' });
        }

        return res.status(200).json({ message: 'Participación eliminada correctamente' });
    } catch (error) {
        console.error('deleteRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error eliminando la participación en sala',
        });
    }
};

