'use strict';
import mongoose from "mongoose";
export const dbConnection = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) return;
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 })
        console.log('MongoDB | Connected to SynapseCodeDB');
    } catch (error) {
        console.log(`DB Error: ${error}`);
    }
}
const gracefullShutdown = async (signal) => {
    try {
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}
process.on('SIGINT', () => gracefullShutdown('SIGINT'));
process.on('SIGTERM', () => gracefullShutdown('SIGTERM'));