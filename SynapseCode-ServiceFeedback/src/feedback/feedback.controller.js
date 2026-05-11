import FeedbackComment from './feedback-comment.model.js';
import FeedbackVote from './feedback-vote.model.js';

/**
 * Obtener el userId del request (soporta múltiples formatos)
 */
const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Crear un nuevo comentario
 * Solo usuarios con USER_ROLE o superior
 */
export const createComment = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no identificado',
                error: 'UNAUTHORIZED'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del comentario es requerido',
                error: 'MISSING_CONTENT'
            });
        }

        const comment = await FeedbackComment.create({
            userId,
            content: content.trim()
        });

        return res.status(201).json({
            success: true,
            message: 'Comentario creado exitosamente',
            data: {
                _id: comment._id,
                userId: comment.userId,
                content: comment.content,
                voteCount: comment.voteCount,
                status: comment.status,
                isEdited: comment.isEdited,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });
    } catch (error) {
        console.error('createComment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al crear el comentario',
            error: 'CREATE_COMMENT_ERROR'
        });
    }
};

/**
 * Editar un comentario
 * Solo el autor puede editar, y únicamente dentro de los 30 minutos posteriores a su creación
 */
export const updateComment = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { commentId } = req.params;
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no identificado',
                error: 'UNAUTHORIZED'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del comentario es requerido',
                error: 'MISSING_CONTENT'
            });
        }

        const comment = await FeedbackComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado',
                error: 'COMMENT_NOT_FOUND'
            });
        }

        // Verificar que sea el autor
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para editar este comentario',
                error: 'FORBIDDEN'
            });
        }

        // Verificar que sea dentro de los 30 minutos
        const createdTime = new Date(comment.createdAt).getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceMinutes = (currentTime - createdTime) / (1000 * 60);

        if (timeDifferenceMinutes > 30) {
            return res.status(400).json({
                success: false,
                message: 'El tiempo para editar este comentario ha expirado (máximo 30 minutos)',
                error: 'EDIT_TIME_EXPIRED'
            });
        }

        comment.content = content.trim();
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        return res.status(200).json({
            success: true,
            message: 'Comentario actualizado exitosamente',
            data: {
                _id: comment._id,
                userId: comment.userId,
                content: comment.content,
                voteCount: comment.voteCount,
                status: comment.status,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });
    } catch (error) {
        console.error('updateComment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar el comentario',
            error: 'UPDATE_COMMENT_ERROR'
        });
    }
};

/**
 * Eliminar un comentario (Soft Delete - cambiar a realizado)
 * El autor o un administrador puede eliminarlo
 */
export const deleteComment = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { commentId } = req.params;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no identificado',
                error: 'UNAUTHORIZED'
            });
        }

        const comment = await FeedbackComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado',
                error: 'COMMENT_NOT_FOUND'
            });
        }

        // Verificar permisos: autor o admin
        const isAuthor = comment.userId === userId;
        const isAdmin = userRole === 'ADMIN_ROLE';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este comentario',
                error: 'FORBIDDEN'
            });
        }

        // Soft delete: cambiar estado a realizado
        comment.status = 'realizado';
        await comment.save();

        return res.status(200).json({
            success: true,
            message: 'Comentario marcado como realizado'
        });
    } catch (error) {
        console.error('deleteComment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al eliminar el comentario',
            error: 'DELETE_COMMENT_ERROR'
        });
    }
};

/**
 * Votar un comentario (toggle)
 * Un usuario solo puede votar una vez por comentario
 * Si vota de nuevo, se quita el voto
 */
export const toggleVote = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { commentId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no identificado',
                error: 'UNAUTHORIZED'
            });
        }

        const comment = await FeedbackComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado',
                error: 'COMMENT_NOT_FOUND'
            });
        }

        // Verificar si el usuario ya votó
        const existingVote = await FeedbackVote.findOne({
            commentId,
            userId
        });

        if (existingVote) {
            // Si ya votó, quitar el voto (toggle)
            await FeedbackVote.deleteOne({ _id: existingVote._id });
            comment.voteCount = Math.max(0, comment.voteCount - 1);
            await comment.save();

            return res.status(200).json({
                success: true,
                message: 'Voto removido',
                data: {
                    _id: comment._id,
                    voteCount: comment.voteCount,
                    status: comment.status,
                    hasVoted: false
                }
            });
        } else {
            // Si no votó, agregar el voto
            await FeedbackVote.create({
                commentId,
                userId
            });
            comment.voteCount += 1;
            await comment.save();

            return res.status(200).json({
                success: true,
                message: 'Voto agregado',
                data: {
                    _id: comment._id,
                    voteCount: comment.voteCount,
                    status: comment.status,
                    hasVoted: true
                }
            });
        }
    } catch (error) {
        console.error('toggleVote error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al votar el comentario',
            error: 'VOTE_ERROR'
        });
    }
};

