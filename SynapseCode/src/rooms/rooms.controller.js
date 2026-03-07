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

        // El host siempre se toma del token para evitar suplantacion por body
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

        // Quien crea la sala pasa a ser anfitrión (HOST): se crea su participación con rol ANFITRION y todos los privilegios
        await RoomParticipation.create({
            roomId: room._id,
            userId: room.hostId,
            username: req.user?.username || null,
            role: 'ANFITRION',
            permissions: getRoleDefaultPermissions('ANFITRION'),
        });

        return res.status(201).json(room);
    } catch (error) {
        console.error('createRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error creando la sala' });
    }
};

export const updateRoom = async (req, res) => {
    try {
        // obtiene el id de quien hizo la peticion con el token
        const requesterUserId = getRequesterUserId(req);
        //obtienen el id que vienen en la ruta
        const codeParam = req.params.code || req.params.id;

        //si el token no trae el userId manda a decir que no sirve 
        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        //busca la sala por su codigo y si no la encuentra por su id
        let room = await Room.findOne({ roomCode: String(codeParam).toUpperCase() });
        if (!room && String(codeParam || '').match(/^[a-f\d]{24}$/i)) {
            room = await Room.findById(codeParam);
        }

        // y si no hay nada manda a decir que no se encuentra la sala 
        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        //verificamos que si el role del token es user_role y si no es user tira error
        if (room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE de la sala puede editarla',
            });
        }
        //definimos que campos se pueden actualizar de la sala
        const allowedFields = new Set([
            'roomName',
            'roomType',
            'roomLanguage',
            'maxUsers',
            'currentCode',
            'lastActivity',
            'roomStatus',
        ]);

        // convierte nuestro body en un array 
        //luego filtra el array para darnos los campos que si se pueden modificar 
        const updates = Object.fromEntries(
            Object.entries(req.body || {}).filter(([key]) => allowedFields.has(key))
        );

        // nos indica si el objeto esta vacio 
        if (!Object.keys(updates).length) {
            return res.status(400).json({
                message: 'No se proporcionaron campos validos para actualizar la sala',
            });
        }

        //asignamos a la sala los campos que se modificaron y lo guardamos en room
        Object.assign(room, updates);
        await room.save();

        //devolvemos nuestro room con todo ya modificado 
        return res.status(200).json(room);
    } catch (error) {
        console.error('updateRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error actualizando la sala por codigo' });
    }
};

