'use strict';
import mongoose from "mongoose";
export const dbConnection = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.URI_MONGO;
        if (!mongoUri) return;
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 })
        console.log('MongoDB | conectado a la base de datos SynapseCodeDB');
    } catch (error) {
        console.error(`Error al conectar la db: ${error}`);
    }
}
const gracefullShutdown = async (signal) => {
    console.log(`MongoDB | Received ${signal}.`);
    try {
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(`MongoDB | Error disconnecting: ${error}`);
        process.exit(1);
    }
}
process.on('SIGINT', () => gracefullShutdown('SIGINT'));
process.on('SIGTERM', () => gracefullShutdown('SIGTERM'));