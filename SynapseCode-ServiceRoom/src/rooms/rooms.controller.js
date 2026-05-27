/* eslint-disable no-underscore-dangle, no-empty, @typescript-eslint/no-base-to-string */
'use strict'
import Room from './rooms.model.js';
import RoomParticipation from '../roomParticipations/roomParticipations.model.js';
import generateUniqueRoomCode from '../../helpers/rooms.helpers.js';
import { getRoleDefaultPermissions, calculateTotalMinutes } from '../../helpers/roomParticipations.helpers.js';
import { callService } from '../../helpers/service-communication.js';
import { getUserPlanInfo, getUserPlanInfoByUserId, validateRoomCreation, getMaxUsersLimit } from '../../helpers/plan-limits-validator.js';
import axios from 'axios';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || req.userId || null;

const isUserRole = (req) => String(req.user?.role || '').toUpperCase() === 'USER_ROLE';
const isAdminRole = (req) => String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE';
const isUserOrAdminRole = (req) => isUserRole(req) || isAdminRole(req);

const resolveRoomHostPlan = async (room) => {
    if (room?.hostPlan) {
        return room.hostPlan;
    }

    if (!room?.hostId) {
        return 'FREE';
    }

    const planInfo = await getUserPlanInfoByUserId(room.hostId);
    const resolvedPlan = planInfo?.planName || 'FREE';

    try {
        await Room.updateOne(
            { _id: room._id, $or: [{ hostPlan: { $exists: false } }, { hostPlan: null }, { hostPlan: '' }] },
            { $set: { hostPlan: resolvedPlan } }
        );
    } catch (error) {
        console.warn('[WARN] No se pudo backfillear hostPlan en la sala:', error.message);
    }

    return resolvedPlan;
};

