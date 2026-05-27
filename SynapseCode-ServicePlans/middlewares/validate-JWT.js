import jwt from 'jsonwebtoken';
import config from '../configs/config.js';

const validateJWT = (req, res, next) => {
  try {
    let token = req.get('x-token') || req.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    req.userId = decoded.sub || decoded.userId || decoded.id;
    req.user = decoded;

    next();
  } catch (error) {
    let message = 'Token inválido';
    let status = 401;

    if (error.name === 'TokenExpiredError') {
      message = 'Token expirado';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token inválido';
    }

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export default validateJWT;
