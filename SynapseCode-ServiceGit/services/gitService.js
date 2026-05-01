import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio base donde vivirán los repos
const WORKSPACE_BASE = path.join(__dirname, '../workspace');

// Asegurarse que el directorio base existe
if (!fs.existsSync(WORKSPACE_BASE)) {
  fs.mkdirSync(WORKSPACE_BASE, { recursive: true });
}

// UTILIDADES

/**
 * Obtiene la ruta del repositorio basado en tipo y nombre
 * @param {string} type - 'individual' o 'shared'
 * @param {string} identifier - userId o roomId
 */
const getRepoPath = (type, identifier) => {
  if (type === 'individual') {
    return path.join(WORKSPACE_BASE, `user_${identifier}`);
  } else if (type === 'shared') {
    return path.join(WORKSPACE_BASE, `room_${identifier}_shared`);
  }
  throw new Error('Tipo de repositorio inválido');
};

/**
 * Obtiene instancia de git en un repo específico
 */
const getGit = (repoPath) => {
  return simpleGit(repoPath);
};

const ensureWorkspacePath = (targetPath) => {
  const normalizedBase = path.resolve(WORKSPACE_BASE);
  const normalizedTarget = path.resolve(targetPath);

  if (
    normalizedTarget !== normalizedBase &&
    !normalizedTarget.startsWith(`${normalizedBase}${path.sep}`)
  ) {
    throw new Error('Ruta fuera del workspace permitido');
  }

  return normalizedTarget;
};

const isDirectoryEmpty = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    return true;
  }

  return fs.readdirSync(targetPath).length === 0;
};

// OPERACIONES DE REPOSITORIO

/**
 * Inicializar repositorio
 */
const initRepo = async (type, identifier, userEmail, userName) => {
  const repoPath = getRepoPath(type, identifier);

  // Crear directorio si no existe
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }

  const git = getGit(repoPath);

  // Verificar si ya existe
  const isRepo = await git.checkIsRepo();
  if (isRepo) {
    return {
      message: `Repositorio ${type} ya existe para ${identifier}`,
      type,
      path: repoPath,
      isNew: false,
    };
  }

  // Inicializar
  await git.init();

  // Configurar usuario local (si se proporcionan)
  if (userEmail && userName) {
    try {
      await git.addConfig('user.email', userEmail, false, 'local');
      await git.addConfig('user.name', userName, false, 'local');
    } catch (err) {
      console.warn('Advertencia al configurar usuario:', err.message);
    }
  }

  return {
    message: `Repositorio ${type} creado para ${identifier}`,
    type,
    path: repoPath,
    isNew: true,
  };
};

/**
 * Agregar remoto (GitHub)
 */
const addRemote = async (type, identifier, remoteUrl, remoteName = 'origin') => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  try {
    await git.addRemote(remoteName, remoteUrl);
    return {
      message: `Remoto '${remoteName}' conectado a ${remoteUrl}`,
      remoteName,
      remoteUrl,
    };
  } catch (err) {
    if (err.message.includes('already exists')) {
      // Si ya existe, intenta actualizarlo
      await git.removeRemote(remoteName);
      await git.addRemote(remoteName, remoteUrl);
      return {
        message: `Remoto '${remoteName}' actualizado a ${remoteUrl}`,
        remoteName,
        remoteUrl,
      };
    }
    throw err;
  }
};

/**
 * Agregar archivos al staging (sin commit)
 */
const add = async (type, identifier, files = ['.']) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!files || files.length === 0) {
    files = ['.'];
  }

  try {
    await git.add(files);

    const status = await git.status();
    return {
      message: `${status.staged.length} archivo(s) preparado(s) para commit`,
      filesStaged: status.staged,
      count: status.staged.length,
    };
  } catch (err) {
    throw new Error(`Error en add: ${err.message}`);
  }
};

/**
 * Agregar archivos y hacer commit
 */
const commit = async (type, identifier, message, files = ['.']) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!message || message.trim().length === 0) {
    throw new Error('El mensaje del commit no puede estar vacío');
  }

  try {
    // Agregar archivos (pueden ser específicos o todos con '.')
    await git.add(files);

    // Verificar que hay cambios para commitear
    const status = await git.status();
    if (status.staged.length === 0) {
      return {
        message: 'Sin cambios para commitear',
        filesAdded: 0,
        commit: null,
        summary: { changes: 0, insertions: 0, deletions: 0 },
      };
    }

    // Hacer commit
    const result = await git.commit(message);

    return {
      message: 'Commit realizado exitosamente',
      commit: result.commit,
      author: result.author,
      filesAdded: status.staged.length,
      summary: result.summary,
    };
  } catch (err) {
    throw new Error(`Error en commit: ${err.message}`);
  }
};

