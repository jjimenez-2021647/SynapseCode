'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/checkValidators.js';
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
    validateFileNameMiddleware,
    validateFileExtensionMiddleware,
    checkValidators,
    createFile
);

router.get('/room/:roomId', validateJWT, getFilesByRoom);
router.get('/:id', validateJWT, getFileById);

router.put('/:id/content', validateJWT, requireRole('USER_ROLE'), updateFileContent);

router.patch(
    '/:id/rename',
    validateJWT,
    requireRole('USER_ROLE'),
    validateFileNameMiddleware,
    checkValidators,
    renameFile
);

router.patch('/:id/readonly', validateJWT, requireRole('USER_ROLE'), toggleReadOnly);

router.delete('/:id', validateJWT, requireRole('USER_ROLE'), deleteFile);
router.patch('/:id/restore', validateJWT, requireRole('USER_ROLE'), restoreFile);
router.delete('/:id/permanent', validateJWT, requireRole('USER_ROLE'), deleteFilePermanently);

router.post('/:id/duplicate', validateJWT, requireRole('USER_ROLE'), duplicateFile);
router.patch('/reorder', validateJWT, requireRole('USER_ROLE'), reorderFiles);

export default router;