import Plan from './plan.model.js';

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).select('-stripeProductId -stripePriceId');
    
    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes',
    });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId).select('-stripeProductId -stripePriceId');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plan',
    });
  }
};

export default {
  getAllPlans,
  getPlanById,
};
