import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initServer} from './configs/apps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

process.on('uncaughtException', (err) =>{
    console.error('Excepción no capturada en el servidor SynapseCode Admin', err);
    process.exit(1);
})
process.on('unhandledRejection', (err, promise) =>{
    console.error('Promesa rechazada no manejada en:', promise, 'razón:', err);
    process.exit(1);
})

console.log('Starting SynapseCode Admin Server...');
initServer();