'use strict'
import RoomParticipation from './roomParticipations.model.js';
import Room from '../rooms/rooms.model.js';
import Message from '../messages/messages.model.js';
import {
    getRoleDefaultPermissions,
    mergePermissions,
    calculateTotalMinutes,
} from '../../helpers/roomParticipations.helpers.js';

const mapParticipationRoleToSubRole = (role) =>
    String(role || '').toUpperCase() === 'ANFITRION' ? 'HOST_ROLE' : 'ASSISTANT_ROLE';
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';

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

        // Validación: Solo se puede unir a salas activas
        if (room.roomStatus !== 'ACTIVA') {
            return res.status(403).json({ message: 'No se puede unir a la sala porque no está activa' });
        }

        // Validación: Si la sala es privada, requiere contraseña
        if (room.roomType === 'PRIVADA') {
            if (!req.body.passwordRoom) {
                return res.status(400).json({ message: 'Contraseña requerida para unirse a salas privadas' });
            }
            if (req.body.passwordRoom !== room.passwordRoom) {
                return res.status(403).json({ message: 'Contraseña incorrecta' });
            }
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

        // Mensaje de sistema automatico al unirse a la sala
        try {
            const displayName = username || userId;
            await Message.create({
                roomId: room._id,
                userId: 'SYSTEM',
                typeMessage: 'SISTEMA',
                content: `${displayName} se unio a la sala`,
                messageStatus: 'ENVIADO',
                sentAt: new Date(),
                numberChat: room.numberChat || null,
                modifyCodeSessions: 'NO_MODIFICAR',
            });
        } catch (systemMessageError) {
            console.error('createRoomParticipation system message error:', systemMessageError);
            // no bloquea la union a la sala
        }

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

        // Permitir múltiples anfitriones: removida validación de anfitrión único

        if (newRole === 'ANFITRION' && existing.role !== 'ANFITRION') {
            if (existing.connectionStatus !== 'CONECTADO') {
                return res.status(400).json({
                    message: 'Solo usuarios conectados pueden ser asignados como anfitriones',
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

export const getRoomParticipations = async (req, res) => {
    try {
        if (!isAdminRole(req)) {
            return res.status(403).json({
                message: 'Solo ADMIN_ROLE puede listar todas las participaciones',
            });
        }

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
        const requesterIsAdmin = isAdminRole(req);

        // Validacion: Los usuarios que pertenezcan a una sala pueden listar los usuarios
        if (!requesterIsAdmin) {
            const isMember = await RoomParticipation.exists({
                roomId,
                userId: requesterUserId,
                connectionStatus: { $ne: 'DESCONECTADO' },
            });

            if (!isMember) {
                return res.status(403).json({
                    message: 'Debes pertenecer a la sala para ver sus participantes',
                });
            }
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

        let newHostInfo = null;

        if (participation.role === 'ANFITRION') {
            const anotherMember = await RoomParticipation.findOne({
                roomId: participation.roomId,
                role: 'MIEMBRO',
                connectionStatus: 'CONECTADO',
                _id: { $ne: participation._id },
            });

            if (anotherMember) {
                // findByIdAndUpdate NO dispara pre('save'), evita el error de anfitrión único
                await RoomParticipation.findByIdAndUpdate(
                    anotherMember._id,
                    { $set: { role: 'ANFITRION', permissions: getRoleDefaultPermissions('ANFITRION') } },
                    { runValidators: false }
                );

                await Room.findOneAndUpdate(
                    { _id: participation.roomId, 'connectedUsers.userId': anotherMember.userId },
                    { $set: { 'connectedUsers.$.subRole': 'HOST_ROLE' } }
                );

                newHostInfo = {
                    userId: anotherMember.userId,
                    username: anotherMember.username || anotherMember.userId,
                };
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

        // Mensaje de sistema automático al salir de la sala
        try {
            const displayName = participation.username || participation.userId;
            await Message.create({
                roomId: participation.roomId,
                userId: 'SYSTEM',
                typeMessage: 'SISTEMA',
                content: `${displayName} abandonó la sala`,
                messageStatus: 'ENVIADO',
                sentAt: new Date(),
                numberChat: null,
                modifyCodeSessions: 'NO_MODIFICAR',
            });
        } catch (systemMessageError) {
            console.error('leaveRoomParticipation system message error:', systemMessageError);
        }

        // Verificar si quedan usuarios conectados
        const remainingConnected = await RoomParticipation.countDocuments({
            roomId: participation.roomId,
            connectionStatus: 'CONECTADO',
        });

        if (remainingConnected === 0) {
            // Cerrar la sala automáticamente
            const room = await Room.findById(participation.roomId);
            if (room && room.roomStatus === 'ACTIVA') {
                room.roomStatus = 'CERRADA';
                room.connectedUsers = [];
                room.lastActivity = {
                    date: new Date(),
                    action: 'Sala cerrada automáticamente al salir el último usuario conectado',
                    performedBy: {
                        userId: participation.userId,
                        username: participation.username || null,
                    },
                };
                await room.save();

                // Desconectar todas las participaciones activas restantes (aunque no debería haber)
                const activeParticipations = await RoomParticipation.find({
                    roomId: participation.roomId,
                    connectionStatus: 'CONECTADO',
                });

                const now = new Date();
                const updatePromises = activeParticipations.map(async (part) => {
                    part.leftAt = now;
                    part.connectionStatus = 'DESCONECTADO';
                    part.totalMinutes = calculateTotalMinutes(part.joinedAt, now, part.totalMinutes);
                    return part.save();
                });

                await Promise.all(updatePromises);
            }
        }

        return res.status(200).json({
            participation,
            newHost: newHostInfo,
        });
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
        const requesterIsAdmin = isAdminRole(req);

        if (!requesterIsAdmin) {
            const requesterParticipation = await RoomParticipation.findOne({
                roomId: participation.roomId,
                userId: requesterUserId,
            });

            if (!requesterParticipation || requesterParticipation.role !== 'ANFITRION') {
                return res.status(403).json({
                    message: 'Solo el HOST_ROLE (ANFITRION) de la sala puede eliminar usuarios',
                });
            }
        }

        let newHostInfo = null;

        if (participation.role === 'ANFITRION') {
            // Asignar automáticamente a un miembro conectado como nuevo anfitrión
            const anotherMember = await RoomParticipation.findOne({
                roomId: participation.roomId,
                role: 'MIEMBRO',
                connectionStatus: 'CONECTADO',
                _id: { $ne: participation._id },
            });

            if (anotherMember) {
                await RoomParticipation.findByIdAndUpdate(
                    anotherMember._id,
                    { $set: { role: 'ANFITRION', permissions: getRoleDefaultPermissions('ANFITRION') } },
                    { runValidators: false }
                );

                await Room.findOneAndUpdate(
                    { _id: participation.roomId, 'connectedUsers.userId': anotherMember.userId },
                    { $set: { 'connectedUsers.$.subRole': 'HOST_ROLE' } }
                );

                newHostInfo = {
                    userId: anotherMember.userId,
                    username: anotherMember.username || anotherMember.userId,
                };
            }
        }

        await RoomParticipation.findByIdAndDelete(id);

        await Room.findByIdAndUpdate(participation.roomId, {
            $pull: { connectedUsers: { userId: participation.userId } },
        });

        // Mensaje de sistema automático cuando un usuario es expulsado
        try {
            const displayName = participation.username || participation.userId;
            await Message.create({
                roomId: participation.roomId,
                userId: 'SYSTEM',
                typeMessage: 'SISTEMA',
                content: `${displayName} fue expulsado de la sala`,
                messageStatus: 'ENVIADO',
                sentAt: new Date(),
                numberChat: null,
                modifyCodeSessions: 'NO_MODIFICAR',
            });
        } catch (systemMessageError) {
            console.error('deleteRoomParticipation system message error:', systemMessageError);
        }

        return res.status(200).json({
            message: 'Participacion eliminada correctamente',
            newHost: newHostInfo,
        });
    } catch (error) {
        console.error('deleteRoomParticipation error:', error);
        return res.status(400).json({
            message: error.message || 'Error eliminando la participacion en sala',
        });
    }
};