export const createRoom = async (req, res) => {
    try {
        const payload = { ...req.body };
        const hostIdFromToken = getRequesterUserId(req);
        const token = req.headers['x-token'] || req.headers.authorization?.replace('Bearer ', '');
        let hostPlan = 'FREE';

        // 🔍 LOG DETALLADO PARA DEBUG
        console.log('[CREATE_ROOM_DEBUG]', {
            timestamp: new Date().toISOString(),
            hostIdFromToken,
            req_user_userId: req.user?.userId,
            req_user_id: req.user?.id,
            req_user_sub: req.user?.sub,
            req_user_username: req.user?.username,
            payload_roomCode: payload.roomCode,
            payload_roomName: payload.roomName
        });

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

        // ✅ Validar límite de salas por plan (contando anfitrión + participaciones)
        try {
            const limitValidation = await validateRoomCreation(hostIdFromToken, token, { Room, RoomParticipation });

            if (!limitValidation.valid) {
                return res.status(403).json({
                    success: false,
                    message: limitValidation.message,
                    error: 'ROOM_LIMIT_EXCEEDED',
                    planName: limitValidation.planName,
                    limit: limitValidation.limit,
                    current: limitValidation.current,
                    hostedRooms: limitValidation.hostedRooms,
                    participantRooms: limitValidation.participantRooms
                });
            }
            hostPlan = limitValidation.planName || 'FREE';
        } catch (error) {
            console.warn('[WARN] Validación de límites de plan fallida, continuando:', error.message);
            // Continuar aunque ServicePlans no esté disponible
        }

        if (hostPlan === 'FREE' && token) {
            try {
                const planInfo = await getUserPlanInfo(hostIdFromToken, token);
                hostPlan = planInfo?.planName || 'FREE';
            } catch (error) {
                console.warn('[WARN] No se pudo obtener el plan del host para persistirlo:', error.message);
            }
        }

        // ✅ Obtener límite máximo de usuarios dinámicamente según el plan
        let maxAllowed = 5; // Default para FREE
        let orgMaxParticipants = null;
        try {
            const usersLimitInfo = await getMaxUsersLimit(hostIdFromToken, token);
            maxAllowed = usersLimitInfo.maxUsers;
            // Si es ORG, obtener el valor real de orgInfo.maxParticipants
            if (usersLimitInfo.planName === 'ORG') {
                // Volver a obtener la suscripción para extraer orgInfo
                const planInfo = await getUserPlanInfo(hostIdFromToken, token);
                orgMaxParticipants = planInfo?.subscription?.orgInfo?.maxParticipants;
                if (!orgMaxParticipants || typeof orgMaxParticipants !== 'number' || orgMaxParticipants < 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Debes configurar la cantidad de estudiantes en tu plan ORG antes de crear una sala.',
                        error: 'ORG_MAX_PARTICIPANTS_UNDEFINED',
                        planName: 'ORG'
                    });
                }
                maxAllowed = orgMaxParticipants;
            }
        } catch (error) {
            console.warn('[WARN] No se pudo obtener límite de usuarios, usando default:', error.message);
        }

        // Validar que maxUsers no supere el límite del plan
        if (payload.maxUsers && payload.maxUsers > maxAllowed) {
            return res.status(400).json({
                success: false,
                message: `Tu plan ${hostPlan} permite máximo ${maxAllowed} usuarios por sala. Proporcionaste ${payload.maxUsers}.`,
                error: 'INVALID_MAX_USERS',
                planName: hostPlan,
                maxAllowed,
                provided: payload.maxUsers
            });
        }

        // Si no especificó maxUsers, asignar el máximo permitido
        if (!payload.maxUsers) {
            payload.maxUsers = maxAllowed;
        }

        payload.hostId = hostIdFromToken;
        payload.hostPlan = hostPlan;
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

        // 🔍 LOG ANTES DE CREAR PARTICIPACIÓN DEL HOST
        console.log('[CREATE_ROOM_PARTICIPATION_DEBUG]', {
            timestamp: new Date().toISOString(),
            roomId: room._id,
            roomCode: room.roomCode,
            room_hostId: room.hostId,
            hostIdFromToken,
            match: room.hostId === hostIdFromToken,
            username: req.user?.username
        });

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

        // ✅ Validar maxUsers según el plan del host si se intenta actualizar
        if (updates.maxUsers) {
            const maxUsersPerPlan = {
                FREE: 5,
                PRO: 20,
                ORG: 100
            };
            const hostPlan = room.hostPlan || 'FREE';
            const maxAllowed = maxUsersPerPlan[hostPlan] || 5;

            if (updates.maxUsers > maxAllowed) {
                return res.status(400).json({
                    success: false,
                    message: `El plan ${hostPlan} permite máximo ${maxAllowed} usuarios por sala. Intentaste ${updates.maxUsers}.`,
                    error: 'INVALID_MAX_USERS',
                    planName: hostPlan,
                    maxAllowed,
                    attempted: updates.maxUsers
                });
            }
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
                    const hostPlan = await resolveRoomHostPlan(room);
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
                        hostPlan,
                        chats: roomChats,
                    };
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    const roomIdStr = room._id.toString();
                    console.warn(`No se pudieron obtener los chats de la sala ${roomIdStr}`);
                    console.debug('Chat service error:', err?.message);
                    return {
                        ...room,
                        hostPlan: room.hostPlan || 'FREE',
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

        const hostPlan = await resolveRoomHostPlan(room);

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
            hostPlan,
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
            .select('roomCode roomName hostId hostPlan createdAt roomStatus roomType roomLanguage')
            .sort({ createdAt: -1 })
            .lean();

        const data = await Promise.all(
            rooms.map(async (room) => ({
                roomId: room._id,
                roomCode: room.roomCode,
                roomName: room.roomName,
                createdByUserId: room.hostId,
                hostPlan: await resolveRoomHostPlan(room),
                createdAt: room.createdAt || null,
                roomStatus: room.roomStatus,
                roomType: room.roomType,
                roomLanguage: room.roomLanguage || null,
            }))
        );

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

/**
 * DEBUG: Ver desglose de salas contadas para validación de plan
 */
export const debugRoomCount = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido: no contiene userId'
            });
        }

        console.log(`[DEBUG_ROOM_COUNT] userId extraído: "${userId}" (tipo: ${typeof userId})`);

        // Salas donde es anfitrión
        const hostedRooms = await Room.find({
            hostId: userId,
            roomStatus: 'ACTIVA'
        }).select('_id roomCode roomName hostId roomStatus').lean();

        console.log(`[DEBUG_ROOM_COUNT] Salas como anfitrión (hostId="${userId}"): ${hostedRooms.length}`);
        hostedRooms.forEach(r => console.log(`  - ${r.roomCode}: hostId="${r.hostId}"`));

        // Participaciones activas
        const participations = await RoomParticipation.find({
            userId,
            connectionStatus: 'CONECTADO'
        }).populate('roomId', 'roomCode roomName hostId').lean();

        console.log(`[DEBUG_ROOM_COUNT] Participaciones (userId="${userId}", CONECTADO): ${participations.length}`);
        participations.forEach(p => console.log(`  - ${p.roomId?.roomCode}: participationUserId="${p.userId}", connectionStatus="${p.connectionStatus}"`));

        const hostedCount = hostedRooms.length;
        const participantCount = participations.length;
        const totalCount = hostedCount + participantCount;

        return res.status(200).json({
            success: true,
            userId,
            userIdType: typeof userId,
            counts: {
                hostedRooms: hostedCount,
                participantRooms: participantCount,
                total: totalCount
            },
            hostedRooms: hostedRooms.map(r => ({
                roomId: r._id,
                roomCode: r.roomCode,
                roomName: r.roomName,
                hostId: r.hostId,
                type: 'HOSTED'
            })),
            participantRooms: participations.map(p => ({
                roomId: p.roomId?._id,
                roomCode: p.roomId?.roomCode,
                roomName: p.roomId?.roomName,
                type: 'PARTICIPANT',
                role: p.role,
                connectionStatus: p.connectionStatus,
                participationUserId: p.userId
            }))
        });
    } catch (error) {
        console.error('debugRoomCount error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error en debug de conteo de salas'
        });
    }
};

