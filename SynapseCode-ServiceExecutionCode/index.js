import dotenv from 'dotenv';
import { initServer} from './configs/apps.js';
dotenv.config({ override: true });
process.on('uncaughtException', (err) =>{ console.error('Error:', err); process.exit(1); })
process.on('unhandledRejection', (err) =>{ console.error('Error:', err); process.exit(1); })
console.log('Starting SynapseCode-ServiceExecutionCode...');
initServer();