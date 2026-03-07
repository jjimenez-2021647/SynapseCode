'use strict';

/**
 * Convierte secuencias escapadas comunes a caracteres reales cuando vienen como texto literal.
 * Ejemplo: "\\n" -> salto de linea, "\\t" -> tab.
 * Si el valor ya viene normalizado, se devuelve igual.
 */
export const normalizeCodeContent = (value) => {
    if (typeof value !== 'string') return value;

    return value
        .replace(/\r\n/g, '\n')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
};

