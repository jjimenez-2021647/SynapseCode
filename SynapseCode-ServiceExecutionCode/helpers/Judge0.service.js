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
    // Lenguajes originales
    JAVASCRIPT:   63,  // Node.js 12.14.0
    PYTHON:       71,  // Python 3.8.1
    JAVA:         62,  // Java OpenJDK 13.0.1
    CSHARP:       51,  // C# Mono 6.6.0
    HTML_CSS:     54,  // JavaScript alternativo (se ejecuta el JS, HTML/CSS se renderiza en cliente)
    
    // Lenguajes adicionales
    TYPESCRIPT:   74,  // TypeScript 3.7.4
    GO:           60,  // Go 1.13.5
    RUST:         73,  // Rustc 1.40.0
    CPP:          34,  // C++ GCC 9.2.0
    C:            1,   // C GCC 9.2.0
    BASH:         81,  // Bash 4.4.20
    SQL:          82,  // SQLite 3.27.2
    PHP:          68,  // PHP 7.4.1
    RUBY:         72,  // Ruby 2.7.0
    KOTLIN:       75,  // Kotlin 1.3.70
    SWIFT:        70,  // Swift 5.1.3
    R:            77,  // R 3.6.1
    HASKELL:      93,  // GHC 8.8.1
    DART:         95,  // Dart 2.7.0
    SCALA:        80,  // Scala 2.13.5
    ELIXIR:       88,  // Elixir 1.9.4
    CLOJURE:      90,  // Clojure 1.10.1
    OBJECTIVEC:   79,  // Objective-C Clang 10.0.0
    FSHARP:       89,  // F# Mono 6.6.0
    GROOVY:       91,  // Groovy 2.5.8
    ERLANG:       92,  // Erlang/OTP 22.2
    PERL:         76,  // Perl 5.28.1
    PASCAL:       83,  // Pascal FPC 3.0.4
    LUA:          84,  // Lua 5.3.5
    ASSEMBLY:     85,  // Assembly (x86) NASM 2.14.02
    FORTRAN:      86,  // Fortran GFortran 9.2.0
    PROLOG:       87,  // Prolog GNU Prolog 1.4.5
    JULIA:        94,  // Julia 1.3.0
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

// Función para convertir string a base64
const encodeBase64 = (str) => {
    return Buffer.from(str).toString('base64');
};

// Función para convertir base64 a string
const decodeBase64 = (base64) => {
    return Buffer.from(base64, 'base64').toString('utf-8');
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
 * @param {Number} timeLimit   - Límite de tiempo en segundos (opcional)
 * @returns {Promise<Object>}  - Resultado parseado
 */
export const executeCode = async (language, code, input = '', timeLimit = null) => {
    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: encodeBase64(code),
        language_id: languageId,
        stdin: input ? encodeBase64(input) : '',
        base64_encoded: true,
        ...(timeLimit && { time_limit: timeLimit }), // Agregar límite de tiempo si se especifica
    });

    // wait=true → Judge0 espera hasta terminar y devuelve el resultado directo
    const response = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
        {
            method: 'POST',
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
 * @param {String} language    - Lenguaje del sistema (ej: 'PYTHON')
 * @param {String} code        - Código a ejecutar
 * @param {String} input       - stdin opcional
 * @param {Number} timeLimit   - Límite de tiempo en segundos (opcional)
 * @returns {Promise<String>} - Token de la submission
 */
export const submitCode = async (language, code, input = '', timeLimit = null) => {
    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: encodeBase64(code),
        language_id: languageId,
        stdin: input ? encodeBase64(input) : '',
        base64_encoded: true,
        ...(timeLimit && { time_limit: timeLimit }), // Agregar límite de tiempo si se especifica
    });

    const response = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=true`,
        {
            method: 'POST',
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
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
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

// Parsear respuesta de Judge0 al formato del sistema

/**
 * Convierte la respuesta cruda de Judge0 al formato del sistema
 * @param {Object} raw - Respuesta directa de Judge0
 * @returns {Object}   - Objeto estandarizado para guardar en CodeExecution
 */
const parseJudge0Response = (raw) => {
    // Decodificar base64 si es necesario
    let stdout = '';
    let stderr = '';

    try {
        stdout =
            typeof raw.stdout === 'string' && raw.stdout
                ? decodeBase64(raw.stdout)
                : '';
    } catch (e) {
        stdout = raw.stdout || '';
    }

    try {
        stderr =
            typeof raw.stderr === 'string' && raw.stderr
                ? decodeBase64(raw.stderr)
                : '';
    } catch (e) {
        stderr = raw.stderr || '';
    }

    const compileOutput =
        typeof raw.compile_output === 'string' && raw.compile_output
            ? decodeBase64(raw.compile_output)
            : '';

    const normalizedOutput = stdout.replace(/(?:\r?\n)+$/, '');

    return {
        output:          normalizedOutput,
        errors:          stderr || compileOutput || '',
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

/**
 * Retorna la lista completa de lenguajes soportados con su información
 * @returns {Array} - Array con todos los lenguajes soportados
 */
export const getSupportedLanguages = () => {
    // Mapeo de descripciones para cada lenguaje
    const languageDescriptions = {
        JAVASCRIPT:   'Node.js 12.14.0',
        PYTHON:       'Python 3.8.1',
        JAVA:         'Java OpenJDK 13.0.1',
        CSHARP:       'C# Mono 6.6.0',
        HTML_CSS:     'JavaScript/Node.js',
        TYPESCRIPT:   'TypeScript 3.7.4',
        GO:           'Go 1.13.5',
        RUST:         'Rustc 1.40.0',
        CPP:          'C++ GCC 9.2.0',
        C:            'C GCC 9.2.0',
        BASH:         'Bash 4.4.20',
        SQL:          'SQLite 3.27.2',
        PHP:          'PHP 7.4.1',
        RUBY:         'Ruby 2.7.0',
        KOTLIN:       'Kotlin 1.3.70',
        SWIFT:        'Swift 5.1.3',
        R:            'R 3.6.1',
        HASKELL:      'GHC 8.8.1',
        DART:         'Dart 2.7.0',
        SCALA:        'Scala 2.13.5',
        ELIXIR:       'Elixir 1.9.4',
        CLOJURE:      'Clojure 1.10.1',
        OBJECTIVEC:   'Objective-C Clang 10.0.0',
        FSHARP:       'F# Mono 6.6.0',
        GROOVY:       'Groovy 2.5.8',
        ERLANG:       'Erlang/OTP 22.2',
        PERL:         'Perl 5.28.1',
        PASCAL:       'Pascal FPC 3.0.4',
        LUA:          'Lua 5.3.5',
        ASSEMBLY:     'Assembly (x86) NASM 2.14.02',
        FORTRAN:      'Fortran GFortran 9.2.0',
        PROLOG:       'Prolog GNU Prolog 1.4.5',
        JULIA:        'Julia 1.3.0',
    };

    return Object.entries(LANGUAGE_IDS).map(([language, judge0Id]) => ({
        language,
        judge0Id,
        description: languageDescriptions[language] || 'Lenguaje soportado',
    }));
};

export default { executeCode, submitCode, getSubmissionResult, getSupportedLanguages };
