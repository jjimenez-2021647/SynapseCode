'use strict'

import mongoose from 'mongoose';
import File from '../src/files/files.model.js';
import RoomParticipation from '../src/roomParticipations/roomParticipations.model.js';

// Funcion para obtener el id del usuario que viene en el token.
// A veces el id puede venir con diferentes nombres, por eso revisamos varias opciones.
const normalizeUserId = (req) => req.user?.userId || req.user?.id || req.user?.sub || null;


// Funcion que revisa si el id que recibimos tiene un formato valido
// para poder buscarlo en la base de datos.
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);


// Funcionque  busca en la base de datos a qué sala pertenece un archivo.
// Primero revisa si el id del archivo es valido.
// Luego busca el archivo y obtiene el roomId (la sala donde esta).
const resolveRoomIdByFileId = async (fileId) => {
    if (!isValidObjectId(fileId)) return null;

    const file = await File.findById(fileId).select('roomId').lean();

    // Si encuentra la sala devuelve su id en texto, si no devuelve null
    return file?.roomId ? String(file.roomId) : null;
};


// Funcion que revisa si el usuario pertenece a una sala.
// Es decir, verifica que el usuario tenga permiso para usar archivos de esa sala.
const ensureMembership = async (roomId, userId) => {

    // Primero revisa si el id de la sala es valido
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

    // Busca en la base de datos si existe una relacion
    // entre el usuario y la sala
    const participation = await RoomParticipation.findOne({
        roomId,
        userId,
    })
        .select('_id')
        .lean();

    // Si no encuentra esa relacion significa que el usuario
    // no pertenece a la sala
    if (!participation) {
        return {
            ok: false,
            status: 403,
            payload: {
                success: false,
                message: 'Solo miembros de la sala pueden ejecutar archivos de esa sala',
                error: 'ROOM_MEMBERSHIP_REQUIRED',
            },
        };
    }

    // Si todo está bien significa que el usuario si pertenece a la sala
    return { ok: true };
};


// Funcion que es un middleware que se ejecuta antes de realizar una accion.
// Su trabajo es verificar que el usuario tenga permiso para usar un archivo.
export const requireRoomMembershipByFileId = async (req, res, next) => {
    try {

        // Obtenemos el id del usuario que viene en el token
        const userId = normalizeUserId(req);

        // Si no existe el id del usuario el token no es valido
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido: no contiene userId',
                error: 'INVALID_TOKEN_PAYLOAD',
            });
        }

        // Obtenemos el id del archivo que viene en la peticion
        const fileId = req.body?.fileId;

        // Si no se envió el id del archivo devolvemos un error
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        // Buscamos a que sala pertenece ese archivo
        const roomId = await resolveRoomIdByFileId(fileId);

        // Si no se encuentra el archivo o no pertenece a ninguna sala
        if (!roomId) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado o no pertenece a ninguna sala',
                error: 'FILE_NOT_FOUND_OR_NO_ROOM',
            });
        }

        // Revisamos si el usuario pertenece a la sala
        const membership = await ensureMembership(roomId, userId);

        // Si no pertenece a la sala se devuelve el error
        if (!membership.ok) {
            return res.status(membership.status).json(membership.payload);
        }

        // Si todo esta correcto se permite continuar con la siguiente funcion
        return next();

    } catch (error) {

        // Si ocurre un error inesperado lo mostramos en la consola
        console.error('requireRoomMembershipByFileId error:', error);

        // Y devolvemos un error al cliente
        return res.status(500).json({
            success: false,
            message: 'Error validando membresia de sala para archivo',
            error: 'VALIDATE_ROOM_MEMBERSHIP_ERROR',
        });
    }
};