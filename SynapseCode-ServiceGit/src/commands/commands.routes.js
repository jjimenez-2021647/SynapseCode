import express from 'express';
import {
  executeCommand,
  getCommandHistory,
  getUserCommandHistory,
  getCommandStats,
} from './commands.controller.js';

const router = express.Router();

// Ejecutar comando
router.post('/execute', executeCommand);

// Historial de comandos de un repositorio
router.get('/history/:repositoryId', getCommandHistory);

// Historial de comandos del usuario
router.get('/user/:userId', getUserCommandHistory);

// Estadísticas de comandos
router.get('/stats/:repositoryId', getCommandStats);

export default router;
