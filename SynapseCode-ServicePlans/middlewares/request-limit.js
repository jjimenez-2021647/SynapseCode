import rateLimit from 'express-rate-limit';
import config from '../configs/config.js';

const requestLimit = rateLimit({
  windowMs: config.rate_limit.window_ms,
  max: config.rate_limit.max_requests,
  message: 'Demasiadas peticiones, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No limitar health checks
    return req.path === '/api/v1/health';
  },
});

export default requestLimit;
