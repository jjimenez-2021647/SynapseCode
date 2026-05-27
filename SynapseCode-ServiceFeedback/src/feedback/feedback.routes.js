'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    createComment,
    updateComment,
    deleteComment,
    updateCommentStatus,
    toggleVote,
    listComments,
    getComment
} from './feedback.controller.js';

const router = Router();

router.get('/comments', listComments);
router.get('/comments/:commentId', getComment);
router.post('/comments', validateJWT, createComment);
router.put('/comments/:commentId', validateJWT, updateComment);
router.put('/comments/:commentId/status', validateJWT, requireRole('ADMIN_ROLE'), updateCommentStatus);
router.delete('/comments/:commentId', validateJWT, deleteComment);
router.post('/comments/:commentId/vote', validateJWT, toggleVote);

export default router;
