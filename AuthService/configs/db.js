'use strict';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL (igual que la API .NET)
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
    define: {
        freezeTableName: true, // Usar nombres exactos sin pluralización
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true, // Usar snake_case para todos los campos
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

// Función para conectar a la base de datos
export const dbConnection = async () => {
    try {
        console.log('PostgreSQL | Trying to connect...');

        await sequelize.authenticate();
        console.log('PostgreSQL | Connected to PostgreSQL');
        console.log('PostgreSQL | Connection to database established');

        // Sincronizar modelos en desarrollo
        if (process.env.NODE_ENV === 'development') {
            const syncLogging =
                process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
            await sequelize.sync({ alter: true, logging: syncLogging });
            console.log('PostgreSQL | Models synchronized with database');
        }
    } catch (error) {
        console.error('\nPostgreSQL | No se pudo conectar a la base de datos\n');

        if (error.name === 'SequelizeConnectionRefusedError') {
            console.error('PostgreSQL | El contenedor de Docker no esta corriendo o PostgreSQL no esta listo.');
            console.error('PostgreSQL | Ejecuta: docker compose up -d');
            console.error(`PostgreSQL | Host: ${process.env.DB_HOST} | Puerto: ${process.env.DB_PORT}`);
        } else if (error.name === 'SequelizeConnectionError' && error.message.includes('does not exist')) {
            console.error('PostgreSQL | La base de datos no existe.');
            console.error(`PostgreSQL | Verifica que DB_NAME="${process.env.DB_NAME}" sea correcto en tu .env`);
            console.error('PostgreSQL | O crea la base de datos, revisa tu docker-compose.yml');
        } else if (error.name === 'SequelizeHostNotFoundError') {
            console.error('PostgreSQL | Host de la base de datos no encontrado.');
            console.error(`PostgreSQL | Verifica que DB_HOST="${process.env.DB_HOST}" sea correcto en tu .env`);
        } else if (error.name === 'SequelizeAccessDeniedError') {
            console.error('PostgreSQL | Acceso denegado a la base de datos.');
            console.error('PostgreSQL | Verifica DB_USERNAME y DB_PASSWORD en tu .env');
        } else if (error.name === 'SequelizeConnectionTimedOutError') {
            console.error('PostgreSQL | Timeout al conectar. Docker puede estar iniciando aun.');
            console.error('PostgreSQL | Espera unos segundos y vuelve a intentarlo.');
        } else {
            console.error('PostgreSQL | Error inesperado:', error.message);
            console.error('PostgreSQL | Stack trace:', error.stack);
        }

        console.error('');
        process.exit(1);
    }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
    console.log(
        `PostgreSQL | Received ${signal}. Closing database connection...`
    );
    try {
        await sequelize.close();
        console.log('PostgreSQL | Database connection closed successfully');
        process.exit(0);
    } catch (error) {
        console.error(
            'PostgreSQL | Error during graceful shutdown:',
            error.message
        );
        process.exit(1);
    }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts
