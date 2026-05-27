'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    createFolder,
    deleteFolder,
    deleteFolderPermanently,
    exportFolder,
    exportRoomTree,
    getFolderById,
    getFoldersByRoom,
    getRoomTree,
    moveFolder,
    renameFolder,
    restoreFolder,
} from './folders.controller.js';

const router = Router();

router.post('/', validateJWT, createFolder);
router.get('/room/:roomId', validateJWT, getFoldersByRoom);
router.get('/room/:roomId/tree', validateJWT, getRoomTree);
router.get('/room/:roomId/export', validateJWT, exportRoomTree);
router.get('/:folderId/export', validateJWT, exportFolder);
router.get('/:folderId', validateJWT, getFolderById);
router.put('/:folderId/rename', validateJWT, renameFolder);
router.put('/:folderId/move', validateJWT, moveFolder);
router.delete('/:folderId', validateJWT, deleteFolder);
router.put('/:folderId/restore', validateJWT, restoreFolder);
router.delete('/:folderId/permanent', validateJWT, deleteFolderPermanently);

export default router;
