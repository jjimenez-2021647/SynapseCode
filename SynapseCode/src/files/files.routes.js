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

const router = Router();

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

router.get('/room/:roomId', validateJWT, requireFileRoomAccessByParamRoomId, getFilesByRoom);
router.get('/:id', validateJWT, requireFileRoomAccessByFileIdParam, getFileById);

router.put('/:id/content', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, updateFileContent);

router.patch(
    '/:id/rename',
    validateJWT,
    requireRole('USER_ROLE'),
    requireFileRoomAccessByFileIdParam,
    validateFileNameMiddleware,
    checkValidators,
    renameFile
);

router.patch('/:id/readonly', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, toggleReadOnly);

router.delete('/:id', validateJWT, requireRole('USER_ROLE', 'ADMIN_ROLE'), requireFileRoomAccessByFileIdParam, deleteFile);
router.patch('/:id/restore', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, restoreFile);
router.delete('/:id/permanent', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, deleteFilePermanently);

router.post('/:id/duplicate', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessByFileIdParam, duplicateFile);
router.patch('/reorder', validateJWT, requireRole('USER_ROLE'), requireFileRoomAccessForReorder, reorderFiles);

export default router;