export const getRoom = async (req, res) => {
    try {
        // si el rol de usurio en el token no es user_role no puede listar
        if (!isUserRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE puede listar y buscar salas',
            });
        }

        // tenemos los valore spor medio del query para filtrarlos
        // y si no se ponen entonces se lista todo
        const { q, roomName, roomCode, roomType, roomStatus } = req.query;
        const filters = {};

        // este nos ayuda a filtrar por nombre de sala o codigo de sala sin importar masyusculas o minsculas
        if (q) {
            const safeQuery = String(q).trim();
            if (safeQuery) {
                filters.$or = [
                    { roomName: { $regex: safeQuery, $options: 'i' } },
                    { roomCode: { $regex: safeQuery, $options: 'i' } },
                ];
            }
        }

        //filtra por nombre de SAla
        if (roomName) filters.roomName = {
            $regex: String(roomName).trim(), $options: 'i'
        };
        //filtra por codigo de sala
        if (roomCode) filters.roomCode = String(roomCode)
            .toUpperCase();
        //filtra por tipo de sala
        if (roomType) filters.roomType = String(roomType)
            .toUpperCase();
        //filtra por el estatus de la sala
        if (roomStatus) filters.roomStatus = String(roomStatus)
            .toUpperCase();

        //busca las salas si es que se aplico algun fultro
        const rooms = await Room.find(filters).lean();

        // Adjuntar mensajes por numberChat en cada sala
        const roomsWithMessages = await Promise.all(
            rooms.map(async (room) => {
                const messages = await Message.find({
                    numberChat: room.numberChat,
                    messageStatus: { $ne: 'ELIMINADO' },
                })
                    .sort({ sentAt: 1 })
                    .lean();

                // Crear mapa userId -> username para la sala
                const usernamesByUserId = new Map((room.connectedUsers || []).map((u) => [u.userId, u.username]));

                //mandamos a traer lo que queremos que salga en mensajes
                const mapped = (messages || []).map((m) => {
                    const base = {
                        numberChat: m.numberChat,
                        userId: m.userId,
                        userName: m.userId === 'SYSTEM' ? 'SYSTEM' : usernamesByUserId.get(m.userId) || null,
                        content: m.content,
                        sentAt: m.sentAt,
                    };
                    if (m.isEdited) base.isEdited = true;
                    return base;
                });
                // lo mandamos a traer nuevamente en el room pero con los mensajes ya incluidos
                return {
                    ...room,
                    messages: mapped,
                };
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
        if (!isUserRole(req)) {
            return res.status(403).json({
                message: 'Solo USER_ROLE puede listar y buscar salas',
            });
        }

        const { code } = req.params;
        const room = await Room.findOne({ roomCode: String(code).toUpperCase() }).lean();

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        // unimos los mensajes de la sala con el numberchat para que se muestren en la salA
        const messages = await Message.find({
            numberChat: room.numberChat,
            messageStatus: { $ne: 'ELIMINADO' },
        })
            .sort({ sentAt: 1 })
            .lean();

        const usernamesByUserId = new Map((room.connectedUsers || []).map((u) => [u.userId, u.username]));

        const mapped = (messages || []).map((m) => {
            const base = {
                numberChat: m.numberChat,
                userId: m.userId,
                userName: m.userId === 'SYSTEM' ? 'SYSTEM' : usernamesByUserId.get(m.userId) || null,
                content: m.content,
                sentAt: m.sentAt,
            };
            if (m.isEdited) base.isEdited = true;
            return base;
        });

        return res.status(200).json({
            ...room,
            messages: mapped,
        });
    } catch (error) {
        console.error('getRoomByCode error:', error);
        return res.status(400).json({ message: error.message || 'Error obteniendo la sala por codigo' });
    }
};



export const deleteRoom = async (req, res) => {
    try {
        const requesterUserId = getRequesterUserId(req);
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE duenio de la sala puede eliminarla',
            });
        }

        // elimina todos los datos o registros guardados en la db que se relacione con la sala
        const [messagesResult, chatResult, filesResult, sessionsResult, executionsResult, participationsResult] =
            await Promise.all([
                Message.deleteMany({
                    $or: [{ roomId: room._id }, { numberChat: room.numberChat }],
                }),
                Chat.deleteMany({ numberChat: room.numberChat }),
                File.deleteMany({ roomId: room._id }),
                CodeSession.deleteMany({ roomId: room._id }),
                CodeExecution.deleteMany({ roomId: room._id }),
                RoomParticipation.deleteMany({ roomId: room._id }),
            ]);

        //eliminamos la sala
        await Room.deleteOne({ _id: room._id });

        //retornamos el mensaje de que si se elimino la sala 
        return res.status(200).json({
            message: 'Sala eliminada correctamente con sus registros relacionados',
            // nos muestra que es lo que se elimino o cuanto si uno o cuantos 
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
        const { code } = req.params;

        if (!requesterUserId) {
            return res.status(401).json({ message: 'Token invalido: no contiene userId' });
        }

        const room = await Room.findOne({ roomCode: String(code).toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        if (room.hostId !== requesterUserId) {
            return res.status(403).json({
                message: 'Solo el HOST_ROLE dueño de la sala puede finalizarla',
            });
        }

        // Cambiar el estado de la sala a CERRADA o ARCHIVADA
        room.roomStatus = 'CERRADA';
        room.connectedUsers = [];
        room.lastActivity = {
            date: new Date(),
            action: 'Sala finalizada/desactivada por anfitrión',
            performedBy: {
                userId: requesterUserId,
                username: req.user?.username || null
            }
        };
        await room.save();

        // Desconectar a todos los miembros de la sala
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
            message: 'Sala finalizar y desactivada correctamente. Todos los miembros han sido desconectados.',
            roomId: room._id,
            roomStatus: room.roomStatus
        });
    } catch (error) {
        console.error('deactivateRoom error:', error);
        return res.status(400).json({ message: error.message || 'Error desactivando la sala' });
    }
};
