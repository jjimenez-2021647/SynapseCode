import 'dotenv/config';
import app from './configs/app.js';
import { connectDB } from './configs/db.js';
import { seedPlans } from './helpers/seed-plans.js';

const PORT = process.env.PORT || 3013;

const startServer = async () => {
  try {
    await connectDB();
    console.log('✓ Conectado a MongoDB');

    // Ejecutar seeding de planes
    await seedPlans();
    console.log('✓ Planes inicializados');

    app.listen(PORT, () => {
      console.log(`\n✓ ServicePlans corriendo en puerto ${PORT}`);
      console.log(`  Health: http://localhost:${PORT}/api/v1/health`);
      console.log(`  Docs: http://localhost:${PORT}/api-docs\n`);
    });
  } catch (error) {
    console.error('✗ Error iniciando servidor:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', () => {
  console.log('\n✓ Servidor detenido');
  process.exit(0);
});
