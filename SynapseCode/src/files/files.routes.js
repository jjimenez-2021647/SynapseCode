'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/checkValidators.js';
import {
    requireFileRoomAccessByBodyRoomId,
    requireFileRoomAccessByParamRoomId,
    requireFileRoomAccessByFileIdParam,
    requireFileRoomAccessForReorder,
} from '../../middlewares/validate-file-room-access.js';
import {
    validateFileExtensionMiddleware,
    validateFileNameMiddleware,
} from '../../middlewares/validateFileExtension.js';
import {
    createFile,
    getFilesByRoom,
    getFilesByUser,
    getFileById,
    updateFileContent,
    renameFile,
    deleteFile,
    restoreFile,
    deleteFilePermanently,
    reorderFiles,
    duplicateFile,
    toggleReadOnly,
} from './files.controller.js';
import {
    requireFileRoomAccessByParamRoomIdOrAdmin,
    requireFileRoomAccessByFileIdParamOrAdmin,
} from '../../middlewares/validate-file-room-access.js';

const router = Router();

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     summary: Obtener archivos creados por el usuario autenticado
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de archivos del usuario }
 */
router.get('/', validateJWT, requireRole('USER_ROLE'), getFilesByUser);

/**
 * @swagger
 * /api/v1/files:
 *   post:
 *     summary: Crear un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId: { type: string, description: "ID de la sala" }
 *               fileName: { type: string, description: "Nombre del archivo" }
 *               fileExtension: { type: string, description: "Extensión del archivo" }
 *     responses:
 *       201: { description: Archivo creado }
 *       400: { description: Datos inválidos }
 */
router.post(
    '/',
    validateJWT,
    requireRole('USER_ROLE'),
    requireFileRoomAccessByBodyRoomId,
    validateFileNameMiddleware,
    validateFileExtensionMiddleware,
    checkValidators,
    createFile
);

/**
 * @swagger
 * /api/v1/files/room/{roomId}:
 *   get:
 *     summary: Obtener archivos de una sala
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de archivos }
 *       404: { description: Sala no encontrada }
 */
router.get('/room/:roomId', validateJWT, requireRole('USER_ROLE','ADMIN_ROLE'), requireFileRoomAccessByParamRoomIdOrAdmin, getFilesByRoom);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   get:
 *     summary: Obtener archivo por ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Datos del archivo }
 *       404: { description: Archivo no encontrado }
 */
router.get('/:id', validateJWT, requireFileRoomAccessByFileIdParam, getFileById);

/**
 * @swagger
 * /api/v1/files/{id}/content:
 *   put:
 *     summary: Actualizar nombre y extensión del archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName: { type: string, description: "Nuevo nombre del archivo" }
 *               fileExtension: { type: string, description: "Nueva extensión del archivo" }
 *     responses:
 *       200: { description: Archivo actualizado }
 *       404: { description: Archivo no encontrado }
 */
router.put('/:id/content', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, updateFileContent);

/**
 * @swagger
 * /api/v1/files/{id}/rename:
 *   patch:
 *     summary: Renombrar archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: "Nuevo nombre" }
 *     responses:
 *       200: { description: Archivo renombrado }
 *       404: { description: Archivo no encontrado }
 */
router.patch(
    '/:id/rename',
    validateJWT,
    requireRole('USER_ROLE'),
    requireFileRoomAccessByFileIdParam,
    validateFileNameMiddleware,
    checkValidators,
    renameFile
);

/**
 * @swagger
 * /api/v1/files/{id}/readonly:
 *   patch:
 *     summary: Alternar modo solo lectura
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Modo cambiado }
 *       404: { description: Archivo no encontrado }
 */
router.patch('/:id/readonly', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, toggleReadOnly);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     summary: Eliminar archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivo eliminado }
 *       404: { description: Archivo no encontrado }
 */
router.delete('/:id', validateJWT, requireRole('USER_ROLE','ADMIN_ROLE'), requireFileRoomAccessByFileIdParam, deleteFile);

/**
 * @swagger
 * /api/v1/files/{id}/restore:
 *   patch:
 *     summary: Restaurar archivo eliminado
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivo restaurado }
 *       404: { description: Archivo no encontrado }
 */
router.patch('/:id/restore', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, restoreFile);

/**
 * @swagger
 * /api/v1/files/{id}/permanent:
 *   delete:
 *     summary: Eliminar archivo permanentemente
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivo eliminado permanentemente }
 *       404: { description: Archivo no encontrado }
 */
router.delete('/:id/permanent', validateJWT, requireRole('USER_ROLE','ADMIN_ROLE'), requireFileRoomAccessByFileIdParamOrAdmin, deleteFilePermanently);

/**
 * @swagger
 * /api/v1/files/{id}/duplicate:
 *   post:
 *     summary: Duplicar archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Archivo duplicado }
 *       404: { description: Archivo no encontrado }
 */
router.post('/:id/duplicate', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, duplicateFile);

/**
 * @swagger
 * /api/v1/files/reorder:
 *   patch:
 *     summary: Reordenar archivos
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               files: { type: array, items: { type: string }, description: "Lista de IDs de archivos en orden" }
 *     responses:
 *       200: { description: Archivos reordenados }
 *       400: { description: Datos inválidos }
 */
router.patch('/reorder', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessForReorder, reorderFiles);

export default router;
