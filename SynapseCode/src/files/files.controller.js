'use strict'
import File from './files.model.js';
import Room from '../rooms/rooms.model.js';
import CodeSession from '../codeSessions/codeSessions.model.js';
import {
    detectLanguageFromExtension,
    buildDefaultCodeTemplate,
    validateFileName,
    validateFileExtension,
    generateUniqueFileName,
    getNextDisplayOrder,
    validateCodeSize,
    formatFileSize,
} from '../../helpers/files-helpers.js';
import { normalizeCodeContent } from '../../helpers/code-normalizer.js';

const enrichFilesWithRoom = async (files) => {
    const list = files.map((file) => (typeof file.toObject === 'function' ? file.toObject() : file));
    if (!list.length) return list;

    const roomIds = [...new Set(list.map((f) => String(f.roomId)).filter(Boolean))];
    const rooms = await Room.find({ _id: { $in: roomIds } })
        .select('roomName roomCode')
        .lean();

    const roomsById = new Map(rooms.map((room) => [String(room._id), room]));

    return list.map((file) => {
        const room = roomsById.get(String(file.roomId));
        return {
            ...file,
            roomName: room?.roomName || null,
            roomCode: room?.roomCode || null,
            fullFileName: `${file.fileName}.${file.fileExtension}`,
        };
    });
};

/**
 * Crear nuevo archivo en una sala
 */
export const createFile = async (req, res) => {
    try {
        const { roomId, fileName, fileExtension, displayOrder } = req.body;

        // Validaciones básicas
        if (!roomId || !fileName || !fileExtension) {
            return res.status(400).json({
                success: false,
                message: 'roomId, fileName y fileExtension son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Validar nombre del archivo
        const nameValidation = validateFileName(fileName);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                message: nameValidation.message,
                error: 'INVALID_FILE_NAME',
            });
        }

        // Validar extensión
        const extensionValidation = validateFileExtension(fileExtension);
        if (!extensionValidation.valid) {
            return res.status(400).json({
                success: false,
                message: extensionValidation.message,
                error: 'INVALID_FILE_EXTENSION',
            });
        }

        // Verificar si ya existe un archivo con ese nombre y extensión
        const existingFile = await File.findOne({
            roomId,
            fileName: fileName.trim(),
            fileExtension: fileExtension.toLowerCase(),
            isActive: true,
        });

        if (existingFile) {
            return res.status(409).json({
                success: false,
                message: `Ya existe un archivo llamado '${fileName}.${fileExtension}' en esta sala`,
                error: 'FILE_ALREADY_EXISTS',
            });
        }

        // Obtener userId del token
        const createdByUserId = req.user.userId;

        // Detectar lenguaje automáticamente
        const language = detectLanguageFromExtension(fileExtension);

        // Obtener siguiente displayOrder si no se proporciona
        const order = displayOrder !== undefined 
            ? displayOrder 
            : await getNextDisplayOrder(File, roomId);

        const defaultCode = buildDefaultCodeTemplate({
            language,
            fileName: fileName.trim(),
            fileExtension: fileExtension.toLowerCase(),
        });

        // Crear archivo
        const file = await File.create({
            roomId,
            fileName: fileName.trim(),
            fileExtension: fileExtension.toLowerCase(),
            language,
            // El contenido inicial se mantiene vacío; el código se guarda en codeSessions.
            currentCode: defaultCode,
            createdByUserId,
            lastModifiedByUserId: createdByUserId,
            displayOrder: order,
            createdAt: new Date(),
            lastModifiedAt: new Date(),
        });

        try {
            await CodeSession.create({
                fileId: file._id,
                roomId,
                language,
                code: defaultCode,
                savedByUserId: createdByUserId,
                version: 1,
                saveType: 'MANUAL',
                wasExecuted: false,
                savedAt: new Date(),
            });
        } catch (sessionError) {
            await File.findByIdAndDelete(file._id);
            throw sessionError;
        }

        return res.status(201).json({
            success: true,
            message: 'Archivo creado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('createFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error creando el archivo',
            error: 'CREATE_FILE_ERROR',
        });
    }
};

// Obtener todos los archivos de una sala
export const getFilesByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { includeInactive } = req.query;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        // Filtro por archivos activos
        const filter = { roomId };
        if (includeInactive !== 'true') {
            filter.isActive = true;
        }

        const files = await File.find(filter).sort({ displayOrder: 1, fileName: 1 }).lean();
        const data = await enrichFilesWithRoom(files);

        return res.status(200).json({
            success: true,
            message: 'Archivos obtenidos exitosamente',
            count: data.length,
            data,
        });
    } catch (error) {
        console.error('getFilesByRoom error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo archivos de la sala',
            error: 'GET_FILES_ERROR',
        });
    }
};

// Obtener un archivo por ID
export const getFileById = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id).lean();

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        const [enrichedFile] = await enrichFilesWithRoom([file]);

        return res.status(200).json({
            success: true,
            message: 'Archivo obtenido exitosamente',
            data: enrichedFile,
        });
    } catch (error) {
        console.error('getFileById error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo el archivo',
            error: 'GET_FILE_ERROR',
        });
    }
};

