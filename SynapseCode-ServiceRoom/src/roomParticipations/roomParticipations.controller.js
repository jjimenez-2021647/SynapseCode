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
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';

/**
 * Crear participación - usuario se une a una sala
 */
export const createRoomParticipation = async (req, res) => {
    try {
        const { roomName, roomCode } = req.body;
        const userId = req.user?.userId;
        const username = req.user?.username || null;

        if (!roomName || !roomCode) {
            return res.status(400).json({
                success: false,
                message: 'roomName y roomCode son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido: no contiene userId',
                error: 'UNAUTHORIZED',
            });
        }

        const room = await Room.findOne({
            roomName: String(roomName).trim(),
            roomCode: String(roomCode).toUpperCase(),
        }).lean();

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada con roomName y roomCode',
                error: 'ROOM_NOT_FOUND',
            });
        }

        // Validación: Solo se puede unir a salas activas
        if (room.roomStatus !== 'ACTIVA') {
            return res.status(403).json({
                success: false,
                message: 'No se puede unir a la sala porque no está activa',
                error: 'ROOM_NOT_ACTIVE',
            });
        }

        // Validación: Si la sala es privada, requiere contraseña
        if (room.roomType === 'PRIVADA') {
            if (!req.body.passwordRoom) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña requerida para unirse a salas privadas',
                    error: 'PASSWORD_REQUIRED',
                });
            }
            if (req.body.passwordRoom !== room.passwordRoom) {
                return res.status(403).json({
                    success: false,
                    message: 'Contraseña incorrecta',
                    error: 'INVALID_PASSWORD',
                });
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

        // Mensaje de sistema automático al unirse a la sala
        // TODO: Llamar a ServiceChat API para crear mensaje de sistema
        try {
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            const displayName = username || userId;
            // await axios.post(`${chatServiceUrl}/api/v1/messages/system`, { ... })
            console.log(`[Room] Sistema: ${displayName} se unió a la sala`);
        } catch (systemMessageError) {
            console.warn('createRoomParticipation system message error:', systemMessageError.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Participación creada exitosamente',
            data: participation,
        });
    } catch (error) {
        console.error('createRoomParticipation error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya tiene una participación registrada en esta sala',
                error: 'DUPLICATE_PARTICIPATION',
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando la participación en sala',
            error: 'CREATE_PARTICIPATION_ERROR',
        });
    }
};

/**
 * Actualizar participación - cambiar rol, permisos, etc (solo ANFITRION)
 */
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
            return res.status(404).json({
                success: false,
                message: 'Participación no encontrada',
                error: 'PARTICIPATION_NOT_FOUND',
            });
        }

        const requesterUserId = req.user?.userId;
        const requesterParticipation = await RoomParticipation.findOne({
            roomId: existing.roomId,
            userId: requesterUserId,
        });

        if (!requesterParticipation || requesterParticipation.role !== 'ANFITRION') {
            return res.status(403).json({
                success: false,
                message: 'Solo el HOST_ROLE (ANFITRION) puede editar participaciones',
                error: 'FORBIDDEN',
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

        if (newRole === 'ANFITRION' && existing.role !== 'ANFITRION') {
            if (existing.connectionStatus !== 'CONECTADO') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo usuarios conectados pueden ser asignados como anfitriones',
                    error: 'USER_NOT_CONNECTED',
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

        return res.status(200).json({
            success: true,
            message: 'Participación actualizada exitosamente',
            data: updated,
        });
    } catch (error) {
        console.error('updateRoomParticipation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando la participación en sala',
            error: 'UPDATE_PARTICIPATION_ERROR',
        });
    }
};

/**
 * Obtener todas las participaciones (solo ADMIN)
 */
export const getRoomParticipations = async (req, res) => {
    try {
        if (!isAdminRole(req)) {
            return res.status(403).json({
                success: false,
                message: 'Solo ADMIN_ROLE puede listar todas las participaciones',
                error: 'FORBIDDEN',
            });
        }

        const participations = await RoomParticipation.find().lean();
        return res.status(200).json({
            success: true,
            count: participations.length,
            data: participations,
        });
    } catch (error) {
        console.error('getRoomParticipations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo participaciones de sala',
            error: 'GET_PARTICIPATIONS_ERROR',
        });
    }
};

/**
 * Obtener participaciones de una sala
 */
