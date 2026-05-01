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
import { ensureScopedFileIndexes } from '../helpers/file-index-migration.js';
import roomsRoutes from '../src/rooms/rooms.routes.js';
import roomParticipationsRoutes from '../src/roomParticipations/roomParticipations.routes.js';
import filesRoutes from '../src/files/files.routes.js';
import foldersRoutes from '../src/folders/folders.routes.js';
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
}

const routes = (app) => {
    app.use(`${BASE_PATH}/rooms`, roomsRoutes);
    app.use(`${BASE_PATH}/room-participations`, roomParticipationsRoutes);
    app.use(`${BASE_PATH}/files`, filesRoutes);
    app.use(`${BASE_PATH}/folders`, foldersRoutes);
    app.get(`${BASE_PATH}/Health`, (request, response) => {
        response.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'SynapseCode-ServiceRoom Running',
        })
    })

    app.use((req, res) => {
        res.status(404).json({
            succes: false,
            message: 'Endpoint no encontrado'
        })
    })
}

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;
    app.set('trust proxy', 1);

    try {
        await dbConnection();
        await ensureScopedFileIndexes();
        middlewares(app);

        const swaggerDefinition = {
            openapi: '3.0.0',
            info: {
                title: 'SynapseCode-ServiceRoom API',
                version: '1.0.0',
                description: 'Microservicio de Salas - SynapseCode',
            },
            servers: [
                {
                    url: `http://localhost:${PORT}`,
                },
            ],
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
            console.log(`SynapseCode-ServiceRoom running on port ${PORT}`);
            console.log(`API Docs: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error(`Error starting ServiceRoom: ${error.message}`);
        process.exit(1);
    }
}
