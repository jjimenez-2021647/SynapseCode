import dotenv from 'dotenv';
import { initServer } from './configs/apps.js';

dotenv.config({ override: true });

process.on('uncaughtException', (err) => {
  console.error('ERROR: Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('ERROR: Unhandled Rejection:', err);
  process.exit(1);
});

console.log('Iniciando SynapseCode-ServiceGit...');
initServer();
