import express from 'express';
import {
  initRepository,
  getRepository,
  getUserRepositories,
  getRoomRepositories,
  addRemote,
  deleteRepository,
} from './repositories.controller.js';

const router = express.Router();

// Inicializar repositorio
router.post('/init', initRepository);

// Listar repositorios del usuario (ANTES de :type/:identifier para evitar conflictos)
router.get('/user/:userId', getUserRepositories);

// Listar repositorios de una sala
router.get('/room/:roomId', getRoomRepositories);

// Obtener repositorio específico
router.get('/:type/:identifier', getRepository);

// Conectar a GitHub
router.post('/:type/:identifier/remote', addRemote);

// Eliminar repositorio
router.delete('/:type/:identifier', deleteRepository);

export default router;