export const getRoomParticipationsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const requesterUserId = req.user?.userId;
        const requesterIsAdmin = isAdminRole(req);

        // Validación: Los usuarios que pertenezcan a una sala pueden listar los usuarios
        if (!requesterIsAdmin) {
            const isMember = await RoomParticipation.exists({
                roomId,
                userId: requesterUserId,
                connectionStatus: { $ne: 'DESCONECTADO' },
            });

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'Debes pertenecer a la sala para ver sus participantes',
                    error: 'FORBIDDEN',
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

        return res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        console.error('getRoomParticipationsByRoom error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo participaciones por sala',
            error: 'GET_PARTICIPATIONS_BY_ROOM_ERROR',
        });
    }
};

/**
 * Obtener participaciones de un usuario
 */
export const getRoomParticipationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId es obligatorio',
                error: 'MISSING_USER_ID',
            });
        }

        const participations = await RoomParticipation.find({ userId }).lean();

        return res.status(200).json({
            success: true,
            count: participations.length,
            data: participations,
        });
    } catch (error) {
        console.error('getRoomParticipationsByUser error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo participaciones por usuario',
            error: 'GET_PARTICIPATIONS_BY_USER_ERROR',
        });
    }
};

/**
 * Actualizar estado de participación (conexión)
 */
export const updateParticipationStatus = async (req, res) => {
    try {
        const { participationId } = req.params;
        const { connectionStatus, leftAt } = req.body;

        const participation = await RoomParticipation.findByIdAndUpdate(
            participationId,
            { connectionStatus, leftAt },
            { new: true }
        );

        if (!participation) {
            return res.status(404).json({
                success: false,
                message: 'Participación no encontrada',
                error: 'PARTICIPATION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado de participación actualizado',
            data: participation,
        });
    } catch (error) {
        console.error('updateParticipationStatus error:', error);
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'UPDATE_STATUS_ERROR',
        });
    }
};

/**
 * Abandonar sala - registra salida, recalcula tiempo, cambia estado de conexión
 */
export const leaveRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;

        const participation = await RoomParticipation.findById(id);

        if (!participation) {
            return res.status(404).json({
                success: false,
                message: 'Participación no encontrada',
                error: 'PARTICIPATION_NOT_FOUND',
            });
        }

        if (participation.leftAt) {
            return res.status(400).json({
                success: false,
                message: 'La salida ya fue registrada para esta participación',
                error: 'ALREADY_LEFT',
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
        // TODO: Llamar a ServiceChat API para crear mensaje de sistema
        try {
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            const displayName = participation.username || participation.userId;
            // await axios.post(`${chatServiceUrl}/api/v1/messages/system`, { ... })
            console.log(`[Room] Sistema: ${displayName} abandonó la sala`);
        } catch (systemMessageError) {
            console.warn('leaveRoomParticipation system message error:', systemMessageError.message);
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

                const activeParticipations = await RoomParticipation.find({
                    roomId: participation.roomId,
                    connectionStatus: 'CONECTADO',
                });

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
            success: true,
            message: 'Participación actualizada - usuario abandonó la sala',
            data: {
                participation,
                newHost: newHostInfo,
            },
        });
    } catch (error) {
        console.error('leaveRoomParticipation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error registrando la salida de la sala',
            error: 'LEAVE_ROOM_ERROR',
        });
    }
};

/**
 * Eliminar participación - expulsar usuario de sala (solo ANFITRION)
 */
export const deleteRoomParticipation = async (req, res) => {
    try {
        const { id } = req.params;

        const participation = await RoomParticipation.findById(id);

        if (!participation) {
            return res.status(404).json({
                success: false,
                message: 'Participación no encontrada',
                error: 'PARTICIPATION_NOT_FOUND',
            });
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
                    success: false,
                    message: 'Solo el HOST_ROLE (ANFITRION) de la sala puede eliminar usuarios',
                    error: 'FORBIDDEN',
                });
            }
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
        // TODO: Llamar a ServiceChat API para crear mensaje de sistema
        try {
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            const displayName = participation.username || participation.userId;
            // await axios.post(`${chatServiceUrl}/api/v1/messages/system`, { ... })
            console.log(`[Room] Sistema: ${displayName} fue expulsado de la sala`);
        } catch (systemMessageError) {
            console.warn('deleteRoomParticipation system message error:', systemMessageError.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Participación eliminada correctamente',
            data: {
                participation,
                newHost: newHostInfo,
            },
        });
    } catch (error) {
        console.error('deleteRoomParticipation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la participación',
            error: 'DELETE_PARTICIPATION_ERROR',
        });
    }
};