/**
 * Cambiar el estado de un comentario
 * Solo ADMIN_ROLE puede cambiar el estado
 */
export const updateCommentStatus = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        const { commentId } = req.params;
        const { status } = req.body;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no identificado',
                error: 'UNAUTHORIZED'
            });
        }

        // Solo admins pueden cambiar el estado
        if (userRole !== 'ADMIN_ROLE') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden cambiar el estado de los comentarios',
                error: 'FORBIDDEN'
            });
        }

        // Validar estado
        const validStatuses = ['pendiente', 'realizado'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `El estado debe ser uno de: ${validStatuses.join(', ')}`,
                error: 'INVALID_STATUS'
            });
        }

        const comment = await FeedbackComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado',
                error: 'COMMENT_NOT_FOUND'
            });
        }

        comment.status = status;
        await comment.save();

        return res.status(200).json({
            success: true,
            message: `Estado del comentario actualizado a '${status}'`,
            data: {
                _id: comment._id,
                status: comment.status,
                userId: comment.userId,
                content: comment.content,
                voteCount: comment.voteCount,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });
    } catch (error) {
        console.error('updateCommentStatus error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al cambiar el estado del comentario',
            error: 'UPDATE_STATUS_ERROR'
        });
    }
};

/**
 * Listar comentarios
 * Público para todos los roles
 * Ordenado por voteCount (mayor a menor)
 * Soporta búsqueda por texto
 */
export const listComments = async (req, res) => {
    try {
        const { search, page = 1, limit = 20, status } = req.query;
        const userId = getRequesterUserId(req);

        let query = {};

        // Si hay búsqueda de texto, usar $text search
        if (search && search.trim()) {
            query.$text = { $search: search.trim() };
        }

        // Filtrar por estado si se proporciona
        if (status) {
            const validStatuses = ['pendiente', 'realizado'];
            if (validStatuses.includes(status)) {
                query.status = status;
            }
        }

        const skip = (page - 1) * limit;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        // Obtener comentarios
        const comments = await FeedbackComment.find(query)
            .sort({ voteCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean();

        // Obtener información de votos del usuario actual (si está autenticado)
        const userVotes = userId
            ? await FeedbackVote.find({
                  commentId: { $in: comments.map(c => c._id) },
                  userId
              }).lean()
            : [];

        const userVoteMap = new Map(userVotes.map(v => [v.commentId.toString(), true]));

        // Enriquecer comentarios con información de voto del usuario
        const enrichedComments = comments.map(comment => ({
            _id: comment._id,
            userId: comment.userId,
            content: comment.content,
            voteCount: comment.voteCount,
            status: comment.status,
            isEdited: comment.isEdited,
            editedAt: comment.editedAt,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            hasVoted: userVoteMap.has(comment._id.toString()) || false
        }));

        // Contar total de documentos
        const total = await FeedbackComment.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: 'Comentarios obtenidos exitosamente',
            data: enrichedComments,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (error) {
        console.error('listComments error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al obtener los comentarios',
            error: 'LIST_COMMENTS_ERROR'
        });
    }
};

/**
 * Obtener un comentario específico
 */
export const getComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = getRequesterUserId(req);

        const comment = await FeedbackComment.findById(commentId).lean();

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado',
                error: 'COMMENT_NOT_FOUND'
            });
        }

        // Verificar si el usuario actual votó
        const hasVoted = userId
            ? await FeedbackVote.exists({ commentId, userId })
            : false;

        return res.status(200).json({
            success: true,
            message: 'Comentario obtenido exitosamente',
            data: {
                ...comment,
                hasVoted: !!hasVoted
            }
        });
    } catch (error) {
        console.error('getComment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al obtener el comentario',
            error: 'GET_COMMENT_ERROR'
        });
    }
};
