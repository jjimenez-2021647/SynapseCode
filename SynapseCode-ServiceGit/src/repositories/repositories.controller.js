import Repository from './repositories.model.js';
import gitService from '../../services/gitService.js';

const buildRepositoryState = async (type, identifier) => {
  const repoInfo = await gitService.getRepoInfo(type, identifier);
  const originRemote = repoInfo.remotes?.find((remote) => remote.name === 'origin');

  return {
    currentBranch: repoInfo.branch || 'main',
    remoteOrigin: originRemote?.refs?.push || originRemote?.refs?.fetch || null,
    githubUrl: originRemote?.refs?.push || originRemote?.refs?.fetch || null,
  };
};

/**
 * Inicializar un repositorio (individual o compartido)
 * POST /api/repositories/init
 */
export const initRepository = async (req, res, next) => {
  try {
    const { userId, roomId, type, userEmail, userName } = req.body;

    // Validaciones
    if (!userId || !userId.trim()) {
      return res.status(400).json({
        error: 'userId es obligatorio y no puede estar vacío',
      });
    }

    if (!type || !['individual', 'shared'].includes(type)) {
      return res.status(400).json({
        error: 'type es obligatorio y debe ser "individual" o "shared"',
      });
    }

    // Determinar el identificador
    const identifier = type === 'individual' ? userId : roomId;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        error: type === 'individual' ? 'userId es requerido para repos individuales' : 'roomId es requerido para repos compartidos',
      });
    }

    // Verificar si ya existe
    const existingRepo = await Repository.findOne({ type, identifier });
    if (existingRepo) {
      return res.status(409).json({
        message: `Repositorio ${type} ya existe para ${identifier}`,
        repository: existingRepo,
      });
    }

    // Inicializar el repo con simple-git
    const gitResult = await gitService.initRepo(type, identifier, userEmail, userName);
    const repositoryState = await buildRepositoryState(type, identifier);

    // Guardar en BD
    const repo = new Repository({
      userId,
      roomId: type === 'shared' ? roomId : null,
      type,
      identifier,
      localPath: gitResult.path,
      isInitialized: true,
      currentBranch: repositoryState.currentBranch,
      githubUrl: repositoryState.githubUrl,
      remoteOrigin: repositoryState.remoteOrigin,
    });
    await repo.save();

    res.status(gitResult.isNew ? 201 : 200).json({
      message: gitResult.message,
      repository: {
        id: repo._id,
        type: repo.type,
        identifier: repo.identifier,
        localPath: repo.localPath,
        currentBranch: repo.currentBranch,
        isInitialized: repo.isInitialized,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener información del repositorio
 * GET /api/repositories/:type/:identifier
 */
export const getRepository = async (req, res, next) => {
  try {
    const { type, identifier } = req.params;

    // Validaciones
    if (!type || !['individual', 'shared'].includes(type)) {
      return res.status(400).json({ error: 'type es obligatorio (individual o shared)' });
    }

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'identifier es obligatorio' });
    }

    const repo = await Repository.findOne({ type, identifier });
    if (!repo) {
      return res.status(404).json({
        error: `Repositorio ${type} no encontrado para ${identifier}`,
      });
    }

    const repoInfo = await gitService.getRepoInfo(type, identifier);
    const originRemote = repoInfo.remotes?.find((remote) => remote.name === 'origin');
    await Repository.findByIdAndUpdate(repo._id, {
      currentBranch: repoInfo.branch || repo.currentBranch,
      remoteOrigin: originRemote?.refs?.push || originRemote?.refs?.fetch || repo.remoteOrigin,
      githubUrl: originRemote?.refs?.push || originRemote?.refs?.fetch || repo.githubUrl,
    });

    res.json({
      repository: {
        ...repo.toObject(),
        ...repoInfo,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Listar repositorios del usuario
 * GET /api/repositories/user/:userId
 */
export const getUserRepositories = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !userId.trim()) {
      return res.status(400).json({ error: 'userId es obligatorio' });
    }

    const repos = await Repository.find({ userId });

    res.json({
      repositories: repos,
      count: repos.length,
      userId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Listar repositorios de una sala
 * GET /api/repositories/room/:roomId
 */
export const getRoomRepositories = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.trim()) {
      return res.status(400).json({ error: 'roomId es obligatorio' });
    }

    const repos = await Repository.find({ roomId });

    res.json({
      repositories: repos,
      count: repos.length,
      roomId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Conectar repositorio a GitHub (agregar remoto)
 * POST /api/repositories/:type/:identifier/remote
 */
export const addRemote = async (req, res, next) => {
  try {
    const { type, identifier } = req.params;
    const { githubUrl, remoteName = 'origin' } = req.body;

    if (!type || !['individual', 'shared'].includes(type)) {
      return res.status(400).json({ error: 'type es obligatorio (individual o shared)' });
    }

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'identifier es obligatorio' });
    }

    // Validaciones
    if (!githubUrl || !githubUrl.trim()) {
      return res.status(400).json({ error: 'githubUrl es obligatoria y no puede estar vacía' });
    }

    // Validar formato básico de URL
    if (!githubUrl.includes('github.com') || !githubUrl.endsWith('.git')) {
      return res.status(400).json({
        error: 'githubUrl debe ser una URL válida de GitHub (ej: https://github.com/usuario/repo.git)',
      });
    }

    if (!remoteName || !remoteName.trim()) {
      return res.status(400).json({ error: 'remoteName no puede estar vacío' });
    }

    // Verificar que el repositorio existe
    const repo = await Repository.findOne({ type, identifier });
    if (!repo) {
      return res.status(404).json({ error: 'Repositorio no encontrado' });
    }

    // Agregar remoto con simple-git
    const result = await gitService.addRemote(type, identifier, githubUrl, remoteName);

    // Actualizar en BD
    const repositoryState = await buildRepositoryState(type, identifier);
    await Repository.findByIdAndUpdate(repo._id, repositoryState, { new: true });

    res.json({
      message: result.message,
      remote: {
        name: result.remoteName,
        url: result.remoteUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Eliminar repositorio
 * DELETE /api/repositories/:type/:identifier
 */
export const deleteRepository = async (req, res, next) => {
  try {
    const { type, identifier } = req.params;

    // Validaciones
    if (!type || !['individual', 'shared'].includes(type)) {
      return res.status(400).json({ error: 'type es obligatorio (individual o shared)' });
    }

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'identifier es obligatorio' });
    }

    const repo = await Repository.findOneAndDelete({ type, identifier });
    if (!repo) {
      return res.status(404).json({
        error: `Repositorio ${type} no encontrado para ${identifier}`,
      });
    }

    const deletedFiles = await gitService.deleteRepoFiles(type, identifier);

    res.json({
      message: `Repositorio ${type} para ${identifier} eliminado correctamente`,
      repository: repo,
      workspace: deletedFiles,
    });
  } catch (err) {
    next(err);
  }
};
