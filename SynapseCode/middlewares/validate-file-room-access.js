'use strict'
import mongoose from 'mongoose';
import File from '../src/files/files.model.js';
import RoomParticipation from '../src/roomParticipations/roomParticipations.model.js';
import { mapSubRoleToParticipationRole } from '../helpers/roomParticipations.helpers.js';

const ALLOWED_SUB_ROLES = ['HOST_ROLE', 'ASSISTANT_ROLE'];
const ALLOWED_PARTICIPATION_ROLES = ALLOWED_SUB_ROLES
    .map(mapSubRoleToParticipationRole)
    .filter(Boolean);

const normalizeUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const resolveRoomIdByFileId = async (fileId) => {
    if (!isValidObjectId(fileId)) return null;
    const file = await File.findById(fileId).select('roomId').lean();
    return file?.roomId ? String(file.roomId) : null;
};

const ensureMembership = async (roomId, userId) => {
    if (!isValidObjectId(roomId)) {
        return {
            ok: false,
            status: 400,
            payload: {
                success: false,
                message: 'roomId invalido',
                error: 'INVALID_ROOM_ID',
            },
        };
    }

    const participation = await RoomParticipation.findOne({
        roomId,
        userId,
        role: { $in: ALLOWED_PARTICIPATION_ROLES },
    })
        .select('_id')
        .lean();

    if (!participation) {
        return {
            ok: false,
            status: 403,
            payload: {
                success: false,
                message: `Solo miembros de la sala con rol ${ALLOWED_SUB_ROLES.join(' o ')} pueden realizar esta accion`,
                error: 'ROOM_MEMBER_ACCESS_REQUIRED',
            },
        };
    }

    return { ok: true };
};

export const requireFileRoomAccessByBodyRoomId = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const roomId = req.body?.roomId;
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessByBodyRoomId error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireFileRoomAccessByParamRoomId = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const roomId = req.params?.roomId;
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessByParamRoomId error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};

// Middleware alternativo que permite acceso si el usuario pertenece a la sala o tiene rol ADMIN
export const requireFileRoomAccessByParamRoomIdOrAdmin = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // permitimos admins sin verificar membresía
        if (String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE') {
            return next();
        }

        const roomId = req.params?.roomId;
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessByParamRoomIdOrAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireFileRoomAccessByFileIdParam = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            console.warn('requireFileRoomAccessByFileIdParam: missing userId');
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const fileId = req.params?.id;
        if (!fileId) {
            console.warn('requireFileRoomAccessByFileIdParam: missing file id');
            return res.status(400).json({
                success: false,
                message: 'id de archivo es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        if (!isValidObjectId(fileId)) {
            console.warn('requireFileRoomAccessByFileIdParam: invalid ObjectId', fileId);
            return res.status(400).json({
                success: false,
                message: 'id de archivo invalido',
                error: 'INVALID_FILE_ID',
            });
        }

        const roomId = await resolveRoomIdByFileId(fileId);
        if (!roomId) {
            console.warn('requireFileRoomAccessByFileIdParam: file not found', fileId);
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessByFileIdParam error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};

// Variante que permite admins o miembros de sala (para borrado permanente/listado)
export const requireFileRoomAccessByFileIdParamOrAdmin = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // admin puede proceder sin membresía
        if (String(req.user?.role || '').toUpperCase() === 'ADMIN_ROLE') {
            return next();
        }

        const fileId = req.params?.id;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'id de archivo es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const roomId = await resolveRoomIdByFileId(fileId);
        if (!roomId) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessByFileIdParamOrAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireFileRoomAccessForReorder = async (req, res, next) => {
    try {
        const userId = normalizeUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        const fileOrders = req.body?.fileOrders;
        if (!Array.isArray(fileOrders) || !fileOrders.length) {
            return res.status(400).json({
                success: false,
                message: 'fileOrders debe ser un array con al menos un elemento',
                error: 'INVALID_FILE_ORDERS',
            });
        }

        const fileIds = fileOrders
            .map((item) => item?.fileId)
            .filter((fileId) => typeof fileId === 'string' && isValidObjectId(fileId));

        if (!fileIds.length || fileIds.length !== fileOrders.length) {
            return res.status(400).json({
                success: false,
                message: 'Todos los fileId de fileOrders deben ser ObjectId validos',
                error: 'INVALID_FILE_IDS',
            });
        }

        const files = await File.find({ _id: { $in: fileIds } }).select('_id roomId').lean();
        if (files.length !== fileIds.length) {
            return res.status(404).json({
                success: false,
                message: 'Uno o mas archivos no existen',
                error: 'FILE_NOT_FOUND',
            });
        }

        const roomIds = [...new Set(files.map((file) => String(file.roomId)))];

        const memberships = await RoomParticipation.find({
            roomId: { $in: roomIds },
            userId,
            role: { $in: ALLOWED_PARTICIPATION_ROLES },
        })
            .select('roomId')
            .lean();

        const memberRoomIds = new Set(memberships.map((item) => String(item.roomId)));
        const missingRoom = roomIds.find((roomId) => !memberRoomIds.has(roomId));

        if (missingRoom) {
            return res.status(403).json({
                success: false,
                message: `Solo miembros de la sala con rol ${ALLOWED_SUB_ROLES.join(' o ')} pueden realizar esta accion`,
                error: 'ROOM_MEMBER_ACCESS_REQUIRED',
            });
        }

        return next();
    } catch (error) {
        console.error('requireFileRoomAccessForReorder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso de sala para archivos',
            error: 'VALIDATE_FILE_ROOM_ACCESS_ERROR',
        });
    }
};