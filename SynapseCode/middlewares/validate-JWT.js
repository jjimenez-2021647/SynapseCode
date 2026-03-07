import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
// Configuración del JWT
    const jwtConfig = {
        secret: process.env.JWT_SECRET,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
    }

    if (!jwtConfig.secret){
        console.error('Error de validación JWT: JWT_SECRET no está definido');
        return res.status(500).json({
            success: false,
            message: 'Configuarión del servidor inválida: falta JWT_SECRET'
        })
    }

    const token = 
        req.header('x-token') ||
        req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó un token',
            error: 'MISSING_TOKEN'
        })
    }

    try {
        const decodedToken = jwt.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        })

        // Compatibilidad de claims entre servicios/tokens antiguos
        if (!decodedToken.userId && (decodedToken.id || decodedToken.sub)) {
            decodedToken.userId = decodedToken.id || decodedToken.sub;
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        const isExpired = error.name === 'TokenExpiredError';
        const status = isExpired ? 401 : 400;

        return res.status(status).json({
            success: false,
            message: isExpired ? 'Token expirado' : 'Token inválido',
            error: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
            details: error.message
        })
    }

}
