'use strict'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
    const httpServer = createServer(app);
    const PORT = process.env.PORT;
    
    // Configurar Socket.IO
    const io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost:5174", // Soporte para puerto alternativo
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:3004",
                "http://localhost:3005",
                "http://localhost:3100"
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    
    app.set('trust proxy', 1);
    app.set('io', io); // Pasar io a través de app para usar en rutas

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

        // Configurar eventos de Socket.IO
        io.on('connection', (socket) => {
            console.log(`[Socket.IO] Usuario conectado: ${socket.id}`);

            // Usuario se une a una sala
            socket.on('join-room', (roomId, fileId, userId) => {
                const roomKey = `room-${roomId}-file-${fileId}`;
                socket.join(roomKey);
                console.log(`[Socket.IO] ${socket.id} se unió a ${roomKey}`);
                
                // Notificar a otros usuarios que alguien se conectó
                socket.to(roomKey).emit('user-joined', { userId, socketId: socket.id });
                
                // Emitir evento de usuario presente en la sala (para sincronizar lista)
                socket.emit('room-users-updated', { roomId, fileId, userId });
                socket.to(roomKey).emit('room-users-updated', { roomId, fileId, userId });
            });

            // Sincronizar cambios de código en tiempo real
            socket.on('code-change', (data) => {
                const { roomId, fileId, code, userId } = data;
                const roomKey = `room-${roomId}-file-${fileId}`;
                
                // Emitir a todos EXCEPTO al usuario que envió el cambio
                socket.to(roomKey).emit('code-changed', { code, userId });
            });

            // Sincronizar movimiento del cursor en tiempo real
            socket.on('cursor-move', (data) => {
                const { roomId, fileId, position, userId, userName } = data;
                const roomKey = `room-${roomId}-file-${fileId}`;
                
                // Emitir a todos EXCEPTO al usuario que envió el cambio
                socket.to(roomKey).emit('cursor-moved', { position, userId, userName });
            });

            // Compartir output de consola con todos los usuarios en el archivo
            socket.on('console-output', (data) => {
                const { roomId, fileId, consoleId, output, type } = data;
                const roomKey = `room-${roomId}-file-${fileId}`;
                
                // Emitir a todos EN LA SALA incluyendo al que envió
                io.to(roomKey).emit('console-output-shared', { consoleId, output, type });
            });

            // Usuario abandona la sala
            socket.on('leave-room', (roomId, fileId, userId) => {
                const roomKey = `room-${roomId}-file-${fileId}`;
                socket.leave(roomKey);
                console.log(`[Socket.IO] ${socket.id} abandonó ${roomKey}`);
                
                socket.to(roomKey).emit('user-left', { userId, socketId: socket.id });
            });

            // Desconexión
            socket.on('disconnect', () => {
                console.log(`[Socket.IO] Usuario desconectado: ${socket.id}`);
            });
        });

        httpServer.listen(PORT, () => {
            console.log(`SynapseCode-ServiceRoom running on port ${PORT}`);
            console.log(`API Docs: http://localhost:${PORT}/api-docs`);
            console.log(`Socket.IO habilitado en puerto ${PORT}`);
        });
    } catch (error) {
        console.error(`Error starting ServiceRoom: ${error.message}`);
        process.exit(1);
    }
}
