'use strict'
import mongoose from 'mongoose';
import CodeSession from '../src/codeSessions/codeSessions.model.js';
import File from '../src/files/files.model.js';
import RoomParticipation from '../src/roomParticipations/roomParticipations.model.js';

const normalizeUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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

    const participation = await RoomParticipation.findOne({ roomId, userId })
        .select('_id')
        .lean();

    if (!participation) {
        return {
            ok: false,
            status: 403,
            payload: {
                success: false,
                message: 'Debes pertenecer a la sala para realizar esta accion',
                error: 'ROOM_MEMBERSHIP_REQUIRED',
            },
        };
    }

    return { ok: true };
};

const resolveRoomIdByFileId = async (fileId) => {
    if (!isValidObjectId(fileId)) return null;
    const file = await File.findById(fileId).select('roomId').lean();
    return file?.roomId ? String(file.roomId) : null;
};

const resolveRoomIdBySessionId = async (sessionId) => {
    if (!isValidObjectId(sessionId)) return null;
    const session = await CodeSession.findById(sessionId).select('roomId').lean();
    return session?.roomId ? String(session.roomId) : null;
};

const getUserIdOrUnauthorized = (req, res) => {
    const userId = normalizeUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Token invalido: no contiene userId',
            error: 'INVALID_TOKEN_PAYLOAD',
        });
        return null;
    }

    return userId;
};

export const requireCodeSessionRoomAccessByBodyFileId = async (req, res, next) => {
    try {
        const userId = getUserIdOrUnauthorized(req, res);
        if (!userId) return;

        const fileId = req.body?.fileId;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const roomId = await resolveRoomIdByFileId(fileId);
        if (!roomId) {
            return res.status(404).json({
                success: false,
                message: 'El archivo no existe',
                error: 'FILE_NOT_FOUND',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) return res.status(membership.status).json(membership.payload);

        return next();
    } catch (error) {
        console.error('requireCodeSessionRoomAccessByBodyFileId error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso por sala de code sessions',
            error: 'VALIDATE_CODE_SESSION_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireCodeSessionRoomAccessBySessionIdParam = async (req, res, next) => {
    try {
        const userId = getUserIdOrUnauthorized(req, res);
        if (!userId) return;

        const sessionId = req.params?.id;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'id de sesion es obligatorio',
                error: 'MISSING_SESSION_ID',
            });
        }

        const roomId = await resolveRoomIdBySessionId(sessionId);
        if (!roomId) {
            return res.status(404).json({
                success: false,
                message: 'Sesion de codigo no encontrada',
                error: 'SESSION_NOT_FOUND',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) return res.status(membership.status).json(membership.payload);

        return next();
    } catch (error) {
        console.error('requireCodeSessionRoomAccessBySessionIdParam error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso por sala de code sessions',
            error: 'VALIDATE_CODE_SESSION_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireCodeSessionRoomAccessByFileIdParam = async (req, res, next) => {
    try {
        const userId = getUserIdOrUnauthorized(req, res);
        if (!userId) return;

        const fileId = req.params?.fileId;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const roomId = await resolveRoomIdByFileId(fileId);
        if (!roomId) {
            return res.status(404).json({
                success: false,
                message: 'El archivo no existe',
                error: 'FILE_NOT_FOUND',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) return res.status(membership.status).json(membership.payload);

        return next();
    } catch (error) {
        console.error('requireCodeSessionRoomAccessByFileIdParam error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso por sala de code sessions',
            error: 'VALIDATE_CODE_SESSION_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireCodeSessionRoomAccessByRoomIdParam = async (req, res, next) => {
    try {
        const userId = getUserIdOrUnauthorized(req, res);
        if (!userId) return;

        const roomId = req.params?.roomId;
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) return res.status(membership.status).json(membership.payload);

        return next();
    } catch (error) {
        console.error('requireCodeSessionRoomAccessByRoomIdParam error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso por sala de code sessions',
            error: 'VALIDATE_CODE_SESSION_ROOM_ACCESS_ERROR',
        });
    }
};

export const requireCodeSessionRoomAccessByQueryScope = async (req, res, next) => {
    try {
        const userId = getUserIdOrUnauthorized(req, res);
        if (!userId) return;

        const { roomId, fileId } = req.query;
        if (!roomId && !fileId) {
            return res.status(400).json({
                success: false,
                message: 'Debes enviar roomId o fileId para listar sesiones',
                error: 'MISSING_SCOPE_FILTER',
            });
        }

        if (fileId) {
            const resolvedRoomId = await resolveRoomIdByFileId(fileId);
            if (!resolvedRoomId) {
                return res.status(404).json({
                    success: false,
                    message: 'El archivo no existe',
                    error: 'FILE_NOT_FOUND',
                });
            }

            const membership = await ensureMembership(resolvedRoomId, userId);
            if (!membership.ok) return res.status(membership.status).json(membership.payload);
            return next();
        }

        const membership = await ensureMembership(roomId, userId);
        if (!membership.ok) return res.status(membership.status).json(membership.payload);

        return next();
    } catch (error) {
        console.error('requireCodeSessionRoomAccessByQueryScope error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso por sala de code sessions',
            error: 'VALIDATE_CODE_SESSION_ROOM_ACCESS_ERROR',
        });
    }
};
