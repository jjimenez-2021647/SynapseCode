'use strict';

import Folder from './folders.model.js';
import File from '../files/files.model.js';
import Room from '../rooms/rooms.model.js';
import {
    buildExportEntries,
    buildFileExplorerTree,
    buildZipArchive,
    collectDescendantFolderIds,
    ensureFolderBelongsToRoom,
    ensureFolderIsNotInsideItself,
    isValidObjectId,
    normalizeOptionalObjectId,
    validateFolderName,
} from '../../helpers/file-tree.helpers.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

const getNextFolderDisplayOrder = async (roomId, parentFolderId) => {
    const lastFolder = await Folder.findOne({
        roomId,
        parentFolderId,
        isActive: true,
    })
        .sort({ displayOrder: -1 })
        .select('displayOrder')
        .lean();

    return lastFolder ? lastFolder.displayOrder + 1 : 0;
};

const ensureParentFolder = async (roomId, parentFolderId) => {
    if (!parentFolderId) return { folder: null };

    const folder = await Folder.findById(parentFolderId);
    if (!folder || !folder.isActive) {
        return { error: { status: 404, message: 'Carpeta padre no encontrada', code: 'PARENT_FOLDER_NOT_FOUND' } };
    }

    if (!ensureFolderBelongsToRoom(folder, roomId)) {
        return { error: { status: 400, message: 'La carpeta padre no pertenece a la sala indicada', code: 'INVALID_PARENT_FOLDER_ROOM' } };
    }

    return { folder };
};

const getRoomTreePayload = async (roomId) => {
    const [room, folders, files] = await Promise.all([
        Room.findById(roomId).select('roomName roomCode').lean(),
        Folder.find({ roomId, isActive: true }).sort({ displayOrder: 1, folderName: 1 }).lean(),
        File.find({ roomId, isActive: true }).sort({ displayOrder: 1, fileName: 1 }).lean(),
    ]);

    return buildFileExplorerTree({ room, folders, files });
};

export const createFolder = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { roomId, folderName, parentFolderId, displayOrder } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        if (!roomId || !folderName) {
            return res.status(400).json({
                success: false,
                message: 'roomId y folderName son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const room = await Room.findById(roomId).select('_id roomStatus');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Sala no encontrada', error: 'ROOM_NOT_FOUND' });
        }

        if (room.roomStatus !== 'ACTIVA') {
            return res.status(403).json({
                success: false,
                message: 'No se pueden crear carpetas en salas que no estan activas',
                error: 'ROOM_NOT_ACTIVE',
            });
        }

        const nameValidation = validateFolderName(folderName);
        if (!nameValidation.valid) {
            return res.status(400).json({ success: false, message: nameValidation.message, error: 'INVALID_FOLDER_NAME' });
        }

        const normalizedParentFolderId = normalizeOptionalObjectId(parentFolderId);
        if (parentFolderId && !normalizedParentFolderId) {
            return res.status(400).json({ success: false, message: 'parentFolderId invalido', error: 'INVALID_PARENT_FOLDER_ID' });
        }

        const parentCheck = await ensureParentFolder(roomId, normalizedParentFolderId);
        if (parentCheck.error) {
            return res.status(parentCheck.error.status).json({
                success: false,
                message: parentCheck.error.message,
                error: parentCheck.error.code,
            });
        }

        const folder = await Folder.create({
            roomId,
            folderName: String(folderName).trim(),
            parentFolderId: normalizedParentFolderId,
            createdByUserId: userId,
            lastModifiedByUserId: userId,
            displayOrder:
                displayOrder !== undefined
                    ? displayOrder
                    : await getNextFolderDisplayOrder(roomId, normalizedParentFolderId),
        });

        return res.status(201).json({
            success: true,
            message: 'Carpeta creada exitosamente',
            data: folder,
        });
    } catch (error) {
        console.error('createFolder error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una carpeta con ese nombre en la misma ubicacion',
                error: 'FOLDER_ALREADY_EXISTS',
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando la carpeta',
            error: 'CREATE_FOLDER_ERROR',
        });
    }
};

