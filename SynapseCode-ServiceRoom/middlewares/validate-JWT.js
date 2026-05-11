'use strict';

import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
    const jwtConfig = {
        secret: process.env.JWT_SECRET,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
    }

    if (!jwtConfig.secret){
        console.error('Error: JWT_SECRET no está definido');
        return res.status(500).json({
            success: false,
            message: 'Configuración del servidor inválida'
        })
    }

    const token = 
        req.header('x-token') ||
        req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó un token',
        })
    }

    try {
        const decodedToken = jwt.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        })

        if (!decodedToken.userId && (decodedToken.id || decodedToken.sub)) {
            decodedToken.userId = decodedToken.id || decodedToken.sub;
        }

        req.user = decodedToken;
        req.token = token;
        next();
    } catch (error) {
        const isExpired = error.name === 'TokenExpiredError';
        const status = isExpired ? 401 : 400;

        return res.status(status).json({
            success: false,
            message: isExpired ? 'Token expirado' : 'Token inválido',
        })
    }
}