/**
 * DEBUG GLOBAL: Ver TODAS las participaciones CONECTADO en la BD
 * (sin filtro de usuario - para diagnosticar problemas de datos)
 */
export const debugAllConnectedParticipations = async (req, res) => {
    try {
        // SOLO si es ADMIN
        if (!isAdminRole(req)) {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden usar este endpoint',
                error: 'FORBIDDEN'
            });
        }

        // Todas las participaciones CONECTADO
        const allConnected = await RoomParticipation.find({
            connectionStatus: 'CONECTADO'
        }).populate('roomId', 'roomCode roomName hostId').lean();

        console.log(`[DEBUG_ALL_CONNECTED] Total participaciones CONECTADO en BD: ${allConnected.length}`);

        // Agrupar por userId para detectar anomalías
        const byUserId = {};
        allConnected.forEach(p => {
            const uid = p.userId || 'NULL_USER_ID';
            if (!byUserId[uid]) byUserId[uid] = [];
            byUserId[uid].push(p);
        });

        console.log(`[DEBUG_ALL_CONNECTED] Usuarios únicos: ${Object.keys(byUserId).length}`);
        Object.entries(byUserId).forEach(([uid, parts]) => {
            console.log(`  User "${uid}": ${parts.length} participaciones`);
        });

        return res.status(200).json({
            success: true,
            totalConnected: allConnected.length,
            uniqueUsers: Object.keys(byUserId).length,
            byUserId: Object.fromEntries(
                Object.entries(byUserId).map(([uid, parts]) => [
                    uid,
                    {
                        count: parts.length,
                        rooms: parts.map(p => ({
                            participationId: p._id,
                            roomCode: p.roomId?.roomCode,
                            roomName: p.roomId?.roomName,
                            role: p.role,
                            joinedAt: p.joinedAt,
                        }))
                    }
                ])
            ),
            allConnectedFull: allConnected
        });
    } catch (error) {
        console.error('debugAllConnectedParticipations error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error en debug global'
        });
    }
};

/**
 * DEBUG: Mostrar todas las salas agrupadas por host con sus participaciones
 * Ayuda a detectar discrepancias en userIds
 */
