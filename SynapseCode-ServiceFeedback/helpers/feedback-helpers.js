/**
 * Utilidades y helpers para el servicio de feedback
 */

/**
 * Extrae el userId del objeto req.user
 * Soporta múltiples formatos de token
 * @param {Object} req - Express request object
 * @returns {String|null} userId o null si no se encuentra
 */
export const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Valida la longitud del contenido de un comentario
 * @param {String} content - Contenido a validar
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validateCommentContent = (content) => {
    if (!content || typeof content !== 'string') {
        return { isValid: false, error: 'El contenido debe ser una cadena de texto' };
    }

    const trimmed = content.trim();
    
    if (trimmed.length < 3) {
        return { isValid: false, error: 'El comentario debe tener al menos 3 caracteres' };
    }

    if (trimmed.length > 1000) {
        return { isValid: false, error: 'El comentario no puede exceder 1000 caracteres' };
    }

    return { isValid: true };
};

/**
 * Verifica si un usuario puede editar un comentario
 * @param {Date} createdAt - Fecha de creación del comentario
 * @param {Number} maxMinutes - Minutos máximos permitidos (default: 30)
 * @returns {Object} { canEdit: boolean, minutesElapsed: number, minutesRemaining: number }
 */
export const checkEditWindow = (createdAt, maxMinutes = 30) => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = Math.floor((currentTime - createdTime) / (1000 * 60));
    const minutesRemaining = Math.max(0, maxMinutes - minutesElapsed);

    return {
        canEdit: minutesElapsed <= maxMinutes,
        minutesElapsed,
        minutesRemaining
    };
};

/**
 * Formatea un comentario para respuesta
 * @param {Object} comment - Documento de comentario
 * @param {Boolean} hasVoted - Si el usuario votó
 * @returns {Object} Comentario formateado
 */
export const formatComment = (comment, hasVoted = false) => {
    return {
        _id: comment._id,
        userId: comment.userId,
        content: comment.content,
        voteCount: comment.voteCount,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        hasVoted
    };
};
