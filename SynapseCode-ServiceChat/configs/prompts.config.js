'use strict'

/**
 * Sistema de prompts especializados para explicaciones de codigo
 * Cada prompt esta disenado para un tipo especifico de codigo
 */

const PROMPTS = {
    // EXPLICACION DETALLADA (por defecto)
    DETAILED_EXPLANATION: (code, language = 'javascript') => `
Eres un tutor experto en programacion. Explica el siguiente codigo de forma clara, detallada y educativa para un estudiante.

INSTRUCCIONES CRITICAS:
- Menciona fragmentos especificos (nombres de variables, funciones, clases) pero sin copiar bloques completos
- Ejemplo correcto: "se crea la funcion calcularTotal()" NO: "function calcularTotal() { ... }"
- Organiza en secciones clara y bien estructuradas
- Usa ejemplos y analogias cuando sea relevante

ESTRUCTURA DE LA EXPLICACION:
1. RESUMEN GENERAL (2-3 lineas sobre que hace el programa)
2. COMPONENTES PRINCIPALES (variables, funciones, clases utilizadas)
3. FLUJO DE EJECUCION (paso a paso, linea por linea)
4. CONCEPTOS CLAVE (patrones, algoritmos, decisiones de diseno)
5. COMPLEJIDAD (si aplica - temporal y espacial)
6. POSIBLES MEJORAS O ERRORES COMUNES

---
Lenguaje: ${language}

CODIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // EXPLICACION ALGORITMOS
    ALGORITHM_EXPLANATION: (code, language = 'javascript') => `
Eres un experto en analisis de algoritmos. Analiza el siguiente codigo algoritmo de forma profunda:

ESTRUCTURA DEL ANALISIS:
1. NOMBRE DEL ALGORITMO (que algoritmo es: ordenamiento, busqueda, etc.)
2. ENTRADA/SALIDA (que recibe, que retorna, con ejemplos concretos)
3. ANALISIS PASO A PASO (detallado, con valores de ejemplo)
4. COMPLEJIDAD (temporal O(?) y espacial O(?), peor/medio/mejor caso)
5. CORRECTNESS (es correcto? edge cases, casos especiales)
6. CASOS DE USO (cuando usar este algoritmo)
7. OPTIMIZACIONES (como mejorar rendimiento)

IMPORTANTE:
- Se especifico con Big O notation
- Menciona edge cases (array vacio, valores negativos, etc.)
- Explica por que tiene esa complejidad

---
Lenguaje: ${language}

CODIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // EXPLICACION ESTRUCTURAS DE DATOS
    DATASTRUCTURE_EXPLANATION: (code, language = 'javascript') => `
Eres un experto en estructuras de datos. Analiza el siguiente codigo enfocandote en las estructuras de datos utilizadas:

ESTRUCTURA DEL ANALISIS:
1. ESTRUCTURAS UTILIZADAS (Arrays, Objetos, Arboles, etc. - identifica cada una)
2. OPERACIONES PRINCIPALES (que operaciones realiza: insercion, busqueda, eliminacion, etc.)
3. COMPLEJIDAD DE OPERACIONES (O(?) para cada operacion principal)
4. FLUJO DE DATOS (como fluyen los datos a traves de las estructuras)
5. USO DE MEMORIA (como se distribuye la memoria, overhead)
6. METODOS Y PROPIEDADES (metodos del objeto/clase, para que sirven)
7. OPTIMIZACIONES POSIBLES (que estructura alternativa seria mejor)

IMPORTANTE:
- Se visual, explica visualmente como se organiza la memoria
- Menciona trade-offs (memoria vs velocidad)
- Sugiere alternativas si existen

---
Lenguaje: ${language}

CODIGO:
\`\`\`${language}
${code}
\`\`\`
`,

    // PROMPT PARA CHAT CONVERSACIONAL
    CODE_CHAT: (code, language = 'javascript', history = [], userQuestion) => {
        const messages = history
            .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
            .join('\n');

        return `Eres un tutor experto en programacion. El usuario esta estudiando este codigo y tiene una pregunta.

CONTEXTO:
Lenguaje: ${language}

CODIGO BAJO ESTUDIO:
\`\`\`${language}
${code}
\`\`\`

HISTORIAL DE CONVERSACION:
${messages || '(sin historial previo)'}

PREGUNTA DEL USUARIO:
${userQuestion}

INSTRUCCIONES:
- Responde de forma clara y concisa
- Usa ejemplos cuando sea necesario
- Manten el contexto del codigo anterior
- Si la pregunta no esta relacionada con el codigo, sugiere volver al tema
- Proporciona explicaciones progresivas (de simple a complejo)

RESPUESTA:
`;
    },

    // GENERACION INCREMENTAL DE CODIGO
    INCREMENTAL_CODE_GENERATION: (currentCode, language = 'javascript', userRequest) => {
        return `Eres un experto programador. Tu tarea es MEJORAR y CONTINUAR el codigo existente.

INSTRUCCIONES CRITICAS:
1. NO reescribas TODO el codigo desde cero
2. LEE cuidadosamente el codigo actual
3. CONTINUA/MEJORA basandote en lo existente
4. Manten el mismo estilo y estructura
5. Solo agrega/modifica lo necesario

CONTEXTO:
Lenguaje: ${language}

CODIGO ACTUAL (base):
\`\`\`${language}
${currentCode}
\`\`\`

SOLICITUD DEL USUARIO:
${userRequest}

INSTRUCCIONES DE SALIDA:
- Devuelve SOLO el codigo completo actualizado (sin markdown, sin explicaciones)
- El codigo debe ser funcional y completo
- Manten la estructura original, solo agrega/mejora
- Si necesitas agregar comentarios, hazlo SOLO si es critico

CODIGO MEJORADO:
`;
    },
};

/**
 * Detecta el tipo de codigo para usar el prompt mas apropiado
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

    // Detectar tambien patrones
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
 * Selecciona el prompt apropiado basado en el tipo de codigo
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

/**
 * Obtiene el prompt para generacion incremental de codigo
 */
export const getIncrementalCodePrompt = (currentCode, language = 'javascript', userRequest) => {
    return PROMPTS.INCREMENTAL_CODE_GENERATION(currentCode, language, userRequest);
};

export default {
    PROMPTS,
    detectCodeType,
    selectPrompt,
    getChatPrompt,
    getIncrementalCodePrompt,
};