export const debugRoomsWithParticipations = async (req, res) => {
    try {
        // SOLO si es ADMIN
        if (!isAdminRole(req)) {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden usar este endpoint',
                error: 'FORBIDDEN'
            });
        }

        // Obtener todas las salas
        const allRooms = await Room.find({}).lean();

        // Para cada sala, obtener sus participaciones
        const roomsWithParticipations = await Promise.all(
            allRooms.map(async (room) => {
                const participations = await RoomParticipation.find({
                    roomId: room._id
                }).lean();

                return {
                    roomId: room._id,
                    roomCode: room.roomCode,
                    roomName: room.roomName,
                    hostId: room.hostId,
                    roomStatus: room.roomStatus,
                    totalParticipations: participations.length,
                    participations: participations.map(p => ({
                        participationId: p._id,
                        userId: p.userId,
                        role: p.role,
                        connectionStatus: p.connectionStatus,
                        joinedAt: p.joinedAt,
                    }))
                };
            })
        );

        // Agrupar por hostId
        const byHostId = {};
        roomsWithParticipations.forEach(room => {
            const hostId = room.hostId || 'UNKNOWN_HOST';
            if (!byHostId[hostId]) {
                byHostId[hostId] = [];
            }
            byHostId[hostId].push(room);
        });

        // Detectar anomalías
        const anomalies = [];
        Object.entries(byHostId).forEach(([hostId, rooms]) => {
            rooms.forEach(room => {
                // Anomalía: participación con userId != hostId en rol ANFITRION
                const hostParticipation = room.participations.find(p => p.role === 'ANFITRION');
                if (hostParticipation && hostParticipation.userId !== hostId) {
                    anomalies.push({
                        type: 'HOST_PARTICIPATION_MISMATCH',
                        roomCode: room.roomCode,
                        hostId,
                        participationUserId: hostParticipation.userId,
                        message: `Host ${hostId} no tiene participación con su userId en sala ${room.roomCode}`
                    });
                }

                // Anomalía: sala sin participación ANFITRION
                if (!hostParticipation) {
                    anomalies.push({
                        type: 'MISSING_HOST_PARTICIPATION',
                        roomCode: room.roomCode,
                        hostId,
                        message: `Sala ${room.roomCode} no tiene participación ANFITRION`
                    });
                }

                // Anomalía: participación de otro usuario que no es anfitrión
                room.participations.forEach(p => {
                    if (p.userId !== hostId && p.role === 'ANFITRION') {
                        anomalies.push({
                            type: 'UNAUTHORIZED_HOST_ROLE',
                            roomCode: room.roomCode,
                            hostId,
                            participationUserId: p.userId,
                            message: `Usuario ${p.userId} tiene rol ANFITRION pero hostId es ${hostId}`
                        });
                    }
                });
            });
        });

        return res.status(200).json({
            success: true,
            totalRooms: allRooms.length,
            totalHostsWithRooms: Object.keys(byHostId).length,
            anomaliesDetected: anomalies.length,
            anomalies,
            roomsByHost: Object.fromEntries(
                Object.entries(byHostId).map(([hostId, rooms]) => [
                    hostId,
                    {
                        totalRooms: rooms.length,
                        rooms: rooms.map(r => ({
                            roomCode: r.roomCode,
                            roomName: r.roomName,
                            status: r.roomStatus,
                            totalParticipations: r.totalParticipations,
                            hostParticipationStatus: r.participations.find(p => p.role === 'ANFITRION')
                                ? 'OK'
                                : 'MISSING'
                        }))
                    }
                ])
            )
        });
    } catch (error) {
        console.error('debugRoomsWithParticipations error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error en debug de salas'
        });
    }
};

/**
 * DEBUG: Mostrar cómo se extrae el userId del token en diferentes puntos
 */
export const debugTokenExtraction = async (req, res) => {
    try {
        // SOLO si es ADMIN
        if (!isAdminRole(req)) {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden usar este endpoint',
                error: 'FORBIDDEN'
            });
        }

        // Extraer userId de múltiples formas (como hace el código)
        const userId_method1 = req.user?.userId || null;
        const userId_method2 = req.user?.id || null;
        const userId_method3 = req.user?.sub || null;
        const userId_method4 = req.userId || null;
        const userId_combined = userId_method1 || userId_method2 || userId_method3 || userId_method4 || null;

        // Información completa del token
        const tokenInfo = {
            userId_from_userId_field: userId_method1,
            userId_from_id_field: userId_method2,
            userId_from_sub_field: userId_method3,
            userId_from_req_userId: userId_method4,
            finalUserId: userId_combined,
            username: req.user?.username || null,
            role: req.user?.role || null,
            allUserFields: Object.keys(req.user || {}),
            fullUserObject: req.user
        };

        // Mostrar cómo se extrae en ambas funciones
        const requesterUserId = getRequesterUserId(req);

        return res.status(200).json({
            success: true,
            currentUser: {
                extractedUserId: requesterUserId,
                allExtractionMethods: tokenInfo
            },
            usage: {
                message: 'Este endpoint muestra qué userId se extraería en createRoom() y createRoomParticipation()'
            }
        });
    } catch (error) {
        console.error('debugTokenExtraction error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error en debug de extracción de token'
        });
    }
};