// Actualizar el contenido del archivo (crea una nueva sesión de código)
export const updateFileContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentCode } = req.body;
        const normalizedCurrentCode = normalizeCodeContent(currentCode);

        if (normalizedCurrentCode === undefined) {
            return res.status(400).json({
                success: false,
                message: 'currentCode es obligatorio',
                error: 'MISSING_CURRENT_CODE',
            });
        }

        // Validar tamaño del código
        const sizeValidation = validateCodeSize(normalizedCurrentCode);
        if (!sizeValidation.valid) {
            return res.status(400).json({
                success: false,
                message: sizeValidation.message,
                error: 'CODE_SIZE_EXCEEDED',
            });
        }

        // Obtener userId del token
        const lastModifiedByUserId = req.user.userId;

        const file = await File.findByIdAndUpdate(
            id,
            {
                currentCode: normalizedCurrentCode,
                lastModifiedByUserId,
                lastModifiedAt: new Date(),
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Contenido del archivo actualizado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('updateFileContent error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando el contenido del archivo',
            error: 'UPDATE_FILE_CONTENT_ERROR',
        });
    }
};

// Renombrar archivo
export const renameFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { fileName, fileExtension } = req.body;

        if (!fileName && !fileExtension) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fileName o fileExtension',
                error: 'MISSING_FIELDS',
            });
        }

        const updateData = {
            lastModifiedAt: new Date(),
            lastModifiedByUserId: req.user.userId,
        };

        // Validar y actualizar nombre si se proporciona
        if (fileName) {
            const nameValidation = validateFileName(fileName);
            if (!nameValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: nameValidation.message,
                    error: 'INVALID_FILE_NAME',
                });
            }
            updateData.fileName = fileName.trim();
        }

        // Validar y actualizar extensión si se proporciona
        if (fileExtension) {
            const extensionValidation = validateFileExtension(fileExtension);
            if (!extensionValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: extensionValidation.message,
                    error: 'INVALID_FILE_EXTENSION',
                });
            }
            updateData.fileExtension = fileExtension.toLowerCase();
            updateData.language = detectLanguageFromExtension(fileExtension);
        }

        const file = await File.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo renombrado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('renameFile error:', error);
        
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un archivo con ese nombre y extension en esta sala',
                error: 'DUPLICATE_FILE_NAME',
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || 'Error renombrando el archivo',
            error: 'RENAME_FILE_ERROR',
        });
    }
};

// Eliminar archivo
export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findByIdAndUpdate(
            id,
            {
                isActive: false,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: req.user.userId,
            },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo eliminado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('deleteFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando el archivo',
            error: 'DELETE_FILE_ERROR',
        });
    }
};

// Restaurar archivo eliminado
export const restoreFile = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findByIdAndUpdate(
            id,
            {
                isActive: true,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: req.user.userId,
            },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo restaurado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('restoreFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error restaurando el archivo',
            error: 'RESTORE_FILE_ERROR',
        });
    }
};

// Eliminar archivo permanentemente
export const deleteFilePermanently = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findByIdAndDelete(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo eliminado permanentemente',
            data: file,
        });
    } catch (error) {
        console.error('deleteFilePermanently error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando el archivo permanentemente',
            error: 'DELETE_FILE_PERMANENTLY_ERROR',
        });
    }
};

// Renombrar archivos
export const reorderFiles = async (req, res) => {
    try {
        const { fileOrders } = req.body;

        if (!Array.isArray(fileOrders) || fileOrders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'fileOrders debe ser un array con al menos un elemento',
                error: 'INVALID_FILE_ORDERS',
            });
        }

        // Actualizar displayOrder de cada archivo
        const updatePromises = fileOrders.map(({ fileId, displayOrder }) =>
            File.findByIdAndUpdate(
                fileId,
                { displayOrder, lastModifiedAt: new Date() },
                { new: true }
            )
        );

        const updatedFiles = await Promise.all(updatePromises);

        return res.status(200).json({
            success: true,
            message: 'Archivos reordenados exitosamente',
            data: updatedFiles,
        });
    } catch (error) {
        console.error('reorderFiles error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error reordenando archivos',
            error: 'REORDER_FILES_ERROR',
        });
    }
};

// Duplicar archivo
export const duplicateFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener archivo original
        const originalFile = await File.findById(id);

        if (!originalFile) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        // Obtener archivos existentes para generar nombre único
        const existingFiles = await File.find({
            roomId: originalFile.roomId,
            isActive: true,
        });
        const existingFileNames = existingFiles.map(f => f.fileName);

        // Generar nombre único
        const newFileName = generateUniqueFileName(
            `${originalFile.fileName}_copy`,
            existingFileNames
        );

        // Obtener siguiente displayOrder
        const displayOrder = await getNextDisplayOrder(File, originalFile.roomId);

        // Crear archivo duplicado
        const duplicatedFile = await File.create({
            roomId: originalFile.roomId,
            fileName: newFileName,
            fileExtension: originalFile.fileExtension,
            language: originalFile.language,
            currentCode: originalFile.currentCode,
            createdByUserId: req.user.userId,
            lastModifiedByUserId: req.user.userId,
            displayOrder,
            isReadOnly: originalFile.isReadOnly,
        });

        return res.status(201).json({
            success: true,
            message: 'Archivo duplicado exitosamente',
            data: duplicatedFile,
        });
    } catch (error) {
        console.error('duplicateFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error duplicando el archivo',
            error: 'DUPLICATE_FILE_ERROR',
        });
    }
};

// Marcar archivo como solo lectura o editable
export const toggleReadOnly = async (req, res) => {
    try {
        const { id } = req.params;
        const { isReadOnly } = req.body;

        if (typeof isReadOnly !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isReadOnly debe ser un valor booleano',
                error: 'INVALID_READ_ONLY_VALUE',
            });
        }

        const file = await File.findByIdAndUpdate(
            id,
            {
                isReadOnly,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: req.user.userId,
            },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: `Archivo marcado como ${isReadOnly ? 'solo lectura' : 'editable'}`,
            data: file,
        });
    } catch (error) {
        console.error('toggleReadOnly error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando estado de solo lectura',
            error: 'TOGGLE_READ_ONLY_ERROR',
        });
    }
};
