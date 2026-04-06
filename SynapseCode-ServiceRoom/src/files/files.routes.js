'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createFile,
    getFiles,
    getFilesByUser,
    getFilesByRoom,
    getFileById,
    updateFile,
    updateFileContent,
    deleteFile,
    restoreFile,
    deleteFilePermanently,
    renameFile,
    toggleReadOnly,
    reorderFiles,
    duplicateFile,
} from './files.controller.js';

const router = Router();

// CRUD básico
router.post('/', validateJWT, createFile);
router.get('/', validateJWT, getFiles);
router.put('/:fileId', validateJWT, updateFile);
router.delete('/:fileId', validateJWT, deleteFile);

// Obtener archivos por usuario/sala
router.get('/user/files', validateJWT, getFilesByUser);
router.get('/room/:roomId', validateJWT, getFilesByRoom);
router.get('/:fileId', validateJWT, getFileById);

// Operaciones especiales
router.put('/:fileId/content', validateJWT, updateFileContent);
router.put('/:fileId/rename', validateJWT, renameFile);
router.put('/:fileId/read-only', validateJWT, toggleReadOnly);
router.put('/:fileId/restore', validateJWT, restoreFile);
router.post('/:fileId/duplicate', validateJWT, duplicateFile);
router.delete('/:fileId/permanent', validateJWT, deleteFilePermanently);
router.post('/reorder', validateJWT, reorderFiles);

export default router;