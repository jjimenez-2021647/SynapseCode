'use strict'
import File from './files.model.js';
import Room from '../rooms/rooms.model.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

// Mapeo de roomLanguage a extensiones permitidas
const LANGUAGE_EXTENSIONS = {
    JAVA: ['java'],
    PYTHON: ['py'],
    JAVASCRIPT: ['js', 'jsx'],
    HTML_CSS: ['html', 'css'],
    CSHARP: ['cs'],
};

const isExtensionAllowed = (fileExtension, roomLanguage) => {
    // Si roomLanguage es null (multilenguaje), permite todas
    if (!roomLanguage) return true;
    
    const allowedExtensions = LANGUAGE_EXTENSIONS[roomLanguage];
    return allowedExtensions && allowedExtensions.includes(fileExtension.toLowerCase());
};

/**
 * Crear nuevo archivo
 */
export const createFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { roomId, fileName, fileExtension, language, currentCode } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (!roomId || !fileName || !fileExtension) {
            return res.status(400).json({
                success: false,
                message: 'roomId, fileName y fileExtension son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Verificar que sala existe
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada',
                error: 'ROOM_NOT_FOUND',
            });
        }

        // Validar que la extensión sea compatible con el tipo de sala
        if (!isExtensionAllowed(fileExtension, room.roomLanguage)) {
            const allowedExts = room.roomLanguage 
                ? LANGUAGE_EXTENSIONS[room.roomLanguage].join(', ')
                : 'java, py, js, jsx, html, css, cs';
            
            return res.status(400).json({
                success: false,
                message: `Esta sala requiere archivos con extensión: ${allowedExts}`,
                error: 'INVALID_FILE_EXTENSION_FOR_ROOM',
            });
        }

        // Verificar si ya existe un archivo con ese nombre
        const existingFile = await File.findOne({
            roomId,
            fileName: fileName.trim(),
            fileExtension: fileExtension.toLowerCase(),
            isActive: true,
        });

        if (existingFile) {
            return res.status(409).json({
                success: false,
                message: `Ya existe un archivo '${fileName}.${fileExtension}' en esta sala`,
                error: 'FILE_ALREADY_EXISTS',
            });
        }

        const file = await File.create({
            roomId,
            fileName: fileName.trim(),
            fileExtension: fileExtension.toLowerCase(),
            language: language || 'JAVASCRIPT',
            currentCode: currentCode || '',
            createdByUserId: userId,
            lastModifiedByUserId: userId,
            isActive: true,
            isReadOnly: false,
        });

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

/**
 * Obtener archivos del usuario autenticado
 */
export const getFilesByUser = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const files = await File.find({ createdByUserId: userId, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Archivos del usuario obtenidos exitosamente',
            count: files.length,
            data: files,
        });
    } catch (error) {
        console.error('getFilesByUser error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo archivos del usuario',
            error: 'GET_FILES_BY_USER_ERROR',
        });
    }
};

/**
 * Obtener archivos de una sala
 */
export const getFilesByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId es obligatorio',
                error: 'MISSING_ROOM_ID',
            });
        }

        const files = await File.find({ roomId, isActive: true })
            .sort({ displayOrder: 1, fileName: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Archivos obtenidos exitosamente',
            count: files.length,
            data: files,
        });
    } catch (error) {
        console.error('getFilesByRoom error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo archivos de la sala',
            error: 'GET_FILES_BY_ROOM_ERROR',
        });
    }
};

/**
 * Obtener todos los archivos (usado internamente)
 */
export const getFiles = async (req, res) => {
    try {
        const { roomId } = req.query;
        const filters = { isActive: true };

        if (roomId) {
            filters.roomId = roomId;
        }

        const files = await File.find(filters).sort({ displayOrder: 1 }).lean();

        return res.status(200).json({
            success: true,
            count: files.length,
            data: files,
        });
    } catch (error) {
        console.error('getFiles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo archivos',
            error: 'GET_FILES_ERROR',
        });
    }
};

/**
 * Obtener archivo por ID
 */
export const getFileById = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findById(fileId).lean();

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo obtenido exitosamente',
            data: file,
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

/**
 * Actualizar contenido del archivo
 */