/**
 * Push al remoto
 */
const push = async (type, identifier, remote = 'origin', branch = 'main', githubToken = null) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!remote || remote.trim().length === 0) {
    throw new Error('El nombre del remoto es obligatorio');
  }

  if (!branch || branch.trim().length === 0) {
    throw new Error('El nombre de la rama es obligatorio');
  }

  try {
    // Verificar que el remoto existe
    const remotes = await git.getRemotes(true);
    const remoteExists = remotes.find((r) => r.name === remote);

    if (!remoteExists) {
      throw new Error(`El remoto '${remote}' no está configurado`);
    }

    let pushTarget = remote;
    const remoteUrl = remoteExists.refs.push || remoteExists.refs.fetch || '';

    if (githubToken) {
      if (!remoteUrl.startsWith('https://')) {
        throw new Error('El token solo puede usarse con remotos HTTPS');
      }

      pushTarget = remoteUrl.replace(
        'https://',
        `https://x-access-token:${encodeURIComponent(githubToken)}@`
      );
    }

    // Hacer push
    await git.push(pushTarget, branch);

    return {
      message: `Push a ${remote}/${branch} exitoso`,
      remote,
      branch,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (err.message.includes('Authentication failed')) {
      throw new Error('Error de autenticación: Token inválido o expirado');
    }
    if (err.message.includes('no such remote')) {
      throw new Error(`Remoto '${remote}' no configurado`);
    }
    throw new Error(`Error en push: ${err.message}`);
  }
};

/**
 * Pull del remoto
 */
const pull = async (type, identifier, remote = 'origin', branch = 'main') => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!remote || remote.trim().length === 0) {
    throw new Error('El nombre del remoto es obligatorio');
  }

  if (!branch || branch.trim().length === 0) {
    throw new Error('El nombre de la rama es obligatorio');
  }

  try {
    const remotes = await git.getRemotes();
    const remoteExists = remotes.find((r) => r.name === remote);

    if (!remoteExists) {
      throw new Error(`El remoto '${remote}' no está configurado`);
    }

    const result = await git.pull(remote, branch);
    return {
      message: 'Pull exitoso',
      summary: result.summary,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Error en pull: ${err.message}`);
  }
};

/**
 * Obtener status del repo
 */
const getStatus = async (type, identifier) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  try {
    const status = await git.status();
    return {
      branch: status.current || 'unknown',
      filesChanged: status.files.length,
      files: status.files.map((f) => ({
        path: f.path,
        status: f.type, // M, A, D, etc
      })),
      ahead: status.ahead || 0,
      behind: status.behind || 0,
      isClean: status.isClean(),
    };
  } catch (err) {
    throw new Error(`Error al obtener status: ${err.message}`);
  }
};

/**
 * Obtener historial de commits
 */
const getLog = async (type, identifier, limit = 10) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  const limitNum = Math.max(1, Math.min(parseInt(limit) || 10, 100)); // Entre 1 y 100

  try {
    const log = await git.log({ maxCount: limitNum });
    return log.all.map((commit) => ({
      hash: commit.hash || '',
      abbrevHash: commit.hash.substring(0, 7) || '',
      author: commit.author_name || 'Unknown',
      message: commit.message || '',
      date: commit.date || new Date().toISOString(),
    }));
  } catch (err) {
    throw new Error(`Error al obtener log: ${err.message}`);
  }
};

/**
 * Listar ramas
 */
const getBranches = async (type, identifier) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  try {
    const branches = await git.branch();
    return {
      current: branches.current || 'unknown',
      all: branches.all || [],
      total: (branches.all || []).length,
    };
  } catch (err) {
    throw new Error(`Error al listar ramas: ${err.message}`);
  }
};

/**
 * Crear rama
 */
const createBranch = async (type, identifier, branchName) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!branchName || branchName.trim().length === 0) {
    throw new Error('El nombre de la rama es obligatorio');
  }

  if (!/^[a-zA-Z0-9_\-/.]+$/.test(branchName)) {
    throw new Error('El nombre de la rama contiene caracteres inválidos');
  }

  try {
    await git.checkoutLocalBranch(branchName);
    return {
      message: `Rama '${branchName}' creada y activa`,
      branch: branchName,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Error al crear rama: ${err.message}`);
  }
};

