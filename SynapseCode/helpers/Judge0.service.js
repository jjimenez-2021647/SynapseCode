'use strict';
import dotenv from 'dotenv';
dotenv.config();

const envJudge0Url = process.env.JUDGE0_API_URL;
// Si viene configurado RapidAPI, usamos el host público gratis para evitar suscripción/pago.
const JUDGE0_URL  =
    !envJudge0Url || String(envJudge0Url).includes('rapidapi.com')
        ? 'https://ce.judge0.com'
        : envJudge0Url;
const JUDGE0_KEY  = process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

// Mapeo de lenguajes del sistema → ID de lenguaje en Judge0
// IDs oficiales: https://ce.judge0.com/languages
const LANGUAGE_IDS = {
    JAVASCRIPT: 63,  // Node.js 12.14.0
    PYTHON:     71,  // Python 3.8.1
    JAVA:       62,  // Java OpenJDK 13.0.1
    CSHARP:     51,  // C# Mono 6.6.0
    HTML_CSS:   63,  // Se ejecuta como JS (solo lógica, no renderiza DOM)
};

// Headers reutilizables para todas las peticiones a Judge0
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Compatibilidad opcional con RapidAPI si explícitamente se usa ese host.
    if (String(JUDGE0_URL).includes('rapidapi.com')) {
        if (!JUDGE0_KEY) {
            throw new Error('JUDGE0_API_KEY no está definida en las variables de entorno');
        }
        headers['X-RapidAPI-Key'] = JUDGE0_KEY;
        headers['X-RapidAPI-Host'] = JUDGE0_HOST;
    }

    return headers;
};

// Mapeo de status_id de Judge0 a los estados del sistema
/**
    Convierte el status_id de Judge0 al enum del sistema
    IDs de estado Judge0: https://ce.judge0.com/statuses
 */
const mapJudge0Status = (statusId) => {
    const statusMap = {
        1:  'EXITOSO',            // In Queue
        2:  'EXITOSO',            // Processing
        3:  'EXITOSO',            // Accepted
        4:  'ERROR_RUNTIME',      // Wrong Answer
        5:  'TIMEOUT',            // Time Limit Exceeded
        6:  'ERROR_COMPILACION',  // Compilation Error
        7:  'ERROR_RUNTIME',      // Runtime Error (SIGSEGV)
        8:  'ERROR_RUNTIME',      // Runtime Error (SIGXFSZ)
        9:  'TIMEOUT',            // Runtime Error (SIGFPE)
        10: 'ERROR_RUNTIME',      // Runtime Error (SIGABRT)
        11: 'ERROR_RUNTIME',      // Runtime Error (NZEC)
        12: 'ERROR_RUNTIME',      // Runtime Error (Other)
        13: 'ERROR_RUNTIME',      // Internal Error
        14: 'MEMORIA_EXCEDIDA',   // Exec Format Error
    };

    return statusMap[statusId] || 'ERROR_RUNTIME';
};

// Funciones Principales

/**
 * Envía código a Judge0 y espera el resultado (modo wait=true)
 * @param {String} language    - Lenguaje del sistema (ej: 'PYTHON')
 * @param {String} code        - Código a ejecutar
 * @param {String} input       - stdin opcional
 * @returns {Promise<Object>}  - Resultado parseado
 */
export const executeCode = async (language, code, input = '') => {
    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin:        input,
    });

    // wait=true → Judge0 espera hasta terminar y devuelve el resultado directo
    const response = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
            method:  'POST',
            headers: getHeaders(),
            body,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondio con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return parseJudge0Response(result);
};

/**
 * Envía código a Judge0 de forma asíncrona y devuelve el token
 * Útil si quieres hacer polling en vez de esperar
 * @returns {Promise<String>} - Token de la submission
 */
export const submitCode = async (language, code, input = '') => {
    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin:        input,
    });

    const response = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=false`,
        {
            method:  'POST',
            headers: getHeaders(),
            body,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondio con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.token;
};

/**
 * Consulta el resultado de una submission por su token
 * @param {String} token - Token devuelto por submitCode
 * @returns {Promise<Object>} - Resultado parseado
 */
export const getSubmissionResult = async (token) => {
    const response = await fetch(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
            method:  'GET',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondio con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return parseJudge0Response(result);
};

// Parsear resúesta de Judge0 al formato del sistema

/**
 * Convierte la respuesta cruda de Judge0 al formato del sistema
 * @param {Object} raw - Respuesta directa de Judge0
 * @returns {Object}   - Objeto estandarizado para guardar en CodeExecution
 */
const parseJudge0Response = (raw) => {
    const normalizedOutput =
        typeof raw.stdout === 'string'
            ? raw.stdout.replace(/(?:\r?\n)+$/, '')
            : '';

    return {
        output:          normalizedOutput,
        errors:          raw.stderr          || raw.compile_output || '',
        executionTimeMs: raw.time            ? Math.round(parseFloat(raw.time) * 1000) : null,
        usedMemoryKb:    raw.memory          || 0,
        executionStatus: mapJudge0Status(raw.status?.id),
        judge0TokenId:   raw.token           || null,
        // Campos extra de Judge0 por si los necesitas en el futuro
        _raw: {
            statusId:      raw.status?.id,
            statusDesc:    raw.status?.description,
            message:       raw.message || null,
        },
    };
};
