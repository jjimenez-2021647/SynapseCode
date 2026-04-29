'use strict'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import feedbackRoutes from '../src/feedback/feedback.routes.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};

const routes = (app) => {
    app.use(`${BASE_PATH}/feedback`, feedbackRoutes);
    app.get(`${BASE_PATH}/Health`, (request, response) => {
        response.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'SynapseCode-ServiceFeedback Running',
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    });
};

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 3011;
    app.set('trust proxy', 1);

    try {
        await dbConnection();
        middlewares(app);

        const swaggerDefinition = {
            openapi: '3.0.0',
            info: {
                title: 'SynapseCode-ServiceFeedback API',
                version: '1.0.0',
                description: 'Microservicio de Comentarios y Sugerencias - SynapseCode',
            },
            servers: [
                {
                    url: `http://localhost:${PORT}`,
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Token JWT en el header x-token o Authorization'
                    }
                }
            },
            tags: [
                {
                    name: 'Feedback Comments',
                    description: 'Operaciones relacionadas con comentarios'
                },
                {
                    name: 'Feedback Votes',
                    description: 'Operaciones relacionadas con votacion'
                }
            ]
        };

        const options = {
            swaggerDefinition,
            apis: [
                join(process.cwd(), 'configs/swagger-endpoints.js'),
                join(process.cwd(), 'src/**/*.routes.js')
            ],
        };

        const swaggerSpec = swaggerJSDoc(options);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        routes(app);

        app.listen(PORT, () => {
            console.log(`
------------------------------------------------------------
SynapseCode-ServiceFeedback iniciado exitosamente
Puerto: ${PORT}
Entorno: ${process.env.NODE_ENV || 'development'}
Documentacion: http://localhost:${PORT}/api-docs
Health Check: http://localhost:${PORT}/api/v1/Health
------------------------------------------------------------
            `);
        });
    } catch (error) {
        console.error('Error al iniciar ServiceFeedback:', error);
        process.exit(1);
    }
};