/**
 * DEBUG: Mostrar todas las participaciones de un usuario específico
 * Query param: userId (opcional, por defecto es el usuario actual)
 */
export const debugUserParticipations = async (req, res) => {
    try {
        // SOLO si es ADMIN
        if (!isAdminRole(req)) {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden usar este endpoint',
                error: 'FORBIDDEN'
            });
        }

        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId es requerido como query parameter',
                error: 'MISSING_USERID'
            });
        }

        // Obtener todas las participaciones del usuario
        const userParticipations = await RoomParticipation.find({
            userId: String(userId).trim()
        }).populate('roomId', 'roomCode roomName hostId roomStatus hostPlan').lean();

        // Obtener todas las salas donde es host
        const hostedRooms = await Room.find({
            hostId: String(userId).trim()
        }).lean();

        // Agrupar participaciones por estatus
        const byStatus = {};
        userParticipations.forEach(p => {
            const status = p.connectionStatus || 'UNKNOWN';
            if (!byStatus[status]) byStatus[status] = [];
            byStatus[status].push(p);
        });

        // Detectar anomalías
        const anomalies = [];
        
        // Anomalía: Usuario participa en sala pero no es el host
        // Y la participación tiene rol ANFITRION (que no debería pasar)
        userParticipations.forEach(p => {
            if (p.role === 'ANFITRION' && p.roomId?.hostId !== userId) {
                anomalies.push({
                    type: 'INVALID_HOST_ROLE',
                    roomCode: p.roomId?.roomCode,
                    roomHost: p.roomId?.hostId,
                    message: `Usuario ${userId} tiene rol ANFITRION en sala que pertenece a ${p.roomId?.hostId}`
                });
            }
        });

        // Anomalía: Usuario no es host pero está creado como participación en su propia sala
        // (esto puede ser normal, pero es importante notarlo)
        hostedRooms.forEach(room => {
            const participationInOwnRoom = userParticipations.find(p => p.roomId?._id?.toString() === room._id.toString());
            if (!participationInOwnRoom) {
                anomalies.push({
                    type: 'MISSING_HOST_PARTICIPATION',
                    roomCode: room.roomCode,
                    message: `Host ${userId} no tiene participación en su propia sala ${room.roomCode}`
                });
            }
        });

        return res.status(200).json({
            success: true,
            userId: String(userId).trim(),
            summary: {
                totalParticipations: userParticipations.length,
                hostedRooms: hostedRooms.length,
                participationsByStatus: Object.fromEntries(
                    Object.entries(byStatus).map(([status, parts]) => [status, parts.length])
                ),
                anomaliesDetected: anomalies.length
            },
            anomalies,
            participations: userParticipations.map(p => ({
                participationId: p._id,
                roomCode: p.roomId?.roomCode,
                roomName: p.roomId?.roomName,
                roomHost: p.roomId?.hostId,
                role: p.role,
                connectionStatus: p.connectionStatus,
                joinedAt: p.joinedAt,
                leftAt: p.leftAt
            })),
            hostedRoomsDetail: hostedRooms.map(room => ({
                roomCode: room.roomCode,
                roomName: room.roomName,
                hostId: room.hostId,
                roomStatus: room.roomStatus,
                hostPlan: room.hostPlan,
                totalConnectedUsers: (room.connectedUsers || []).length
            }))
        });
    } catch (error) {
        console.error('debugUserParticipations error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error en debug de participaciones del usuario'
        });
    }
};