export const updateFileContent = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;
        const { currentCode, fileName, fileExtension } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const updates = {
            lastModifiedByUserId: userId,
            lastModifiedAt: new Date(),
        };

        if (currentCode !== undefined) updates.currentCode = currentCode;
        if (fileName) updates.fileName = fileName.trim();
        if (fileExtension) updates.fileExtension = fileExtension.toLowerCase();

        const file = await File.findByIdAndUpdate(fileId, updates, { new: true });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo actualizado exitosamente',
            data: file,
        });
    } catch (error) {
        console.error('updateFileContent error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando el archivo',
            error: 'UPDATE_FILE_ERROR',
        });
    }
};

/**
 * Actualizar archivo (compatibilidad)
 */
export const updateFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;
        const { currentCode, fileName } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const allowedUpdates = {};
        if (currentCode !== undefined) allowedUpdates.currentCode = currentCode;
        if (fileName !== undefined) allowedUpdates.fileName = fileName;
        allowedUpdates.lastModifiedByUserId = userId;
        allowedUpdates.lastModifiedAt = new Date();

        const file = await File.findByIdAndUpdate(fileId, allowedUpdates, { new: true });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Archivo actualizado',
            data: file,
        });
    } catch (error) {
        console.error('updateFile error:', error);
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'UPDATE_FILE_ERROR',
        });
    }
};

/**
 * Renombrar archivo
 */
export const renameFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;
        const { fileName, fileExtension } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (!fileName && !fileExtension) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar fileName o fileExtension',
                error: 'MISSING_FIELDS',
            });
        }

        const updates = {
            lastModifiedAt: new Date(),
            lastModifiedByUserId: userId,
        };

        if (fileName) updates.fileName = fileName.trim();
        if (fileExtension) updates.fileExtension = fileExtension.toLowerCase();

        const file = await File.findByIdAndUpdate(fileId, updates, { new: true });

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
        return res.status(400).json({
            success: false,
            message: error.message || 'Error renombrando el archivo',
            error: 'RENAME_FILE_ERROR',
        });
    }
};

/**
 * Alternar modo solo lectura
 */
export const toggleReadOnly = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;
        const { isReadOnly } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (typeof isReadOnly !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isReadOnly debe ser booleano',
                error: 'INVALID_READ_ONLY_VALUE',
            });
        }

        const file = await File.findByIdAndUpdate(
            fileId,
            {
                isReadOnly,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: userId,
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
            message: `Modo solo lectura ${isReadOnly ? 'activado' : 'desactivado'}`,
            data: file,
        });
    } catch (error) {
        console.error('toggleReadOnly error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error actualizando modo solo lectura',
            error: 'TOGGLE_READONLY_ERROR',
        });
    }
};

/**
 * Eliminar archivo (soft delete)
 */
export const deleteFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const file = await File.findByIdAndUpdate(
            fileId,
            {
                isActive: false,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: userId,
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

/**
 * Restaurar archivo eliminado
 */
export const restoreFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const file = await File.findByIdAndUpdate(
            fileId,
            {
                isActive: true,
                lastModifiedAt: new Date(),
                lastModifiedByUserId: userId,
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

/**
 * Eliminar archivo permanentemente
 */
export const deleteFilePermanently = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const file = await File.findByIdAndDelete(fileId);

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
            message: error.message || 'Error eliminando archivo permanentemente',
            error: 'DELETE_FILE_PERMANENTLY_ERROR',
        });
    }
};

/**
 * Reordenar archivos
 */
export const reorderFiles = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileOrders } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        if (!Array.isArray(fileOrders) || fileOrders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'fileOrders debe ser un array con al menos un elemento',
                error: 'INVALID_FILE_ORDERS',
            });
        }

        const updatePromises = fileOrders.map(({ fileId, displayOrder }) =>
            File.findByIdAndUpdate(
                fileId,
                { displayOrder, lastModifiedAt: new Date(), lastModifiedByUserId: userId },
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

/**
 * Duplicar archivo
 */
export const duplicateFile = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { fileId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const originalFile = await File.findById(fileId);

        if (!originalFile) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        const newFileName = `${originalFile.fileName}_copy`;
        const displayOrder = (originalFile.displayOrder || 0) + 1;

        const duplicatedFile = await File.create({
            roomId: originalFile.roomId,
            fileName: newFileName,
            fileExtension: originalFile.fileExtension,
            language: originalFile.language,
            currentCode: originalFile.currentCode,
            createdByUserId: userId,
            lastModifiedByUserId: userId,
            displayOrder,
            isActive: true,
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