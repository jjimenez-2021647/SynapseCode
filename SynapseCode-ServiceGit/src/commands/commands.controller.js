import Command from './commands.model.js';
import Repository from '../repositories/repositories.model.js';
import gitService from '../../services/gitService.js';
import { Types } from 'mongoose';

const validCommands = ['init', 'clone', 'add', 'commit', 'push', 'pull', 'status', 'log', 'branch', 'remote', 'merge', 'checkout', 'switch', 'amend', 'rename-branch'];

const syncRepositoryState = async (repositoryId, type, identifier, updates = {}) => {
  const repoInfo = await gitService.getRepoInfo(type, identifier);
  const nextState = {
    ...updates,
    currentBranch: repoInfo.branch || 'main',
  };

  if (repoInfo.remotes?.length) {
    const originRemote = repoInfo.remotes.find((remote) => remote.name === 'origin');
    if (originRemote) {
      nextState.remoteOrigin = originRemote.refs?.push || originRemote.refs?.fetch || null;
      nextState.githubUrl = nextState.remoteOrigin;
    }
  }

  await Repository.findByIdAndUpdate(repositoryId, nextState);
  return repoInfo;
};

/**
 * Ejecutar comando git
 * POST /api/commands/execute
 */
export const executeCommand = async (req, res, next) => {
  try {
    const { userId, type, identifier, command, args = {} } = req.body;
    const normalizedCommand = command?.trim().toLowerCase();

    // Validaciones
    if (!userId || !userId.trim()) {
      return res.status(400).json({ error: 'userId es obligatorio y no puede estar vacío' });
    }

    if (!type || !['individual', 'shared'].includes(type)) {
      return res.status(400).json({ error: 'type es obligatorio (individual o shared)' });
    }

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'identifier es obligatorio (userId o roomId)' });
    }

    if (!command || !command.trim()) {
      return res.status(400).json({ error: 'command es obligatorio' });
    }

    if (!validCommands.includes(normalizedCommand)) {
      return res.status(400).json({
        error: `Comando inválido: '${command}'. Comandos soportados: ${validCommands.join(', ')}`,
      });
    }

    // Obtener repositorio
    let repo = await Repository.findOne({ type, identifier });
    let repoCreatedDuringRequest = false;
    if (!repo && ['init', 'clone'].includes(normalizedCommand)) {
      const setupResult = normalizedCommand === 'clone'
        ? await gitService.cloneRepo(type, identifier, args.url || args.repoUrl || args.remoteUrl, {
          branch: args.branch,
          depth: args.depth,
          userEmail: args.email,
          userName: args.name,
        })
        : await gitService.initRepo(type, identifier, args.email, args.name);

      const repoInfo = await gitService.getRepoInfo(type, identifier);
      const originRemote = repoInfo.remotes?.find((remote) => remote.name === 'origin');

      repo = await Repository.create({
        userId,
        roomId: type === 'shared' ? identifier : null,
        type,
        identifier,
        localPath: setupResult.path,
        isInitialized: true,
        currentBranch: repoInfo.branch || 'main',
        githubUrl: originRemote?.refs?.push || originRemote?.refs?.fetch || null,
        remoteOrigin: originRemote?.refs?.push || originRemote?.refs?.fetch || null,
      });
      repoCreatedDuringRequest = true;
    }

    if (!repo) {
      return res.status(404).json({ error: 'Repositorio no encontrado. Ejecute primero: POST /api/repositories/init' });
    }

    if (repo && normalizedCommand === 'clone' && !repoCreatedDuringRequest) {
      return res.status(409).json({
        error: `Ya existe un repositorio registrado para ${type}:${identifier}`,
      });
    }

    // Crear registro del comando
    const cmd = new Command({
      userId,
      repositoryId: repo._id,
      command: normalizedCommand,
      arguments: args,
    });

    let result;
    let status = 'success';
    let error = null;

    try {
      // Ejecutar comando según el tipo
      switch (normalizedCommand) {
        case 'add':
          result = await gitService.add(type, identifier, args.files || ['.']);
          break;

        case 'commit':
          if (!args.message) throw new Error('El mensaje del commit es obligatorio');
          result = await gitService.commit(type, identifier, args.message, args.files || ['.']);
          break;

        case 'push':
          result = await gitService.push(type, identifier, args.remote || 'origin', args.branch || 'main', args.token);
          break;

        case 'pull':
          result = await gitService.pull(type, identifier, args.remote || 'origin', args.branch || 'main');
          break;

        case 'status':
          result = await gitService.getStatus(type, identifier);
          break;

        case 'log':
          result = await gitService.getLog(type, identifier, args.limit || 10);
          break;

        case 'branch':
          if (args.action === 'create') {
            if (!args.name) throw new Error('El nombre de la rama es obligatorio');
            result = await gitService.createBranch(type, identifier, args.name);
          } else if (args.action === 'list') {
            result = await gitService.getBranches(type, identifier);
          } else if (args.action === 'switch') {
            if (!args.name) throw new Error('El nombre de la rama es obligatorio');
            result = await gitService.switchBranch(type, identifier, args.name);
          } else if (
            args.action === 'rename' ||
            args.flag === '-m' ||
            args.flag === '--move' ||
            args.mode === 'rename'
          ) {
            const oldName = args.oldName || args.oldBranch || args.from;
            const newName = args.newName || args.newBranch || args.to || args.name;

            if (!oldName) throw new Error('El nombre actual de la rama es obligatorio');
            if (!newName) throw new Error('El nuevo nombre de la rama es obligatorio');

            result = await gitService.renameBranch(type, identifier, oldName, newName);
          } else {
            throw new Error('Acción de rama inválida: use create, list, switch o rename');
          }
          break;

        case 'remote':
          if (args.action === 'add') {
            const remoteName = args.name || args.remoteName || 'origin';
            const remoteUrl = args.url || args.githubUrl || args.remoteUrl;

            if (!remoteUrl) throw new Error('La URL del remoto es obligatoria');
            result = await gitService.addRemote(type, identifier, remoteUrl, remoteName);
          } else {
            throw new Error('Acción de remote inválida: use add');
          }
          break;

        case 'merge':
          if (!args.branch) throw new Error('El nombre de la rama a mergear es obligatorio');
          result = await gitService.merge(type, identifier, args.branch);
          break;

        case 'checkout':
          if (!args.branch) throw new Error('El nombre de la rama es obligatorio');
          result = await gitService.switchBranch(type, identifier, args.branch);
          break;

        case 'switch':
          if (!args.branch) throw new Error('El nombre de la rama es obligatorio');
          result = await gitService.switchBranch(type, identifier, args.branch);
          break;

        case 'amend':
          if (!args.message) throw new Error('El nuevo mensaje del commit es obligatorio');
          result = await gitService.amendCommit(type, identifier, args.message);
          break;

        case 'rename-branch':
          if (!args.oldName) throw new Error('El nombre actual de la rama es obligatorio');
          if (!args.newName) throw new Error('El nuevo nombre de la rama es obligatorio');
          result = await gitService.renameBranch(type, identifier, args.oldName, args.newName);
          break;

        case 'init':
          result = await gitService.initRepo(type, identifier, args.email, args.name);
          break;

        case 'clone':
          result = await gitService.cloneRepo(type, identifier, args.url || args.repoUrl || args.remoteUrl, {
            branch: args.branch,
            depth: args.depth,
            userEmail: args.email,
            userName: args.name,
          });
          break;

        default:
          throw new Error(`Comando no soportado: ${command}. Use: init, clone, add, commit, push, pull, status, log, branch, remote, merge, checkout, switch, amend, rename-branch`);
      }

      // Actualizar el comando como exitoso
      cmd.status = status;
      cmd.result = result;
      cmd.executedAt = new Date();
      await cmd.save();

      // Actualizar repositorio con el último commit si es necesario
      if (normalizedCommand === 'commit' && result.commit) {
        await Repository.findByIdAndUpdate(
          repo._id,
          {
            lastCommit: {
              hash: result.commit,
              message: args.message,
              date: new Date(),
            },
            totalCommits: (repo.totalCommits || 0) + 1,
          }
        );
      }

      if (['init', 'clone', 'branch', 'remote', 'checkout', 'switch', 'rename-branch', 'merge', 'pull', 'add', 'commit', 'amend', 'push'].includes(normalizedCommand)) {
        await syncRepositoryState(repo._id, type, identifier);
      }

      res.json({
        message: `Comando '${normalizedCommand}' ejecutado`,
        command: cmd,
        result,
      });
    } catch (err) {
      status = 'error';
      error = err.message;
      cmd.status = status;
      cmd.error = error;
      await cmd.save();

      return res.status(400).json({
        error: err.message,
        command: cmd,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener historial de comandos
 * GET /api/commands/history/:repositoryId?limit=20
 */
export const getCommandHistory = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const { limit = 20 } = req.query;

    // Validación
    if (!Types.ObjectId.isValid(repositoryId)) {
      return res.status(400).json({ error: 'ID de repositorio inválido' });
    }

    const limitNum = Math.min(parseInt(limit) || 20, 100); // Máximo 100

    const commands = await Command.find({ repositoryId })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.json({
      commands,
      count: commands.length,
      repositoryId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener historial de comandos del usuario
 * GET /api/commands/user/:userId?limit=20
 */
export const getUserCommandHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    // Validación
    if (!userId || !userId.trim()) {
      return res.status(400).json({ error: 'userId es obligatorio' });
    }

    const limitNum = Math.min(parseInt(limit) || 20, 100); // Máximo 100

    const commands = await Command.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.json({
      commands,
      count: commands.length,
      userId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener estadísticas de comandos
 * GET /api/commands/stats/:repositoryId
 */
export const getCommandStats = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;

    // Validar que el ID sea un ObjectId válido
    if (!Types.ObjectId.isValid(repositoryId)) {
      return res.status(400).json({ error: 'ID de repositorio inválido' });
    }

    const stats = await Command.aggregate([
      {
        $match: { repositoryId: new Types.ObjectId(repositoryId) },
      },
      {
        $group: {
          _id: '$command',
          count: { $sum: 1 },
          successes: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          errors: {
            $sum: {
              $cond: [{ $eq: ['$status', 'error'] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.json({
      stats,
      totalStats: {
        totalCommands: stats.reduce((sum, s) => sum + s.count, 0),
        totalSuccesses: stats.reduce((sum, s) => sum + s.successes, 0),
        totalErrors: stats.reduce((sum, s) => sum + s.errors, 0),
      },
    });
  } catch (err) {
    next(err);
  }
};
