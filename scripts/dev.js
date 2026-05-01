const { spawn } = require('node:child_process');
const path = require('node:path');

const services = [
  {
    name: 'AuthService',
    path: 'AuthService',
    port: 3006,
    color: '\x1b[31m',
    healthUrl: 'http://localhost:3006/api/v1/health',
    docsUrl: 'http://localhost:3006/api/v1/docs',
  },
  {
    name: 'ServiceRoom',
    path: 'SynapseCode-ServiceRoom',
    port: 3007,
    color: '\x1b[34m',
    healthUrl: 'http://localhost:3007/api/v1/Health',
    docsUrl: 'http://localhost:3007/api-docs',
  },
  {
    name: 'ServiceChat',
    path: 'SynapseCode-ServiceChat',
    port: 3008,
    color: '\x1b[32m',
    healthUrl: 'http://localhost:3008/api/v1/Health',
    docsUrl: 'http://localhost:3008/api-docs',
  },
  {
    name: 'ServiceCodeSessions',
    path: 'SynapseCode-ServiceCodeSessions',
    port: 3009,
    color: '\x1b[33m',
    healthUrl: 'http://localhost:3009/api/v1/Health',
    docsUrl: 'http://localhost:3009/api-docs',
  },
  {
    name: 'ServiceExecutionCode',
    path: 'SynapseCode-ServiceExecutionCode',
    port: 3010,
    color: '\x1b[35m',
    healthUrl: 'http://localhost:3010/api/v1/Health',
    docsUrl: 'http://localhost:3010/api-docs',
  },
  {
    name: 'ServiceFeedback',
    path: 'SynapseCode-ServiceFeedback',
    port: 3011,
    color: '\x1b[36m',
    healthUrl: 'http://localhost:3011/api/v1/Health',
    docsUrl: 'http://localhost:3011/api-docs',
  },
  {
    name: 'ServiceGit',
    path: 'SynapseCode-ServiceGit',
    port: 3012,
    color: '\x1b[37m',
    healthUrl: 'http://localhost:3012/health',
    docsUrl: 'http://localhost:3012/api-docs',
  },
];

const adminCredentials = {
  email: 'synapsecode823@gmail.com',
  password: 'admin_synapse',
};

const reset = '\x1b[0m';
const children = [];
const BOX_WIDTH = 76;

const log = (color, title, message) => {
  console.log(`${color}[${title}]${reset} ${message}`);
};

const padLine = (label, value = '') => {
  const content = value ? `${label} ${value}` : label;
  return content.length > BOX_WIDTH ? content.slice(0, BOX_WIDTH) : content.padEnd(BOX_WIDTH, ' ');
};

const printBox = (title, lines) => {
  console.log(`+${'-'.repeat(BOX_WIDTH + 2)}+`);
  console.log(`| ${padLine(title)} |`);
  console.log(`+${'-'.repeat(BOX_WIDTH + 2)}+`);
  lines.forEach((line) => {
    console.log(`| ${padLine(line)} |`);
  });
  console.log(`+${'-'.repeat(BOX_WIDTH + 2)}+`);
};

console.log('\nLevantando todos los microservicios SynapseCode...\n');

services.forEach((service) => {
  const servicePath = path.join(__dirname, '..', service.path);

  const child = spawn('pnpm', ['dev'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true,
  });

  children.push(child);
  log(service.color, service.name, `iniciando en puerto ${service.port}...`);

  child.on('error', (err) => {
    log(service.color, service.name, `Error: ${err.message}`);
  });

  child.on('close', (code) => {
    log(service.color, service.name, `cerrado con codigo ${code}`);
  });
});

console.log('\nResumen de servicios:\n');
services.forEach((service) => {
  printBox(service.name, [
    `Puerto: ${service.port}`,
    `Health: ${service.healthUrl}`,
    `API Docs: ${service.docsUrl}`,
  ]);
});

console.log('');
printBox('Credenciales Admin', [
  `Email: ${adminCredentials.email}`,
  `Password: ${adminCredentials.password}`,
]);

console.log('\nPresiona CTRL+C para detener todos los servicios\n');

process.on('SIGINT', () => {
  console.log('\n\nDeteniendo todos los servicios...\n');
  children.forEach((child) => child.kill());
  setTimeout(() => {
    console.log('Todos los servicios han sido detenidos');
    process.exit(0);
  }, 1000);
});
