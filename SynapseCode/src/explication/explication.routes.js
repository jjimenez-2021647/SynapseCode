'use strict'
import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import {
    explainFile,
    listExplanations,
    getExplanationById,
    deleteExplanation,
} from './explication.controller.js';
import Explanation from './explication.model.js';
import { requireFileRoomAccessByFileIdParam } from '../../middlewares/validate-file-room-access.js';

const router = Router();

/**
 * @swagger
 * /api/v1/explication/file/{idFile}:
 *   get:
 *     summary: Listar todas las explicaciones de un archivo
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idFile
 *         required: true
 *         schema: { type: string }
 *         description: "ID del archivo"
 *       - in: query
 *         name: version
 *         required: false
 *         schema: { type: number }
 *         description: "(Opcional) filtrar por versión"
 *     responses:
 *       200: { description: Lista de explicaciones del archivo }
 *       403: { description: No pertenece a la sala }
 *       404: { description: Archivo no encontrado }
 *   post:
 *     summary: Genera una nueva explicación del código
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idFile
 *         required: true
 *         schema: { type: string }
 *         description: "ID del archivo cuya explicación se desea generar"
 *     responses:
 *       200: { description: Explicación generada y guardada }
 *       403: { description: No pertenece a la sala }
 *       404: { description: Archivo no encontrado }
 */
router.get(
    '/file/:idFile',
    validateJWT,
    requireRole('USER_ROLE','ADMIN_ROLE'),
    (req, res, next) => {
        req.params.id = req.params.idFile;
        req.query.fileId = req.params.idFile;
        next();
    },
    requireFileRoomAccessByFileIdParam,
    listExplanations
);

router.post(
    '/file/:idFile',
    validateJWT,
    requireRole('USER_ROLE','ADMIN_ROLE'),
    (req, res, next) => {
        req.params.id = req.params.idFile;
        req.query.fileId = req.params.idFile;
        next();
    },
    requireFileRoomAccessByFileIdParam,
    explainFile
);
// middleware que carga la explicación y exige que el usuario pertenezca a la sala del archivo
const loadExplanationAndAuth = async (req, res, next) => {
    try {
        const { id } = req.params; // explanation id
        const explanation = await Explanation.findById(id).lean();
        if (!explanation) {
            return res.status(404).json({
                success: false,
                message: 'Explicación no encontrada',
                error: 'EXPLANATION_NOT_FOUND',
            });
        }
        req.explanation = explanation;
        // ahora verificar acceso por fileId
        req.params.id = explanation.fileId;
        return requireFileRoomAccessByFileIdParam(req, res, (err) => {
            // restaurar id original para rutas posteriores
            req.params.id = id;
            if (err) return;
            next();
        });
    } catch (error) {
        console.error('loadExplanationAndAuth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validando acceso a la explicación',
            error: 'VALIDATE_EXPLANATION_ACCESS_ERROR',
        });
    }
};



/**
 * @swagger
 * /api/v1/explication/{id}:
 *   get:
 *     summary: Obtener explicación por su ID
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID de la explicación"
 *     responses:
 *       200: { description: Explicación encontrada }
 *       403: { description: No pertenece a la sala }
 *       404: { description: Explicación no encontrada }
 */
router.get(
    '/:id',
    validateJWT,
    requireRole('USER_ROLE','ADMIN_ROLE'),
    loadExplanationAndAuth,
    getExplanationById
);

/**
 * @swagger
 * /api/v1/explication/{id}:
 *   delete:
 *     summary: Eliminar una explicación
 *     tags: [Explication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: "ID de la explicación a eliminar"
 *     responses:
 *       200: { description: Explicación eliminada }
 *       403: { description: No pertenece a la sala }
 *       404: { description: Explicación no encontrada }
 */
router.delete(
    '/:id',
    validateJWT,
    requireRole('USER_ROLE','ADMIN_ROLE'),
    loadExplanationAndAuth,
    deleteExplanation
);
export default router;
