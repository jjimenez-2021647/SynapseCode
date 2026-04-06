/* eslint-disable no-underscore-dangle, no-empty, @typescript-eslint/no-base-to-string */
'use strict'
import Room from './rooms.model.js';
import RoomParticipation from '../roomParticipations/roomParticipations.model.js';
import generateUniqueRoomCode from '../../helpers/rooms.helpers.js';
import { getRoleDefaultPermissions, calculateTotalMinutes } from '../../helpers/roomParticipations.helpers.js';
import { callService } from '../../helpers/service-communication.js';
import axios from 'axios';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

const isUserRole = (req) => String(req.user?.role || '').toUpperCase() === 'USER_ROLE';
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';
const isUserOrAdminRole = (req) => isUserRole(req) || isAdminRole(req);

export const createRoom = async (req, res) => {
    try {
        const payload = { ...req.body };
        const hostIdFromToken = getRequesterUserId(req);

        if (!isUserRole(req)) {
            return res.status(403).json({
                message: 'Solo un usuario con USER_ROLE puede crear salas',
            });
        }

        if (!hostIdFromToken) {
            return res.status(401).json({
                message: 'Token invalido: no contiene userId',
            });
        }

        payload.hostId = hostIdFromToken;
        payload.connectedUsers = [
            {
                userId: hostIdFromToken,
                username: req.user?.username || hostIdFromToken,
                subRole: 'HOST_ROLE',
            },
        ];

        if (payload.roomCode) {
            payload.roomCode = String(payload.roomCode).toUpperCase();
        } else {
            payload.roomCode = await generateUniqueRoomCode();
        }

        const room = await Room.create(payload);

        // Crear participación del host
        await RoomParticipation.create({
            roomId: room._id,
            userId: room.hostId,
            username: req.user?.username || null,
            role: 'ANFITRION',
            permissions: getRoleDefaultPermissions('ANFITRION'),
        });

        // Intentar crear chats en el servicio de Chat
        let chatsCreated = false;
        let createdChats = [];
        try {
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const roomIdString = room._id.toString();
            const chatsPayload = [
                {
                    roomId: roomIdString,
                    chatType: 'CHAT_SALA',
                    numberChat: room.numberChat,
                },
                {
                    roomId: roomIdString,
                    chatType: 'CHAT_IA',
                },
            ];

            const response = await axios.post(
                `${chatServiceUrl}/api/v1/chats/batch-create`,
                chatsPayload,
                {
                    headers: {
                        'x-token': req.token,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            if (response.status === 201 || response.status === 200) {
                chatsCreated = true;
                createdChats = (response.data?.chats || []).map(chat => ({
                    chatId: chat.chatId,
                    numberChat: chat.numberChat,
                    chatType: chat.chatType,
                }));
            }
        } catch (error) {
            console.error('ERROR crítico: No se pudieron crear los chats para la sala.');
            console.error(`Detalles: ${error.message}`);
            console.error(`URL: ${process.env.CHAT_SERVICE_URL || 'http://localhost:3008'}/api/v1/chats/batch-create`);
            
            // Eliminar la sala que se acaba de crear
            await Room.deleteOne({ _id: room._id });
            await RoomParticipation.deleteOne({ roomId: room._id, userId: room.hostId });
            
            return res.status(503).json({
                success: false,
                message: 'El servicio de chats no está disponible. No se pudo crear la sala.',
                error: 'CHAT_SERVICE_UNAVAILABLE',
                details: error.message
            });
        }

        const roomData = room.toObject ? room.toObject() : room;
        const result = {
            ...roomData,
            chats: createdChats,
            chatsCreated,
        };

        return res.status(201).json(result);
    } catch (error) {
        console.error('createRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error creando la sala' });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const codeParam = req.params.code || req.params.id;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        let room = await Room.findOne({ roomCode: String(codeParam).toUpperCase() });
        const mongoIdRegex = /^[a-f\d]{24}$/i;
        if (!room && mongoIdRegex.exec(String(codeParam || ''))) {
            room = await Room.findById(codeParam);
        }

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE de la sala puede editarla',
            });
        }

        const allowedFields = new Set([
            'roomName',
            'roomType',
            'roomLanguage',
            'maxUsers',
            'currentCode',
            'lastActivity',
            'roomStatus',
        ]);

        const updates = Object.fromEntries(
            Object.entries(req.body || {}).filter(([key]) => allowedFields.has(key))
        );

        if (!Object.keys(updates).length) {
            return res.status(400).json({
                message: 'No se proporcionaron campos validos para actualizar la sala',
            });
        }

        Object.assign(room, updates);
        const updatedRoom = await room.save();

        // Obtener chats asociados a la sala actualizada
        let chats = [];
        try {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const roomIdString = updatedRoom._id.toString();
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            const response = await axios.get(
                `${chatServiceUrl}/api/v1/chats?roomId=${roomIdString}`,

                {
                    headers: {
                        'x-token': req.token,
                        'Content-Type': 'application/json'
                    },
                    timeout: 3000
                }
            );

            const chatData = Array.isArray(response.data) ? response.data : response.data.data || [];
            chats = chatData.map(chat => ({
                chatId: chat.chatId,
                numberChat: chat.numberChat,
                chatType: chat.chatType,
            }));
        } catch (err) {
            console.warn(`No se pudieron obtener los chats de la sala ${updatedRoom._id}`);
            console.debug('Chat service error:', err?.message);
        }

        const roomData = updatedRoom.toObject ? updatedRoom.toObject() : updatedRoom;
        const result = {
            ...roomData,
            chats,
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error('updateRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error actualizando la sala' });
    }
};

