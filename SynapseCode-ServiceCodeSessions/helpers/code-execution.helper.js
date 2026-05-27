'use strict'
import dotenv from 'dotenv';

dotenv.config();

const JUDGE0_URL =
    !process.env.JUDGE0_API_URL || String(process.env.JUDGE0_API_URL).includes('rapidapi.com')
        ? 'https://ce.judge0.com'
        : process.env.JUDGE0_API_URL;
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

// Mapeo de lenguajes → IDs Judge0
const LANGUAGE_IDS = {
    JAVASCRIPT: 63,
    PYTHON: 71,
    JAVA: 62,
    CSHARP: 51,
    HTML_CSS: 63,
    TYPESCRIPT: 74,
    GO: 60,
    RUST: 73,
    CPP: 34,
    C: 1,
    BASH: 81,
    SQL: 82,
    PHP: 68,
    RUBY: 72,
    KOTLIN: 75,
    SWIFT: 70,
    R: 77,
    HASKELL: 93,
    DART: 95,
    SCALA: 80,
    ELIXIR: 88,
    CLOJURE: 90,
    OBJECTIVEC: 79,
    FSHARP: 89,
    GROOVY: 91,
    ERLANG: 92,
    PERL: 76,
    PASCAL: 83,
    LUA: 84,
    ASSEMBLY: 85,
    FORTRAN: 86,
    PROLOG: 87,
    JULIA: 94,
};

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (String(JUDGE0_URL).includes('rapidapi.com')) {
        if (!JUDGE0_KEY) {
            throw new Error('JUDGE0_API_KEY no está definida');
        }
        headers['X-RapidAPI-Key'] = JUDGE0_KEY;
        headers['X-RapidAPI-Host'] = JUDGE0_HOST;
    }

    return headers;
};

// Mapeo de status Judge0
const mapJudge0Status = (statusId) => {
    const statusMap = {
        1: 'EXITOSO',
        2: 'EXITOSO',
        3: 'EXITOSO',
        4: 'ERROR_RUNTIME',
        5: 'TIMEOUT',
        6: 'ERROR_COMPILACION',
        7: 'ERROR_RUNTIME',
        8: 'ERROR_RUNTIME',
        9: 'TIMEOUT',
        10: 'ERROR_RUNTIME',
        11: 'ERROR_RUNTIME',
        12: 'ERROR_RUNTIME',
        13: 'ERROR_RUNTIME',
        14: 'MEMORIA_EXCEDIDA',
    };

    return statusMap[statusId] || 'ERROR_RUNTIME';
};

const parseJudge0Response = (raw) => {
    const normalizedOutput =
        typeof raw.stdout === 'string' ? raw.stdout.replace(/(?:\r?\n)+$/, '') : '';

    return {
        output: normalizedOutput,
        errors: raw.stderr || raw.compile_output || '',
        executionTimeMs: raw.time ? Math.round(parseFloat(raw.time) * 1000) : null,
        usedMemoryKb: raw.memory || 0,
        executionStatus: mapJudge0Status(raw.status?.id),
        judge0TokenId: raw.token || null,
    };
};

/**
 * Ejecutar código con Judge0 (síncrono)
 */
export const executeCode = async (language, code, input = '') => {
    const languageId = LANGUAGE_IDS[language.toUpperCase()];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
    });

    const response = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
            method: 'POST',
            headers: getHeaders(),
            body,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondió con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return parseJudge0Response(result);
};

/**
 * Enviar código de forma asíncrona
 */
export const submitCodeAsync = async (language, code, input = '') => {
    const languageId = LANGUAGE_IDS[language.toUpperCase()];

    if (!languageId) {
        throw new Error(`Lenguaje '${language}' no tiene un ID de Judge0 asignado`);
    }

    const body = JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
    });

    const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false`, {
        method: 'POST',
        headers: getHeaders(),
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondió con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.token;
};

/**
 * Obtener resultado por token
 */
export const getSubmissionResult = async (token) => {
    const response = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 respondió con status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return parseJudge0Response(result);
};

export default {
    executeCode,
    submitCodeAsync,
    getSubmissionResult,
    LANGUAGE_IDS,
};
