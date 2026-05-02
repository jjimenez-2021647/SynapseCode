import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config.js';
import corsConfiguration from './cors-configuration.js';
import helmetConfiguration from './helmet-configuration.js';
import validateJWT from '../middlewares/validate-JWT.js';
import requestLimit from '../middlewares/request-limit.js';
import plansRouter from '../src/plans/plans.routes.js';
import subscriptionsRouter from '../src/subscriptions/subscriptions.routes.js';
import orgManagementRouter from '../src/org-management/org-management.routes.js';
import healthCheckRouter from '../src/health/health.routes.js';

const app = express();

// Middleware de seguridad y parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cors(corsConfiguration));
app.use(helmet(helmetConfiguration));
app.use(morgan('dev'));

// Rate limiting
app.use(requestLimit);

// Health check (sin autenticación)
app.use('/api/v1/health', healthCheckRouter);

// Rutas públicas (planes disponibles)
app.use('/api/v1/plans', plansRouter);

// Rutas protegidas por JWT
app.use('/api/v1/subscriptions', validateJWT, subscriptionsRouter);
app.use('/api/v1/org-management', validateJWT, orgManagementRouter);

// Swagger docs
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'SynapseCode ServicePlans API',
    version: '1.0.0',
    docs: 'Documentación disponible en próximas versiones',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  const status = error.status || 500;
  const message = error.message || 'Error interno del servidor';
  
  res.status(status).json({
    success: false,
    message,
    ...(config.node_env === 'development' && { stack: error.stack }),
  });
});

export default app;
