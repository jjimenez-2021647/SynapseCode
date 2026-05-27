import express from 'express';
import cors from 'cors';
import corsOptions from './cors-configuration.js';
import { connectDB } from './db.js';
import repositoriesRoutes from '../src/repositories/repositories.routes.js';
import commandsRoutes from '../src/commands/commands.routes.js';
import errorHandler from '../middleware/errorHandler.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Conectar a BD
await connectDB();

// Rutas
app.use('/api/repositories', repositoriesRoutes);
app.use('/api/commands', commandsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SynapseCode-ServiceGit' });
});

// Manejo de errores
app.use(errorHandler);

export const initServer = () => {
  const PORT = process.env.PORT || 3006;
  app.listen(PORT, () => {
    console.log(` SynapseCode-ServiceGit corriendo en puerto ${PORT}`);
  });
};

export default app;
