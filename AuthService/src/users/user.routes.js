import { Router } from 'express';
import {
    updateUserRole,
    getUserRoles,
    getUsersByRole,
    listAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUserById,
    adminDeactivateUser,
} from './user.controller.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';

const router = Router();

// roles
router.put('/:userId/role', ...updateUserRole);
router.get('/:userId/roles', ...getUserRoles);
router.get('/by-role/:roleName', ...getUsersByRole);

// admin
router.get('/', ...listAllUsers);
router.post('/', upload.single('profilePicture'), handleUploadError, ...createUser);
router.patch('/deactivate/:userId', ...adminDeactivateUser);
router.put('/:userId', ...updateUser);
router.delete('/:userId', ...deleteUserById);
router.get('/:userId', ...getUserById);

export default router;