/**
 * Cambiar de rama
 */
const switchBranch = async (type, identifier, branchName) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!branchName || branchName.trim().length === 0) {
    throw new Error('El nombre de la rama es obligatorio');
  }

  try {
    await git.checkout(branchName);
    return {
      message: `Cambiado a rama '${branchName}'`,
      branch: branchName,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Error al cambiar rama: ${err.message}`);
  }
};

/**
 * Merge de rama
 */
const merge = async (type, identifier, branchToMerge) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('No es un repositorio Git válido');
  }

  if (!branchToMerge || branchToMerge.trim().length === 0) {
    throw new Error('El nombre de la rama a mergear es obligatorio');
  }

  try {
    const result = await git.merge([branchToMerge]);
    return {
      message: `Merge de '${branchToMerge}' exitoso`,
      summary: result.summary,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (err.message.includes('CONFLICT')) {
      throw new Error(`Conflicto en merge de '${branchToMerge}': ${err.message}`);
    }
    throw new Error(`Error al mergear: ${err.message}`);
  }
};

/**
 * Escribir/actualizar archivo en el repo
 */
const writeFile = async (type, identifier, filePath, content) => {
  const repoPath = getRepoPath(type, identifier);
  const fullPath = path.join(repoPath, filePath);

  // Validaciones
  if (!filePath || filePath.trim().length === 0) {
    throw new Error('El path del archivo es obligatorio');
  }

  if (typeof content !== 'string') {
    throw new Error('El contenido debe ser un string');
  }

  // Crear directorio si no existe
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return {
      message: `Archivo '${filePath}' escrito correctamente`,
      path: filePath,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    };
  } catch (err) {
    throw new Error(`Error al escribir archivo: ${err.message}`);
  }
};

/**
 * Leer archivo del repo
 */
const readFile = async (type, identifier, filePath) => {
  const repoPath = getRepoPath(type, identifier);
  const fullPath = path.join(repoPath, filePath);

  // Validaciones
  if (!filePath || filePath.trim().length === 0) {
    throw new Error('El path del archivo es obligatorio');
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      path: filePath,
      content,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    };
  } catch (err) {
    throw new Error(`Error al leer archivo: ${err.message}`);
  }
};

/** * Cambiar el último commit (amend)
 */
const amendCommit = async (type, identifier, newMessage) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error('No es un repositorio Git válido');

  if (!newMessage || !newMessage.trim()) {
    throw new Error('El nuevo mensaje del commit es obligatorio');
  }

  try {
    await git.raw(['commit', '--amend', '-m', newMessage.trim()]);
    const log = await git.log({ maxCount: 1 });
    return {
      message: `Commit enmendado exitosamente`,
      commit: log.latest.hash || 'amended',
      newMessage: newMessage.trim(),
    };
  } catch (err) {
    throw new Error(`Error al enmendar commit: ${err.message}`);
  }
};

/**
 * Renombrar rama
 */
const renameBranch = async (type, identifier, oldName, newName) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error('No es un repositorio Git válido');

  if (!oldName || !oldName.trim()) {
    throw new Error('El nombre actual de la rama es obligatorio');
  }

  if (!newName || !newName.trim()) {
    throw new Error('El nuevo nombre de la rama es obligatorio');
  }

  // Validar nombres de rama
  const branchRegex = /^[a-zA-Z0-9_\-/.]+$/;
  if (!branchRegex.test(newName)) {
    throw new Error('El nuevo nombre contiene caracteres inválidos. Use: letras, números, underscore, dash, slash');
  }

  try {
    await git.branch(['-m', oldName.trim(), newName.trim()]);
    return {
      message: `Rama renombrada de '${oldName}' a '${newName}'`,
      oldName: oldName.trim(),
      newName: newName.trim(),
    };
  } catch (err) {
    throw new Error(`Error al renombrar rama: ${err.message}`);
  }
};

/** * Obtener la información completa del repositorio
 */
const getRepoInfo = async (type, identifier) => {
  const repoPath = getRepoPath(type, identifier);
  const git = getGit(repoPath);

  const isRepo = await git.checkIsRepo();

  if (!isRepo) {
    return {
      exists: false,
      path: repoPath,
      isRepository: false,
    };
  }

  try {
    const remotes = await git.getRemotes(true);
    const status = await git.status();
    const branches = await git.branch();

    return {
      exists: true,
      path: repoPath,
      isRepository: true,
      branch: status.current || 'unknown',
      branches: {
        current: branches.current,
        all: branches.all || [],
        total: (branches.all || []).length,
      },
      remotes: remotes || [],
      filesChanged: status.files.length || 0,
      isClean: status.isClean?.() || false,
      ahead: status.ahead || 0,
      behind: status.behind || 0,
    };
  } catch (err) {
    throw new Error(`Error al obtener info del repo: ${err.message}`);
  }
};

const deleteRepoFiles = async (type, identifier) => {
  const repoPath = ensureWorkspacePath(getRepoPath(type, identifier));

  if (!fs.existsSync(repoPath)) {
    return {
      deleted: false,
      path: repoPath,
      message: 'El directorio del repositorio no existia',
    };
  }

  fs.rmSync(repoPath, { recursive: true, force: true });

  return {
    deleted: true,
    path: repoPath,
    message: 'Directorio del repositorio eliminado',
  };
};

/**
 * Clonar repositorio remoto al workspace asignado
 */
const cloneRepo = async (type, identifier, remoteUrl, options = {}) => {
  const repoPath = getRepoPath(type, identifier);
  const normalizedRepoPath = ensureWorkspacePath(repoPath);
  const { branch, depth, userEmail, userName } = options;

  if (!remoteUrl || !remoteUrl.trim()) {
    throw new Error('La URL del repositorio es obligatoria');
  }

  if (branch && !/^[a-zA-Z0-9_\-/.]+$/.test(branch)) {
    throw new Error('El nombre de la rama contiene caracteres inválidos');
  }

  const depthNum = depth == null ? null : parseInt(depth, 10);
  if (depth != null && (!Number.isInteger(depthNum) || depthNum < 1)) {
    throw new Error('depth debe ser un número entero mayor o igual a 1');
  }

  const pathExists = fs.existsSync(normalizedRepoPath);
  const createdDirectory = !pathExists;

  if (pathExists && !isDirectoryEmpty(normalizedRepoPath)) {
    const existingGit = getGit(normalizedRepoPath);
    const isRepo = await existingGit.checkIsRepo();

    if (isRepo) {
      throw new Error(`Ya existe un repositorio Git para ${identifier}`);
    }

    throw new Error('La carpeta destino ya existe y no está vacía');
  }

  if (!pathExists) {
    fs.mkdirSync(normalizedRepoPath, { recursive: true });
  }

  const cloneOptions = [];
  if (branch) {
    cloneOptions.push('--branch', branch.trim());
  }
  if (depthNum) {
    cloneOptions.push('--depth', String(depthNum));
  }

  try {
    const workspaceGit = simpleGit(WORKSPACE_BASE);
    await workspaceGit.clone(remoteUrl.trim(), normalizedRepoPath, cloneOptions);

    const git = getGit(normalizedRepoPath);

    if (userEmail && userName) {
      try {
        await git.addConfig('user.email', userEmail, false, 'local');
        await git.addConfig('user.name', userName, false, 'local');
      } catch (err) {
        console.warn('Advertencia al configurar usuario tras clone:', err.message);
      }
    }

    const repoInfo = await getRepoInfo(type, identifier);
    const originRemote = repoInfo.remotes.find((remote) => remote.name === 'origin');

    return {
      message: `Repositorio clonado correctamente desde ${remoteUrl.trim()}`,
      path: normalizedRepoPath,
      remoteUrl: originRemote.refs.fetch || originRemote.refs.push || remoteUrl.trim(),
      branch: repoInfo.branch || branch || 'unknown',
      isNew: true,
    };
  } catch (err) {
    if (createdDirectory && fs.existsSync(normalizedRepoPath) && isDirectoryEmpty(normalizedRepoPath)) {
      fs.rmSync(normalizedRepoPath, { recursive: true, force: true });
    }

    throw new Error(`Error en clone: ${err.message}`);
  }
};

export default {
  initRepo,
  cloneRepo,
  addRemote,
  add,
  commit,
  push,
  pull,
  getStatus,
  getLog,
  getBranches,
  createBranch,
  switchBranch,
  merge,
  amendCommit,
  renameBranch,
  writeFile,
  readFile,
  getRepoInfo,
  deleteRepoFiles,
};
