'use strict'

/**
 * Sistema de prompts especializados para explicaciones de código
 * Cada prompt está diseñado para un tipo específico de código
 */

const PROMPTS = {
    // ─── EXPLICACIÓN DETALLADA (por defecto) ───────────────────────────────────
    DETAILED_EXPLANATION: (code, language = 'javascript') => `
Eres un tutor experto en programación. Explica el siguiente código de forma clara, detallada y educativa para un estudiante.

INSTRUCCIONES CRÍTICAS:
- Menciona fragmentos específicos (nombres de variables, funciones, clases) pero sin copiar bloques completos
- Ejemplo correcto: "se crea la función calcularTotal()" NO: "function calcularTotal() { ... }"
- Organiza en secciones clara y bien estructuradas
- Usa ejemplos y analogías cuando sea relevante

ESTRUCTURA DE LA EXPLICACIÓN:
1. 📋 RESUMEN GENERAL (2-3 líneas sobre qué hace el programa)
2. 🔄 COMPONENTES PRINCIPALES (variables, funciones, clases utilizadas)
3. 📊 FLUJO DE EJECUCIÓN (paso a paso, línea por línea)
4. 🎯 CONCEPTOS CLAVE (patrones, algoritmos, decisiones de diseño)
5. ⏱️ COMPLEJIDAD (si aplica - temporal y espacial)
6. ⚠️ POSIBLES MEJORAS O ERRORES COMUNES

---
Lenguaje: ${language}

CÓDIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // ─── EXPLICACIÓN ALGORITMOS ───────────────────────────────────────────────
    ALGORITHM_EXPLANATION: (code, language = 'javascript') => `
Eres un experto en análisis de algoritmos. Analiza el siguiente código algoritmo de forma profunda:

ESTRUCTURA DEL ANÁLISIS:
1. 🎯 NOMBRE DEL ALGORITMO (qué algoritmo es: ordenamiento, búsqueda, etc.)
2. 📥 ENTRADA/SALIDA (qué recibe, qué retorna, con ejemplos concretos)
3. 🔍 ANÁLISIS PASO A PASO (detallado, con valores de ejemplo)
4. 📈 COMPLEJIDAD (temporal O(?) y espacial O(?), peor/medio/mejor caso)
5. ✅ CORRECTNESS (¿es correcto? edge cases, casos especiales)
6. 💡 CASOS DE USO (cuándo usar este algoritmo)
7. 🚀 OPTIMIZACIONES (cómo mejorar rendimiento)

IMPORTANTE:
- Sé específico con Big O notation
- Menciona edge cases (array vacío, valores negativos, etc.)
- Explica por qué tiene esa complejidad

---
Lenguaje: ${language}

CÓDIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // ─── EXPLICACIÓN ESTRUCTURAS DE DATOS ───────────────────────────────────
    DATASTRUCTURE_EXPLANATION: (code, language = 'javascript') => `
Eres un experto en estructuras de datos. Analiza el siguiente código enfocándote en las estructuras de datos utilizadas:

ESTRUCTURA DEL ANÁLISIS:
1. 🏗️ ESTRUCTURAS UTILIZADAS (Arrays, Objetos, Árboles, etc. - identifica cada una)
2. 📍 OPERACIONES PRINCIPALES (qué operaciones realiza: inserción, búsqueda, eliminación, etc.)
3. ⏱️ COMPLEJIDAD DE OPERACIONES (O(?) para cada operación principal)
4. 🌊 FLUJO DE DATOS (cómo fluyen los datos a través de las estructuras)
5. 💾 USO DE MEMORIA (cómo se distribuye la memoria, overhead)
6. 🔄 MÉTODOS Y PROPIEDADES (métodos del objeto/clase, para qué sirven)
7. ⚙️ OPTIMIZACIONES POSIBLES (qué estructura alternativa sería mejor)

IMPORTANTE:
- Sé visual, explica visualmente cómo se organiza la memoria
- Menciona trade-offs (memoria vs velocidad)
- Sugiere alternativas si existen

---
Lenguaje: ${language}

CÓDIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // ─── PROMPT PARA CHAT CONVERSACIONAL ───────────────────────────────────────
    CODE_CHAT: (code, language = 'javascript', history = [], userQuestion) => {
        const messages = history
            .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
            .join('\n');

        return `Eres un tutor experto en programación. El usuario está estudiando este código y tiene una pregunta.

CONTEXTO:
Lenguaje: ${language}

CÓDIGO BAJO ESTUDIO:
\`\`\`${language}
${code}
\`\`\`

HISTORIAL DE CONVERSACIÓN:
${messages || '(sin historial previo)'}

PREGUNTA DEL USUARIO:
${userQuestion}

INSTRUCCIONES:
- Responde de forma clara y concisa
- Usa ejemplos cuando sea necesario
- Mantén el contexto del código anterior
- Si la pregunta no está relacionada con el código, sugiere volver al tema
- Proporciona explicaciones progresivas (de simple a complejo)

RESPUESTA:
`;
    },
};

/**
 * Detecta el tipo de código para usar el prompt más apropiado
 * Retorna: 'ALGORITHM', 'DATASTRUCTURE', 'BASIC'
 */
export const detectCodeType = (code) => {
    const lowerCode = code.toLowerCase();

    // Palabras clave para algoritmos
    const algorithmKeywords = [
        'sort', 'search', 'binary', 'recursive', 'fibonacci',
        'bubble', 'merge', 'quick', 'insertion', 'selection',
        'dfs', 'bfs', 'dijkstra', 'bellman', 'floyd',
        'dynamic', 'greedy', 'backtrack', 'permutation', 'combination'
    ];

    // Palabras clave para estructuras de datos
    const dsKeywords = [
        'tree', 'graph', 'node', 'stack', 'queue', 'heap',
        'linkedlist', 'doublylinked', 'circular', 'trie',
        'hashmap', 'hashtable', 'bucket', 'collision'
    ];

    // Contar coincidencias
    const algorithmCount = algorithmKeywords.filter(kw => lowerCode.includes(kw)).length;
    const dsCount = dsKeywords.filter(kw => lowerCode.includes(kw)).length;

    // Detectar también patrones
    const hasLoop = /\bfor\b|\bwhile\b|\bforeach\b/.test(lowerCode);
    const hasRecursion = /\bfunction\b.*\b\1\s*\(|\b\w+\s*\(.*\)\s*{[\s\S]*\b\1\s*\(/.test(lowerCode);
    const hasClass = /\bclass\b|\bconstructor\b/.test(lowerCode);

    if (algorithmCount >= 2 || hasRecursion) {
        return 'ALGORITHM';
    }
    if (dsCount >= 2 || hasClass) {
        return 'DATASTRUCTURE';
    }

    return 'BASIC';
};

/**
 * Selecciona el prompt apropiado basado en el tipo de código
 */
export const selectPrompt = (code, language = 'javascript', codeType = null) => {
    const type = codeType || detectCodeType(code);

    switch (type) {
        case 'ALGORITHM':
            return PROMPTS.ALGORITHM_EXPLANATION(code, language);
        case 'DATASTRUCTURE':
            return PROMPTS.DATASTRUCTURE_EXPLANATION(code, language);
        default:
            return PROMPTS.DETAILED_EXPLANATION(code, language);
    }
};

/**
 * Obtiene el prompt para el chat conversacional
 */
export const getChatPrompt = (code, language = 'javascript', history = [], userQuestion) => {
    return PROMPTS.CODE_CHAT(code, language, history, userQuestion);
};

export default {
    PROMPTS,
    detectCodeType,
    selectPrompt,
    getChatPrompt,
};
