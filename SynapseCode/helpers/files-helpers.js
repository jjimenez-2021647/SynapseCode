'use strict'

/**
 * Detecta el lenguaje de programación basado en la extensión del archivo
 * Solo soporta extensiones definidas en FILE_EXTENSIONS del modelo
 * @param {String} extension - Extensión del archivo (sin punto)
 * @returns {String} - Lenguaje detectado (JAVA, PYTHON, JAVASCRIPT, HTML_CSS, CSHARP)
 */
export const detectLanguageFromExtension = (extension) => {
    const languageMap = {
        'java': 'JAVA',
        'py': 'PYTHON',
        'js': 'JAVASCRIPT',
        'jsx': 'JAVASCRIPT',
        'html': 'HTML_CSS',
        'css': 'HTML_CSS',
        'cs': 'CSHARP',
    };

    const normalizedExtension = extension.toLowerCase().trim();
    const detected = languageMap[normalizedExtension];

    if (!detected) {
        throw new Error(
            `Extension '.${extension}' no soportada. Extensiones permitidas: java, py, js, jsx, html, css, cs`
        );
    }

    return detected;
};

/**
 * Valida que el nombre del archivo sea válido
 * @param {String} fileName - Nombre del archivo
 * @returns {Object} - { valid: Boolean, message: String }
 */
export const validateFileName = (fileName) => {
    if (!fileName || fileName.trim().length === 0) {
        return { valid: false, message: 'El nombre del archivo no puede estar vacio' };
    }

    if (fileName.length > 100) {
        return { valid: false, message: 'El nombre del archivo no puede exceder 100 caracteres' };
    }

    // Solo letras, números, guiones, puntos y guiones bajos
    const validPattern = /^[a-zA-Z0-9_\-\.]+$/;
    if (!validPattern.test(fileName)) {
        return {
            valid: false,
            message: 'El nombre del archivo solo puede contener letras, numeros, guiones, puntos y guiones bajos'
        };
    }

    // No puede empezar con punto
    if (fileName.startsWith('.')) {
        return { valid: false, message: 'El nombre del archivo no puede empezar con punto' };
    }

    return { valid: true, message: 'Nombre valido' };
};

/**
 * Valida que la extensión sea soportada
 * @param {String} extension - Extensión del archivo
 * @returns {Object} - { valid: Boolean, message: String }
 */
export const validateFileExtension = (extension) => {
    const supportedExtensions = ['java', 'py', 'js', 'jsx', 'html', 'css', 'cs'];

    const normalizedExtension = extension.toLowerCase().trim();

    if (!supportedExtensions.includes(normalizedExtension)) {
        return {
            valid: false,
            message: `Extension '.${extension}' no soportada. Extensiones permitidas: ${supportedExtensions.join(', ')}`
        };
    }

    return { valid: true, message: 'Extension valida' };
};

/**
 * Genera un nombre único de archivo si ya existe uno con el mismo nombre
 * @param {String} baseName - Nombre base del archivo
 * @param {Array} existingFileNames - Array de nombres de archivos existentes
 * @returns {String} - Nombre único
 */
export const generateUniqueFileName = (baseName, existingFileNames) => {
    let counter = 1;
    let uniqueName = baseName;

    while (existingFileNames.includes(uniqueName)) {
        uniqueName = `${baseName}_${counter}`;
        counter++;
    }

    return uniqueName;
};

/**
 * Calcula el tamaño de un string en bytes
 * @param {String} content - Contenido a medir
 * @returns {Number} - Tamaño en bytes
 */
export const calculateContentSize = (content) => {
    if (!content) return 0;
    return Buffer.byteLength(content, 'utf8');
};

/**
 * Formatea el tamaño de archivo a formato legible
 * @param {Number} bytes - Tamaño en bytes
 * @returns {String} - Tamaño formateado (ej: "2.5 KB", "1.2 MB")
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Obtiene el siguiente displayOrder para un archivo en una sala
 * @param {Model} File - Modelo de File
 * @param {String|ObjectId} roomId - ID de la sala
 * @returns {Promise<Number>} - Siguiente orden de visualización
 */
export const getNextDisplayOrder = async (File, roomId) => {
    try {
        const lastFile = await File.findOne({ roomId, isActive: true })
            .sort({ displayOrder: -1 })
            .limit(1);

        return lastFile ? lastFile.displayOrder + 1 : 0;
    } catch (error) {
        console.error('getNextDisplayOrder error:', error);
        return 0;
    }
};

/**
 * Valida que el código no exceda el límite permitido
 * @param {String} code - Código a validar
 * @returns {Object} - { valid: Boolean, message: String, size: Number }
 */
export const validateCodeSize = (code) => {
    const maxSize = 500000; // 500KB
    const size = calculateContentSize(code);

    if (size > maxSize) {
        return {
            valid: false,
            message: `El codigo excede el limite de ${formatFileSize(maxSize)} (actual: ${formatFileSize(size)})`,
            size
        };
    }

    return { valid: true, message: 'Tamaño valido', size };
};