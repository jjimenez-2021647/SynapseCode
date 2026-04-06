const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'AuthService', path: 'AuthService', port: 3006, color: '\x1b[31m' },
  { name: 'ServiceRoom', path: 'SynapseCode-ServiceRoom', port: 3007, color: '\x1b[34m' },
  { name: 'ServiceChat', path: 'SynapseCode-ServiceChat', port: 3008, color: '\x1b[32m' },
  { name: 'ServiceCodeSessions', path: 'SynapseCode-ServiceCodeSessions', port: 3009, color: '\x1b[33m' },
  { name: 'ServiceExecutionCode', path: 'SynapseCode-ServiceExecutionCode', port: 3010, color: '\x1b[35m' },
];

const reset = '\x1b[0m';
const children = [];

const log = (color, title, message) => {
  console.log(`${color}[${title}]${reset} ${message}`);
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
    log(service.color, service.name, `cerrado con código ${code}`);
  });
});

console.log('\nTodos los servicios están levantados:\n');
services.forEach((service) => {
  console.log(`   ${service.color}[${service.name}]${reset} http://localhost:${service.port}/api-docs`);
});

console.log('\nPresiona CTRL+C para detener todos los servicios\n');

process.on('SIGINT', () => {
  console.log('\n\nDeteniendo todos los servicios...\n');
  children.forEach((child) => child.kill());
  setTimeout(() => {
    console.log('Todos los servicios han sido detenidos');
    process.exit(0);
  }, 1000);
});
