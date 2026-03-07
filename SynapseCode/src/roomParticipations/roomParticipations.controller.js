'use strict'
import RoomParticipation from './roomParticipations.model.js';
import Room from '../rooms/rooms.model.js';
import {
    getRoleDefaultPermissions,
    mergePermissions,
    calculateTotalMinutes,
} from '../../helpers/roomParticipations.helpers.js';

const mapParticipationRoleToSubRole = (role) =>
    String(role || '').toUpperCase() === 'ANFITRION' ? 'HOST_ROLE' : 'ASSISTANT_ROLE';

export const createRoomParticipation = async (req, res) => {
    try {
        const { roomName, roomCode } = req.body;
        const userId = req.user?.userId;
        const username = req.user?.username || null;

        if (!roomName || !roomCode) {
            return res.status(400).json({
                message: 'roomName y roomCode son obligatorios',
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: 'Token invalido: no contiene userId',
            });
        }

        const room = await Room.findOne({
            roomName: String(roomName).trim(),
            roomCode: String(roomCode).toUpperCase(),
        }).lean();

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada con roomName y roomCode' });
        }

        const payload = {
            roomId: room._id,
            userId,
            username,
            role: 'MIEMBRO',
            permissions: getRoleDefaultPermissions('MIEMBRO'),
        };

        const participation = await RoomParticipation.create(payload);

        await Room.findByIdAndUpdate(
            room._id,
            {
                $addToSet: {
                    connectedUsers: {
                        userId,
                        username: username || userId,
                        subRole: mapParticipationRoleToSubRole(payload.role),
                    },
                },
            },
            { runValidators: true }
        );
        return res.status(201).json(participation);
    } catch (error) {
        console.error('createRoomParticipation error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'El usuario ya tiene una participacion registrada en esta sala',
            });
        }

        return res.status(400).json({
            message: error.message || 'Error creando la participacion en sala',
        });
    }
};

export const updateRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Las fechas de entrada y salida son registro unico: ni anfitrion ni miembro pueden modificarlas
        delete updates.joinedAt;
        delete updates.leftAt;
        delete updates.totalMinutes;

        const existing = await RoomParticipation.findById(id);

        if (!existing) {
            return res.status(404).json({ message: 'Participacion no encontrada' });
        }

        const requesterUserId = req.user?.userId;
        const requesterParticipation = await RoomParticipation.findOne({
            roomId: existing.roomId,
            userId: requesterUserId,
        });

        if (!requesterParticipation || requesterParticipation.role !== 'ANFITRION') {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE (ANFITRION) puede editar participaciones',
            });
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

        // Validacion manual de anfitrion unico si cambia a ANFITRION
        if (newRole === 'ANFITRION' && existing.role !== 'ANFITRION') {
            const existingHost = await RoomParticipation.findOne({
                roomId: existing.roomId,
                role: 'ANFITRION',
                _id: { $ne: existing._id },
            });

            if (existingHost) {
                return res.status(400).json({
                    message: 'Ya existe un anfitrion para esta sala',
                });
            }
        }

        const updated = await RoomParticipation.findByIdAndUpdate(id, updates, {
            returnDocument: 'after',
            runValidators: true,
        });

        if (updated) {
            await Room.findOneAndUpdate(
                { _id: updated.roomId, 'connectedUsers.userId': updated.userId },
                {
                    $set: {
                        'connectedUsers.$.username': updated.username || existing.username || updated.userId,
                        'connectedUsers.$.subRole': mapParticipationRoleToSubRole(updated.role),
                    },
                }
            );
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error('updateRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error actualizando la participacion en sala',
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
        const requesterUserId = req.user?.userId;

        // Validacion: Los usuarios que pertenezcan a una sala pueden listar los usuarios
        const isMember = await RoomParticipation.exists({
            roomId,
            userId: requesterUserId,
            connectionStatus: { $ne: 'DESCONECTADO' } // O opcionalmente solo verificar que existen
        });

        if (!isMember) {
            return res.status(403).json({
                message: 'Debes pertenecer a la sala para ver sus participantes',
            });
        }

        const participations = await RoomParticipation.find({ roomId }).lean();
        const room = await Room.findById(roomId).lean();

        const usernamesByUserId = new Map(
            (room?.connectedUsers || []).map((u) => [u.userId, u.username])
        );

        const data = participations.map((p) => ({
            ...p,
            username: p.username || usernamesByUserId.get(p.userId) || null,
        }));

        return res.status(200).json(data);
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

// Marca la salida del usuario de la sala: registra leftAt, recalcula tiempo total y cambia estado de conexion
export const leaveRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;

        const participation = await RoomParticipation.findById(id);

        if (!participation) {
            return res.status(404).json({ message: 'Participacion no encontrada' });
        }

        if (participation.leftAt) {
            return res.status(400).json({
                message: 'La salida ya fue registrada para esta participacion',
            });
        }

        if (participation.role === 'ANFITRION') {
            const otherHosts = await RoomParticipation.countDocuments({
                roomId: participation.roomId,
                role: 'ANFITRION',
                connectionStatus: 'CONECTADO',
                _id: { $ne: participation._id }
            });

            if (otherHosts === 0) {
                return res.status(400).json({
                    message: 'Tienes que asignar otro HOST_ROLE antes de salir',
                });
            }
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

        await Room.findByIdAndUpdate(participation.roomId, {
            $pull: { connectedUsers: { userId: participation.userId } },
        });
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

        const participation = await RoomParticipation.findById(id);

        if (!participation) {
            return res.status(404).json({ message: 'Participacion no encontrada' });
        }

        const requesterUserId = req.user?.userId;
        const requesterParticipation = await RoomParticipation.findOne({
            roomId: participation.roomId,
            userId: requesterUserId,
        });

        if (!requesterParticipation || requesterParticipation.role !== 'ANFITRION') {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE (ANFITRION) de la sala puede eliminar usuarios',
            });
        }

        await RoomParticipation.findByIdAndDelete(id);

        await Room.findByIdAndUpdate(participation.roomId, {
            $pull: { connectedUsers: { userId: participation.userId } },
        });

        return res.status(200).json({ message: 'Participacion eliminada correctamente' });
    } catch (error) {
        console.error('deleteRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error eliminando la participacion en sala',
        });
    }
};
