import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export const validatePlanSelection = [
  body('planName')
    .isIn(['FREE', 'PRO', 'ORG'])
    .withMessage('Plan debe ser FREE, PRO u ORG'),
  body('email').isEmail().withMessage('Email inválido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  handleValidationErrors,
];

export const validateCodeRating = [
  body('roomId').notEmpty().withMessage('roomId requerido'),
  body('fileId').notEmpty().withMessage('fileId requerido'),
  body('userId').notEmpty().withMessage('userId requerido'),
  body('code').notEmpty().withMessage('code requerido'),
  body('rating')
    .isNumeric()
    .custom((value) => {
      if (value < 0 || value > 100) {
        throw new Error('Rating debe estar entre 0 y 100');
      }
      return true;
    })
    .withMessage('Rating inválido'),
  body('ratingScale')
    .isIn(['0-10', '0-15', '0-100%'])
    .withMessage('Escala de rating inválida'),
  handleValidationErrors,
];

export const validateRoomAIRestrictions = [
  body('aiEnabled').isBoolean().withMessage('aiEnabled debe ser booleano'),
  body('restrictions.aiExplanations')
    .optional()
    .isBoolean()
    .withMessage('aiExplanations debe ser booleano'),
  body('restrictions.aiCodeSuggestions')
    .optional()
    .isBoolean()
    .withMessage('aiCodeSuggestions debe ser booleano'),
  body('restrictions.aiDebugging')
    .optional()
    .isBoolean()
    .withMessage('aiDebugging debe ser booleano'),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validatePlanSelection,
  validateCodeRating,
  validateRoomAIRestrictions,
};