export const getRoom = async (req, res) => {
    try {
        if (!isUserOrAdminRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE o ADMIN_ROLE puede listar y buscar salas',
            });
        }

        const { q, roomName, roomCode, roomType, roomStatus } = req.query;
        const filters = {};

        if (q) {
            const safeQuery = String(q).trim();
            if (safeQuery) {
                filters.$or = [
                    { roomName: { $regex: safeQuery, $options: 'i' } },
                    { roomCode: { $regex: safeQuery, $options: 'i' } },
                ];
            }
        }

        if (roomName) filters.roomName = { $regex: String(roomName).trim(), $options: 'i' };
        if (roomCode) filters.roomCode = String(roomCode).toUpperCase();
        if (roomType) filters.roomType = String(roomType).toUpperCase();
        if (roomStatus) filters.roomStatus = String(roomStatus).toUpperCase();

        const rooms = await Room.find(filters).lean();

        // Obtener chats asociados a cada sala
        const roomsWithChats = await Promise.all(
            rooms.map(async (room) => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const roomIdString = room._id.toString();
                    const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
                    const response = await axios.get(
                        `${chatServiceUrl}/api/v1/chats?roomId=${roomIdString}`,

                        {
                            headers: {
                                'x-token': req.token,
                                'Content-Type': 'application/json'
                            },
                            timeout: 3000
                        }
                    );

                    const chats = Array.isArray(response.data) ? response.data : response.data.data || [];
                    const roomChats = chats.map(chat => ({
                        chatId: chat.chatId,
                        numberChat: chat.numberChat,
                        chatType: chat.chatType,
                    }));

                    return {
                        ...room,
                        chats: roomChats,
                    };
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const roomIdStr = room._id.toString();
                    console.warn(`No se pudieron obtener los chats de la sala ${roomIdStr}`);
                    console.debug('Chat service error:', err?.message);
                    return {
                        ...room,
                        chats: [],
                    };
                }
            })
        );

        return res.status(200).json(roomsWithChats);
    } catch (error) {
        console.error('getRoom error:', error);
        return res.status(500).json({ message: 'Error obteniendo salas' });
    }
};

export const getRoomByCode = async (req, res) => {
    try {
        if (!isUserOrAdminRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE o ADMIN_ROLE puede acceder',
            });
        }

        const { code } = req.params;
        const room = await Room.findOne({ roomCode: String(code).toUpperCase() }).lean();

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        // Obtener chats asociados a la sala
        let chats = [];
        try {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const roomIdString = room._id.toString();
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            const response = await axios.get(
                `${chatServiceUrl}/api/v1/chats?roomId=${roomIdString}`,

                {
                    headers: {
                        'x-token': req.token,
                        'Content-Type': 'application/json'
                    },
                    timeout: 3000
                }
            );

            const chatData = Array.isArray(response.data) ? response.data : response.data.data || [];
            chats = chatData.map(chat => ({
                chatId: chat.chatId,
                numberChat: chat.numberChat,
                chatType: chat.chatType,
            }));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const roomIdStr = room._id.toString();
            console.warn(`No se pudieron obtener los chats de la sala ${roomIdStr}`);
            console.debug('Chat service error:', err?.message);
        }

        const roomWithChats = {
            ...room,
            chats,
        };

        return res.status(200).json(roomWithChats);
    } catch (error) {
        console.error('getRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo la sala' });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (!requesterIsAdmin && room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el dueno de la sala puede eliminarla',
            });
        }

        // Notificar al servicio de chats para que elimine los chats
        try {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const roomIdString = room._id.toString();
            const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3008';
            await axios.delete(
                `${chatServiceUrl}/api/v1/chats/room/${roomIdString}`,

                {
                    headers: { 'x-token': req.token },
                    timeout: 5000
                }
            );
        } catch (err) {
            console.debug('Chat deletion failed:', err?.message);
        }

        const participationsResult = await RoomParticipation.deleteMany({ roomId: room._id });
        await Room.deleteOne({ _id: room._id });

        return res.status(200).json({
            message: 'Sala eliminada correctamente',
            deleted: {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                roomId: room._id.toString(),
                roomCode: room.roomCode,
                roomParticipations: participationsResult.deletedCount || 0,
            },
        });
    } catch (error) {
        console.error('deleteRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error eliminando la sala' });
    }
};

