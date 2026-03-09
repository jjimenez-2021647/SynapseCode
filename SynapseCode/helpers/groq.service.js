'use strict'

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const resolveGroqApiKey = () =>
    process.env.GROQ_API_KEY || null;

const normalizeSingleLineQuotedCode = (text) => {
    const raw = String(text || '').trim();
    if (!raw) return '';

    let cleaned = raw;

    // Quitar comillas externas si las tiene
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }

    // Quitar bloques de markdown si Groq los incluye
    cleaned = cleaned.replace(/```[\w]*\n?/g, '').replace(/```/g, '');

    // Desescapar comillas que hayan quedado escapadas
    cleaned = cleaned.replace(/\\"/g, '"');

    return cleaned.trim();
};

export const generateCodeWithGroq = async ({ prompt, languageHint = '' }) => {
    const apiKey = resolveGroqApiKey();
    if (!apiKey) {
        throw new Error('No se encontro GROQ_API_KEY en variables de entorno');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: DEFAULT_GROQ_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        'Devuelve solo codigo fuente util.',
                        'No agregues markdown ni explicaciones.',
                        'La salida final debe venir en UNA SOLA LINEA entre comillas dobles.',
                        'Si hay saltos de linea, conviertelos a espacios.',
                        `Lenguaje objetivo sugerido: ${languageHint || 'sin especificar'}.`,
                        `Solicitud: ${prompt}`,
                    ].join('\n'),
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorBody}`);
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();

    if (!text) {
        throw new Error('Groq no devolvio contenido util');
    }

    return normalizeSingleLineQuotedCode(text);
};

export default { generateCodeWithGroq };
