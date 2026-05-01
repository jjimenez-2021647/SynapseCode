const { spawn } = require('node:child_process');
const path = require('node:path');

const services = [
  { name: 'AuthService', path: 'AuthService' },
  { name: 'SynapseCode-ServiceChat', path: 'SynapseCode-ServiceChat' },
  { name: 'SynapseCode-ServiceCodeSessions', path: 'SynapseCode-ServiceCodeSessions' },
  { name: 'SynapseCode-ServiceExecutionCode', path: 'SynapseCode-ServiceExecutionCode' },
  { name: 'SynapseCode-ServiceFeedback', path: 'SynapseCode-ServiceFeedback' },
  { name: 'SynapseCode-ServiceRoom', path: 'SynapseCode-ServiceRoom' },
];

const reset = '\x1b[0m';
const green = '\x1b[32m';
const blue = '\x1b[34m';

console.log(`\n${blue}Instalando dependencias en todos los microservicios...${reset}\n`);

let completed = 0;
let failed = 0;

services.forEach((service) => {
  const servicePath = path.join(__dirname, '..', service.path);

  const child = spawn('pnpm', ['install'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true,
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`${green}[OK]${reset} ${service.name} instalado correctamente`);
      completed++;
    } else {
      console.log(`\x1b[31m[ERROR]${reset} ${service.name} falló con código ${code}`);
      failed++;
    }

    if (completed + failed === services.length) {
      console.log(`\n${blue}Instalacion completada: ${completed}/${services.length} servicios${reset}\n`);
      if (failed > 0) process.exit(1);
    }
  });

  child.on('error', (err) => {
    console.log(`\x1b[31m[ERROR]${reset} ${service.name}: ${err.message}`);
    failed++;
  });
});
