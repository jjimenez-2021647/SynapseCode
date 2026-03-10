'use strict'
import Room from './rooms.model.js';
import Chat from '../chats/chats.model.js';
import Message from '../messages/messages.model.js';
import File from '../files/files.model.js';
import CodeSession from '../codeSessions/codeSessions.model.js';
import CodeExecution from '../codeExecutions/codeExecutions.model.js';
import RoomParticipation from '../roomParticipations/roomParticipations.model.js';
import generateUniqueRoomCode from '../../helpers/rooms.helpers.js';
import { getRoleDefaultPermissions, calculateTotalMinutes } from '../../helpers/roomParticipations.helpers.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

const isUserRole = (req) => String(req.user?.role || '').toUpperCase() === 'USER_ROLE';
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';
const isUserOrAdminRole = (req) => isUserRole(req) || isAdminRole(req);

const attachChatsToRoom = (room, chats) => {
    const roomData = typeof room.toObject === 'function' ? room.toObject() : room;
    const roomChats = (chats || []).map((chat) => ({
        chatId: chat.chatId,
        numberChat: chat.numberChat,
        chatType: chat.chatType,
    }));

    return {
        ...roomData,
        chats: roomChats,
    };
};

const buildMessagesForRoom = async (room, roomChats) => {
    const chatNumbers = (roomChats || []).map((chat) => chat.numberChat).filter(Boolean);
    if (!chatNumbers.length && room?.numberChat) {
        chatNumbers.push(room.numberChat);
    }
    const messages = chatNumbers.length
        ? await Message.find({
            numberChat: { $in: chatNumbers },
            messageStatus: { $ne: 'ELIMINADO' },
        }).sort({ sentAt: 1 }).lean()
        : [];

    const usernamesByUserId = new Map((room.connectedUsers || []).map((u) => [u.userId, u.username]));

    return (messages || []).map((m) => {
        const base = {
            numberChat: m.numberChat,
            chatId: m.chatId || null,
            userId: m.userId,
            userName: m.userId === 'SYSTEM' ? 'SYSTEM' : usernamesByUserId.get(m.userId) || null,
            content: m.content,
            sentAt: m.sentAt,
            modifyCodeSessions: m.modifyCodeSessions || 'NO_MODIFICAR',
        };
        if (m.isEdited) base.isEdited = true;
        return base;
    });
};

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

        if (!payload.roomCode) {
            payload.roomCode = await generateUniqueRoomCode();
        } else {
            payload.roomCode = String(payload.roomCode).toUpperCase();
        }

        const room = await Room.create(payload);

        await RoomParticipation.create({
            roomId: room._id,
            userId: room.hostId,
            username: req.user?.username || null,
            role: 'ANFITRION',
            permissions: getRoleDefaultPermissions('ANFITRION'),
        });

        const salaChat = await Chat.create({
            roomId: room._id,
            chatType: 'CHAT_SALA',
            numberChat: room.numberChat,
        });

        const iaChat = await Chat.create({
            roomId: room._id,
            chatType: 'CHAT_IA',
        });

        return res.status(201).json(attachChatsToRoom(room, [salaChat, iaChat]));
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
        if (!room && String(codeParam || '').match(/^[a-f\d]{24}$/i)) {
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
        await room.save();

        return res.status(200).json(room);
    } catch (error) {
        console.error('updateRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error actualizando la sala por codigo' });
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
        const roomIds = rooms.map((room) => room._id);
        const chats = roomIds.length ? await Chat.find({ roomId: { $in: roomIds } }).lean() : [];

        const chatsByRoomId = new Map();
        for (const chat of chats) {
            const key = String(chat.roomId);
            const list = chatsByRoomId.get(key) || [];
            list.push(chat);
            chatsByRoomId.set(key, list);
        }

        const roomsWithMessages = await Promise.all(
            rooms.map(async (room) => {
                const roomChats = chatsByRoomId.get(String(room._id)) || [];
                const mapped = await buildMessagesForRoom(room, roomChats);
                return attachChatsToRoom({ ...room, messages: mapped }, roomChats);
            })
        );

        return res.status(200).json(roomsWithMessages);
    } catch (error) {
        console.error('getRoom error:', error);
        return res.status(500).json({ message: 'Error obteniendo salas' });
    }
};