export const deactivateRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (!requesterIsAdmin && room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el dueno de la sala puede finalizarla',
            });
        }

        room.roomStatus = 'CERRADA';
        room.connectedUsers = [];
        room.lastActivity = {
            date: new Date(),
            action: requesterIsAdmin ? 'Finalizada por moderación' : 'Finalizada por anfitrión',
            performedBy: {
                userId: requesterUserId,
                username: req.user?.username || null,
            },
        };
        await room.save();

        const activeParticipations = await RoomParticipation.find({
            roomId: room._id,
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

        return res.status(200).json({
            message: 'Sala finalizada correctamente',
            roomId: room._id,
            roomStatus: room.roomStatus,
        });
    } catch (error) {
        console.error('deactivateRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error desactivando la sala' });
    }
};

export const getRoomCreatorsAudit = async (_req, res) => {
    try {
        const rooms = await Room.find({})
            .select('roomCode roomName hostId createdAt roomStatus roomType roomLanguage')
            .sort({ createdAt: -1 })
            .lean();

        const data = rooms.map((room) => ({
            roomId: room._id,
            roomCode: room.roomCode,
            roomName: room.roomName,
            createdByUserId: room.hostId,
            createdAt: room.createdAt || null,
            roomStatus: room.roomStatus,
            roomType: room.roomType,
            roomLanguage: room.roomLanguage || null,
        }));

        return res.status(200).json({
            success: true,
            message: 'Auditoria de creacion de salas obtenida exitosamente',
            count: data.length,
            data,
        });
    } catch (error) {
        console.error('getRoomCreatorsAudit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo auditoria de creadores de salas',
            error: 'GET_ROOM_CREATORS_AUDIT_ERROR',
        });
    }
};

export const getRoomFileChanges = async (req, res) => {
    try {
        const { code: roomCode, fileId } = req.params;
        const requesterUserId = getRequesterUserId(req);

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido' });
        }

        if (!isUserOrAdminRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE o ADMIN_ROLE puede acceder',
            });
        }

        // Obtener sala por código
        const room = await Room.findOne({ roomCode: String(roomCode).toUpperCase() });
        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        // Importar File y CodeSession desde servicios si es necesario
        // Para esta versión de microservicios, obtenemos la información del servicio correcto
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const roomIdString = room._id.toString();
        const saFile = await callService(
            'room',
            'GET',
            `/api/v1/files/${fileId}`,
            null,
            req.token
        );

        if (!saFile || String(saFile.roomId) !== roomIdString) {
            return res.status(404).json({ message: 'Archivo no encontrado en esta sala' });
        }

        // Verificar que el usuario pertenece a la sala (excepto admins)
        if (!isAdminRole(req)) {
            const participation = await RoomParticipation.findOne({
                roomId: room._id,
                userId: requesterUserId,
            });
            if (!participation) {
                return res.status(403).json({
                    message: 'Debes pertenecer a la sala para ver los cambios',
                });
            }
        }

        // Obtener cambios desde el servicio de CodeSessions
        const sessionChanges = await callService(
            'codeSessions',
            'GET',
            `/api/v1/code-sessions/file/${fileId}/latest`,
            null,
            req.token
        );

        // Obtener últimas code sessions del archivo (máximo 20)
        const codeSessionsData = Array.isArray(sessionChanges) 
            ? sessionChanges 
            : (sessionChanges?.data || []);

        const limitedSessions = codeSessionsData.slice(0, 20);

        // Obtener información de los usuarios que guardaron
        const userIds = [...new Set(limitedSessions.map((cs) => cs.savedByUserId))];
        const participants = await RoomParticipation.find({
            roomId: room._id,
            userId: { $in: userIds },
        }).select('userId username').lean();

        const usernamesMap = new Map(participants.map((p) => [String(p.userId), p.username]));

        // Enriquecer las sesiones
        const enrichedSessions = limitedSessions.map((session) => {
            let codePreview = '';
            if (session.code) {
                const isLong = session.code.length > 100;
                const preview = session.code.substring(0, 100);
                codePreview = isLong ? preview + '...' : preview;
            }

            return {
                sessionId: session._id,
                version: session.version,
                language: session.language,
                saveType: session.saveType,
                wasExecuted: session.wasExecuted || false,
                savedByUserId: session.savedByUserId,
                savedByUsername: usernamesMap.get(String(session.savedByUserId)) || session.savedByUserId,
                savedAt: session.savedAt,
                codePreview,
                codeLength: session.code?.length || 0,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                roomCode: room.roomCode,
                roomName: room.roomName,
                fileName: saFile.fileName,
                fileExtension: saFile.fileExtension,
                language: saFile.language,
                changes: enrichedSessions,
                totalChanges: enrichedSessions.length,
            },
        });
    } catch (error) {
        console.error('getRoomFileChanges error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo cambios del archivo' });
    }
};