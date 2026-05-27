import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
    try {
        // Obtener token del header x-token o Authorization
        const token = req.header('x-token') || 
                      req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado',
                error: 'NO_TOKEN'
            });
        }

        const jwtConfig = {
            secret: process.env.JWT_SECRET,
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE
        };

        const decodedToken = jwt.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        });

        // Normalizar el userId (puede venir como userId, id o sub)
        if (!decodedToken.userId && (decodedToken.id || decodedToken.sub)) {
            decodedToken.userId = decodedToken.id || decodedToken.sub;
        }

        // Asignar usuario al request
        req.user = decodedToken;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                error: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'Token inválido',
            error: 'INVALID_TOKEN'
        });
    }
};
