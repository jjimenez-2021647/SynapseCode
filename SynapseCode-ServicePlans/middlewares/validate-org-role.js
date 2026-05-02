import config from '../configs/config.js';

export const validateOrgRole = (req, res, next) => {
  try {
    const { user } = req;

    if (!user || user.role !== 'ORG_ROLE') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requiere rol ORG_ROLE',
      });
    }

    next();
  } catch (error) {
    console.error('Error validating ORG role:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando rol',
    });
  }
};

export default validateOrgRole;