export const getRoomByCode = async (req, res) => {
    try {
        if (!isUserOrAdminRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE o ADMIN_ROLE puede listar y buscar salas',
            });
        }

        const { code } = req.params;
        const room = await Room.findOne({ roomCode: String(code).toUpperCase() }).lean();

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        const roomChats = await Chat.find({ roomId: room._id }).lean();
        const mapped = await buildMessagesForRoom(room, roomChats);

        return res.status(200).json(attachChatsToRoom({ ...room, messages: mapped }, roomChats));
    } catch (error) {
        console.error('getRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo la sala por codigo' });
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

export const deleteRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (!requesterIsAdmin && room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE duenio de la sala puede eliminarla',
            });
        }

        const [messagesResult, chatResult, filesResult, sessionsResult, executionsResult, participationsResult] =
            await Promise.all([
                Message.deleteMany({
                    $or: [{ roomId: room._id }, { numberChat: room.numberChat }],
                }),
                Chat.deleteMany({ roomId: room._id }),
                File.deleteMany({ roomId: room._id }),
                CodeSession.deleteMany({ roomId: room._id }),
                CodeExecution.deleteMany({ roomId: room._id }),
                RoomParticipation.deleteMany({ roomId: room._id }),
            ]);

        await Room.deleteOne({ _id: room._id });

        return res.status(200).json({
            message: 'Sala eliminada correctamente con sus registros relacionados',
            deleted: {
                roomId: String(room._id),
                roomCode: room.roomCode,
                messages: messagesResult.deletedCount || 0,
                chats: chatResult.deletedCount || 0,
                files: filesResult.deletedCount || 0,
                codeSessions: sessionsResult.deletedCount || 0,
                codeExecutions: executionsResult.deletedCount || 0,
                roomParticipations: participationsResult.deletedCount || 0,
            },
        });
    } catch (error) {
        console.error('deleteRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error eliminando la sala por codigo' });
    }
};

export const deactivateRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const requesterIsAdmin = isAdminRole(req);
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (!requesterIsAdmin && room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE duenio de la sala puede finalizarla',
            });
        }

        room.roomStatus = 'CERRADA';
        room.connectedUsers = [];
        room.lastActivity = {
            date: new Date(),
            action: requesterIsAdmin
                ? 'Sala finalizada/desactivada por moderacion administrativa'
                : 'Sala finalizada/desactivada por anfitrion',
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
            message: 'Sala finalizada y desactivada correctamente. Todos los miembros han sido desconectados.',
            roomId: room._id,
            roomStatus: room.roomStatus,
        });
    } catch (error) {
        console.error('deactivateRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error desactivando la sala' });
    }
};

export const getRoomFileChanges = async (req, res) => {
    try {
        const { code: roomCode, fileId } = req.params;
        const requesterUserId = getRequesterUserId(req);

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
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

        // Obtener archivo
        const file = await File.findById(fileId);
        if (!file || String(file.roomId) !== String(room._id)) {
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

        // Obtener últimas code sessions del archivo (máximo 20)
        const codeSessions = await CodeSession.find({ fileId })
            .sort({ savedAt: -1 })
            .limit(20)
            .lean();

        // Obtener información de los usuarios que guardaron
        const userIds = [...new Set(codeSessions.map((cs) => cs.savedByUserId))];
        const participants = await RoomParticipation.find({
            roomId: room._id,
            userId: { $in: userIds },
        }).select('userId username').lean();

        const usernamesMap = new Map(participants.map((p) => [p.userId, p.username]));

        // Enriquecer las sesiones
        const enrichedSessions = codeSessions.map((session) => ({
            sessionId: session._id,
            version: session.version,
            language: session.language,
            saveType: session.saveType,
            wasExecuted: session.wasExecuted,
            savedByUserId: session.savedByUserId,
            savedByUsername: usernamesMap.get(session.savedByUserId) || session.savedByUserId,
            savedAt: session.savedAt,
            codePreview: session.code ? session.code.substring(0, 100) + (session.code.length > 100 ? '...' : '') : '',
            codeLength: session.code?.length || 0,
        }));

        return res.status(200).json({
            success: true,
            data: {
                roomCode: room.roomCode,
                roomName: room.roomName,
                fileName: file.fileName,
                fileExtension: file.fileExtension,
                language: file.language,
                changes: enrichedSessions,
                totalChanges: enrichedSessions.length,
            },
        });
    } catch (error) {
        console.error('getRoomFileChanges error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo cambios del archivo' });
    }
};