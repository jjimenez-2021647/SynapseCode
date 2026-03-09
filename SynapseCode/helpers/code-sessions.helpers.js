'use strict'
import CodeSession from '../src/codeSessions/codeSessions.model.js'; 

/**
 * Determina el tipo de guardado basado en el contexto
 * @param {String}  requestedType     - Tipo solicitado en el body (opcional)
 * @param {Boolean} isAutoSave        - true si el frontend disparó guardado automático
 * @param {Boolean} isBeforeExecution - true si se guarda justo antes de ejecutar el código
 * @returns {String} - 'MANUAL' | 'AUTO' | 'CHECKPOINT'
 */
export const determineSaveType = (requestedType, isAutoSave = false, isBeforeExecution = false) => {
    if (isBeforeExecution) return 'CHECKPOINT';
    if (isAutoSave)        return 'AUTO';
    if (requestedType && ['MANUAL', 'AUTO', 'CHECKPOINT'].includes(requestedType.toUpperCase())) {
        return requestedType.toUpperCase();
    }
    return 'MANUAL';
};

/**
 * Determina si el código fue ejecutado comprobando si existe algún campo en executionResult
 * @param {Object} executionResult - Sub-documento de resultado de ejecución
 * @returns {Boolean}
 */
export const wasCodeExecuted = (executionResult) => {
    if (!executionResult) return false;
    return (
        executionResult.output         != null ||
        executionResult.errors         != null ||
        executionResult.executionTimeMs != null ||
        executionResult.memoryUsedKb   != null
    );
};

/**
 * Obtiene el siguiente número de versión para un archivo específico
 * La versión es incremental POR ARCHIVO, no por sala
 * @param {String|ObjectId} fileId - ID del archivo
 * @returns {Promise<Number>} - Siguiente número de versión (empieza en 1)
 */
export const getNextVersionByFile = async (fileId) => {
    try {
        const lastSession = await CodeSession.findOne({ fileId })
            .sort({ version: -1 })
            .limit(1);
        return lastSession ? lastSession.version + 1 : 1;
    } catch (error) {
        console.error('getNextVersionByFile error:', error);
        return 1;
    }
};

/**
 * Valida que el código no esté vacío
 * @param {String} code - Código a validar
 * @returns {Boolean} - true si es válido
 */
export const validateCodeNotEmpty = (code) => {
    return code !== undefined && code !== null && code.trim().length > 0;
};

/**
 * Valida que el lenguaje sea soportado
 * @param {String} language - Lenguaje a validar
 * @returns {Boolean} - true si es válido
 */
export const validateLanguage = (language) => {
    const validLanguages = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
    return validLanguages.includes(language.toUpperCase());
};