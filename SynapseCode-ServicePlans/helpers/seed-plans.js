import Plan from '../src/plans/plan.model.js';
import config from '../configs/config.js';

export const seedPlans = async () => {
  try {
    const existingPlans = await Plan.countDocuments();

    if (existingPlans > 0) {
      console.log('✓ Planes ya existen en la BD');
      return;
    }

    const plans = [
      {
        name: 'FREE',
        price: config.plans.free.price,
        description: 'Plan gratuito para comenzar',
        currency: 'USD',
        features: {
          maxActiveRooms: 3,
          maxUsersPerRoom: 5,
          codeExecutionsLimit: 50, // 50 ejecuciones/día
          maxExecutionTimeSeconds: 10, // 10 segundos máximo por ejecución
          chatHistoryLimit: 7, // últimos 7 días
          aiExplanationsLimit: 3, // 3 explicaciones IA/día
          fullVersionHistory: false,
          priorityExecution: false,
          adminPanel: false,
          analyticsPerStudent: false,
          customBranding: false,
          dedicatedSupport: false,
        },
        isActive: true,
      },
      {
        name: 'PRO',
        price: config.plans.pro.price,
        description: 'Plan profesional con características avanzadas',
        currency: 'USD',
        features: {
          maxActiveRooms: null, // ilimitadas
          maxUsersPerRoom: 20,
          codeExecutionsLimit: null, // ilimitadas
          maxExecutionTimeSeconds: 60, // 60 segundos máximo por ejecución
          chatHistoryLimit: null, // historial completo
          aiExplanationsLimit: null, // ilimitadas
          fullVersionHistory: true,
          priorityExecution: true,
          adminPanel: false,
          analyticsPerStudent: false,
          customBranding: false,
          dedicatedSupport: false,
        },
        isActive: true,
      },
      {
        name: 'ORG',
        price: config.plans.org.price,
        description: 'Plan empresarial para instituciones',
        currency: 'USD',
        features: {
          maxActiveRooms: null, // ilimitadas
          maxUsersPerRoom: null, // ilimitadas
          codeExecutionsLimit: null, // ilimitadas
          maxExecutionTimeSeconds: 60, // 60 segundos máximo por ejecución
          chatHistoryLimit: null, // historial completo
          aiExplanationsLimit: null, // ilimitadas
          fullVersionHistory: true,
          priorityExecution: true,
          adminPanel: true,
          analyticsPerStudent: true,
          customBranding: true,
          dedicatedSupport: true,
        },
        isActive: true,
      },
    ];

    await Plan.insertMany(plans);
    console.log('✓ Planes creados exitosamente');
  } catch (error) {
    console.error('Error seeding plans:', error);
    throw error;
  }
};

export default { seedPlans };
