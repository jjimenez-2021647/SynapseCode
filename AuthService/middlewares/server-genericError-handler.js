import { randomUUID } from 'crypto';

// Middleware global para el manejo de errores

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    } else {
        console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
    }

    const traceId = err.traceId || randomUUID();
    const timestamp = new Date().toISOString();
    const errorCode = err.errorCode || null;

    // Errores de validacion de Sequelize
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: err.errors.map(e => e.message).join(', '),
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Duplicado de Sequelize (unique constraint)
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = Object.keys(err.fields)[0];
        return res.status(400).json({
            success: false,
            message: `El campo '${field}' ya esta en uso`,
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Referencia a recurso inexistente
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Referencia a un recurso que no existe',
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Error de conexion a base de datos
    if (
        err.name === 'SequelizeConnectionError' ||
        err.name === 'SequelizeConnectionRefusedError'
    ) {
        return res.status(503).json({
            success: false,
            message: 'Error de conexion a la base de datos',
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token invalido',
            errorCode,
            traceId,
            timestamp,
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Error de multer (archivos)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'El archivo es demasiado grande',
            errorCode,
            traceId,
            timestamp,
        });
    }

    // Error personalizado con status
    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message || 'Error del servidor',
            errorCode: err.errorCode || null,
            traceId,
            timestamp,
        });
    }

    // Error generico del servidor
    return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        errorCode,
        traceId,
        timestamp,
    });
};

// Middleware para manejar rutas no encontradas
export const notFound = (req, res) => {
    const traceId = randomUUID();
    const timestamp = new Date().toISOString();
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        errorCode: null,
        traceId,
        timestamp,
    });
};

// Wrapper para manejar errores en funciones asincronas
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};