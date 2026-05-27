/**
 * Middleware para validar formato de carnet
 * Valida que el carnet cumpla con el formato esperado
 */

/**
 * Valida el formato del carnet
 * @param {string} carnet - Número de carnet a validar
 * @returns {boolean}
 */
const isValidCarnetFormat = (carnet) => {
  if (!carnet || typeof carnet !== 'string') return false;
  
  // Carnet: alphanumeric, 6-20 caracteres
  const carnetRegex = /^[A-Z0-9]{6,20}$/i;
  return carnetRegex.test(String(carnet).trim());
};

/**
 * Middleware para validar carnet en request body
 * Uso: router.post('/route', validateCarnetFormat, controller);
 */
export const validateCarnetFormat = (req, res, next) => {
  try {
    const { carnetNumber } = req.body;

    if (!carnetNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de carnet es obligatorio',
        error: 'MISSING_CARNET'
      });
    }

    if (!isValidCarnetFormat(carnetNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de carnet inválido. Debe ser alfanumérico (6-20 caracteres)',
        error: 'INVALID_CARNET_FORMAT'
      });
    }

    // Normalizar carnet en req.body (uppercase, trim)
    req.body.carnetNumber = String(carnetNumber).toUpperCase().trim();

    next();
  } catch (error) {
    console.error('Error validating carnet format:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando carnet'
    });
  }
};

/**
 * Middleware para validar múltiples carnets en array
 * Uso: router.post('/route', validateCarnetArray, controller);
 * Espera: req.body.carnets = ['CARNET1', 'CARNET2', ...]
 */
export const validateCarnetArray = (req, res, next) => {
  try {
    const { carnets } = req.body;

    if (!carnets || !Array.isArray(carnets)) {
      return res.status(400).json({
        success: false,
        message: 'Array de carnets es obligatorio',
        error: 'MISSING_CARNETS'
      });
    }

    if (carnets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El array de carnets no puede estar vacío',
        error: 'EMPTY_CARNETS_ARRAY'
      });
    }

    // Validar cada carnet
    const invalidCarnets = [];
    carnets.forEach((carnet, index) => {
      if (!isValidCarnetFormat(carnet)) {
        invalidCarnets.push({
          index,
          carnet,
          reason: 'Formato inválido (debe ser alfanumérico, 6-20 caracteres)'
        });
      }
    });

    if (invalidCarnets.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${invalidCarnets.length} carnet(s) con formato inválido`,
        error: 'INVALID_CARNETS_FORMAT',
        details: invalidCarnets
      });
    }

    // Normalizar carnets
    req.body.carnets = carnets.map(c => String(c).toUpperCase().trim());

    next();
  } catch (error) {
    console.error('Error validating carnet array:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando carnets'
    });
  }
};

/**
 * Middleware para validar carnet en parámetro de URL
 * Uso: router.delete('/participants/:carnetNumber', validateCarnetParam, controller);
 */
export const validateCarnetParam = (req, res, next) => {
  try {
    const { carnetNumber } = req.params;

    if (!carnetNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de carnet en URL es obligatorio',
        error: 'MISSING_CARNET_PARAM'
      });
    }

    if (!isValidCarnetFormat(carnetNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de carnet en URL inválido',
        error: 'INVALID_CARNET_FORMAT'
      });
    }

    // Normalizar carnet en req.params
    req.params.carnetNumber = String(carnetNumber).toUpperCase().trim();

    next();
  } catch (error) {
    console.error('Error validating carnet param:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando carnet'
    });
  }
};

export default validateCarnetFormat;