export const getFoldersByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId es obligatorio', error: 'MISSING_ROOM_ID' });
        }

        const folders = await Folder.find({ roomId, isActive: true })
            .sort({ displayOrder: 1, folderName: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Carpetas obtenidas exitosamente',
            count: folders.length,
            data: folders,
        });
    } catch (error) {
        console.error('getFoldersByRoom error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo carpetas de la sala',
            error: 'GET_FOLDERS_BY_ROOM_ERROR',
        });
    }
};

export const getFolderById = async (req, res) => {
    try {
        const { folderId } = req.params;
        const folder = await Folder.findById(folderId).lean();

        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        return res.status(200).json({
            success: true,
            message: 'Carpeta obtenida exitosamente',
            data: folder,
        });
    } catch (error) {
        console.error('getFolderById error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo la carpeta',
            error: 'GET_FOLDER_ERROR',
        });
    }
};

export const getRoomTree = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId es obligatorio', error: 'MISSING_ROOM_ID' });
        }

        const payload = await getRoomTreePayload(roomId);

        return res.status(200).json({
            success: true,
            message: 'Arbol de archivos obtenido exitosamente',
            data: payload,
        });
    } catch (error) {
        console.error('getRoomTree error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo el arbol de archivos',
            error: 'GET_ROOM_TREE_ERROR',
        });
    }
};

export const renameFolder = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { folderId } = req.params;
        const { folderName } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        const nameValidation = validateFolderName(folderName);
        if (!nameValidation.valid) {
            return res.status(400).json({ success: false, message: nameValidation.message, error: 'INVALID_FOLDER_NAME' });
        }

        const folder = await Folder.findByIdAndUpdate(
            folderId,
            {
                folderName: String(folderName).trim(),
                lastModifiedAt: new Date(),
                lastModifiedByUserId: userId,
            },
            { new: true, runValidators: true }
        );

        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        return res.status(200).json({
            success: true,
            message: 'Carpeta renombrada exitosamente',
            data: folder,
        });
    } catch (error) {
        console.error('renameFolder error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una carpeta con ese nombre en la misma ubicacion',
                error: 'FOLDER_ALREADY_EXISTS',
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || 'Error renombrando la carpeta',
            error: 'RENAME_FOLDER_ERROR',
        });
    }
};

export const moveFolder = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { folderId } = req.params;
        const { parentFolderId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        const normalizedParentFolderId = normalizeOptionalObjectId(parentFolderId);
        if (parentFolderId && !normalizedParentFolderId) {
            return res.status(400).json({ success: false, message: 'parentFolderId invalido', error: 'INVALID_PARENT_FOLDER_ID' });
        }

        const parentCheck = await ensureParentFolder(folder.roomId, normalizedParentFolderId);
        if (parentCheck.error) {
            return res.status(parentCheck.error.status).json({
                success: false,
                message: parentCheck.error.message,
                error: parentCheck.error.code,
            });
        }

        const createsCycle = await ensureFolderIsNotInsideItself(folderId, normalizedParentFolderId);
        if (createsCycle) {
            return res.status(400).json({
                success: false,
                message: 'No se puede mover una carpeta dentro de si misma o de una subcarpeta',
                error: 'INVALID_FOLDER_MOVE',
            });
        }

        folder.parentFolderId = normalizedParentFolderId;
        folder.lastModifiedAt = new Date();
        folder.lastModifiedByUserId = userId;
        await folder.save();

        return res.status(200).json({
            success: true,
            message: 'Carpeta movida exitosamente',
            data: folder,
        });
    } catch (error) {
        console.error('moveFolder error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error moviendo la carpeta',
            error: 'MOVE_FOLDER_ERROR',
        });
    }
};

export const deleteFolder = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { folderId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        const folder = await Folder.findById(folderId).lean();
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        const folderIds = await collectDescendantFolderIds(folderId);

        await Promise.all([
            Folder.updateMany(
                { _id: { $in: folderIds } },
                {
                    isActive: false,
                    lastModifiedAt: new Date(),
                    lastModifiedByUserId: userId,
                }
            ),
            File.updateMany(
                { parentFolderId: { $in: folderIds } },
                {
                    isActive: false,
                    lastModifiedAt: new Date(),
                    lastModifiedByUserId: userId,
                }
            ),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Carpeta eliminada exitosamente',
            affectedFolderIds: folderIds,
        });
    } catch (error) {
        console.error('deleteFolder error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la carpeta',
            error: 'DELETE_FOLDER_ERROR',
        });
    }
};

