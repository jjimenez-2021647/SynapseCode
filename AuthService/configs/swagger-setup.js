import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Synapse Code Authentication Service API',
      version: '1.0.0',
      description:
        'API documentation for the Synapse Code Authentication Service. Handles user registration, login, email verification, password reset, and user role management.',
      contact: {
        name: 'API Support',
        email: 'support@synapsecode.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.synapsecode.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            username: { type: 'string', description: 'User username' },
            profilePicture: { type: 'string', description: 'URL to user profile picture' },
            role: { type: 'string', enum: ['user', 'admin', 'assistant'], description: 'User role' },
            emailVerified: { type: 'boolean', description: 'Email verification status' },
            isActive: { type: 'boolean', description: 'User active status' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['error'] },
            message: { type: 'string', description: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: { type: 'string' },
                  param: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication operations - register, login, verify email, password reset',
      },
      {
        name: 'Users',
        description: 'User management operations - CRUD operations and role management',
      },
    ],
  },
  apis: [`${__dirname}/swagger-endpoints.js`],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app, basePath = '/api/v1') => {
  // Relajar CSP solo para la ruta /docs para que Swagger UI cargue sus assets
  app.use(`${basePath}/docs`, (req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data:; " +
      "worker-src blob:;"
    );
    next();
  });

  app.use(`${basePath}/docs`, swaggerUi.serve, swaggerUi.setup(specs, {
    persistAuthorization: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));

  app.get(`${basePath}/docs/swagger.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };