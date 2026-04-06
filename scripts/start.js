const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'AuthService', path: 'AuthService', port: 3006 },
  { name: 'ServiceRoom', path: 'SynapseCode-ServiceRoom', port: 3007 },
  { name: 'ServiceChat', path: 'SynapseCode-ServiceChat', port: 3008 },
  { name: 'ServiceCodeSessions', path: 'SynapseCode-ServiceCodeSessions', port: 3009 },
  { name: 'ServiceExecutionCode', path: 'SynapseCode-ServiceExecutionCode', port: 3010 },
];

console.log('\nLevantando microservicios en PRODUCCIÓN...\n');

services.forEach((service) => {
  const servicePath = path.join(__dirname, '..', service.path);
  
  spawn('pnpm', ['start'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true,
  });

  console.log(`${service.name} iniciado en puerto ${service.port}`);
});

console.log('\nTodos los servicios están corriendo en producción\n');

process.on('SIGINT', () => {
  console.log('\nDeteniendo servicios...');
  process.exit(0);
});