export const restoreFolder = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { folderId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        if (folder.parentFolderId) {
            const parentFolder = await Folder.findById(folder.parentFolderId).select('isActive').lean();
            if (parentFolder && !parentFolder.isActive) {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede restaurar una carpeta cuyo padre sigue inactivo',
                    error: 'PARENT_FOLDER_INACTIVE',
                });
            }
        }

        const folderIds = await collectDescendantFolderIds(folderId);

        await Promise.all([
            Folder.updateMany(
                { _id: { $in: folderIds } },
                {
                    isActive: true,
                    lastModifiedAt: new Date(),
                    lastModifiedByUserId: userId,
                }
            ),
            File.updateMany(
                { parentFolderId: { $in: folderIds } },
                {
                    isActive: true,
                    lastModifiedAt: new Date(),
                    lastModifiedByUserId: userId,
                }
            ),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Carpeta restaurada exitosamente',
            affectedFolderIds: folderIds,
        });
    } catch (error) {
        console.error('restoreFolder error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error restaurando la carpeta',
            error: 'RESTORE_FOLDER_ERROR',
        });
    }
};

export const deleteFolderPermanently = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { folderId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED' });
        }

        const folder = await Folder.findById(folderId).select('_id').lean();
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        const folderIds = await collectDescendantFolderIds(folderId);

        await Promise.all([
            File.deleteMany({ parentFolderId: { $in: folderIds } }),
            Folder.deleteMany({ _id: { $in: folderIds } }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Carpeta eliminada permanentemente',
            affectedFolderIds: folderIds,
        });
    } catch (error) {
        console.error('deleteFolderPermanently error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la carpeta permanentemente',
            error: 'DELETE_FOLDER_PERMANENTLY_ERROR',
        });
    }
};

export const exportFolder = async (req, res) => {
    try {
        const { folderId } = req.params;

        if (!isValidObjectId(folderId)) {
            return res.status(400).json({ success: false, message: 'folderId invalido', error: 'INVALID_FOLDER_ID' });
        }

        const folder = await Folder.findById(folderId).lean();
        if (!folder || !folder.isActive) {
            return res.status(404).json({ success: false, message: 'Carpeta no encontrada', error: 'FOLDER_NOT_FOUND' });
        }

        const room = await Room.findById(folder.roomId).select('roomName roomCode').lean();
        const descendantIds = await collectDescendantFolderIds(folderId);
        const [folders, files] = await Promise.all([
            Folder.find({ _id: { $in: descendantIds }, isActive: true }).lean(),
            File.find({ parentFolderId: { $in: descendantIds }, isActive: true }).lean(),
        ]);

        const archive = buildZipArchive(
            buildExportEntries({
                folders,
                files,
                roomName: folder.folderName || room?.roomName || room?.roomCode || 'synapse-folder',
            })
        );

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${String(folder.folderName || 'carpeta').trim()}.zip"`);
        return res.status(200).send(archive);
    } catch (error) {
        console.error('exportFolder error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error exportando la carpeta',
            error: 'EXPORT_FOLDER_ERROR',
        });
    }
};

export const exportRoomTree = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findById(roomId).select('roomName roomCode').lean();

        if (!room) {
            return res.status(404).json({ success: false, message: 'Sala no encontrada', error: 'ROOM_NOT_FOUND' });
        }

        const [folders, files] = await Promise.all([
            Folder.find({ roomId, isActive: true }).lean(),
            File.find({ roomId, isActive: true }).lean(),
        ]);

        const archive = buildZipArchive(
            buildExportEntries({
                folders,
                files,
                roomName: room.roomName || room.roomCode || 'synapse-room',
            })
        );

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${String(room.roomName || room.roomCode || 'sala').trim()}.zip"`);
        return res.status(200).send(archive);
    } catch (error) {
        console.error('exportRoomTree error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error exportando la sala',
            error: 'EXPORT_ROOM_TREE_ERROR',
        });
    }
};
