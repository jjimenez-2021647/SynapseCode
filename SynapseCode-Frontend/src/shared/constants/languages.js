/**
 * Lenguajes soportados para las salas (desde Judge0)
 * Se obtienen dinamicamente del backend al cargar el componente
 */

/**
 * Lenguajes fallback en caso de error al cargar desde el backend
 * Estos son todos los lenguajes populares de Judge0
 */
export const FALLBACK_LANGUAGES = [
    { id: 63, name: 'JavaScript' },
    { id: 71, name: 'Python' },
    { id: 62, name: 'Java' },
    { id: 51, name: 'C#' },
    { id: 34, name: 'C' },
    { id: 10, name: 'C++' },
    { id: 3, name: 'C' },
    { id: 1, name: 'NASM' },
    { id: 66, name: 'Go' },
    { id: 72, name: 'TypeScript' },
    { id: 55, name: 'Rust' },
    { id: 73, name: 'Ruby' },
    { id: 27, name: 'PHP' },
    { id: 67, name: 'Kotlin' },
    { id: 47, name: 'Scala' },
    { id: 68, name: 'Swift' },
    { id: 23, name: 'SQL' },
    { id: 69, name: 'Dart' },
    { id: 44, name: 'Bash' },
    { id: 59, name: 'Clojure' },
    { id: 60, name: 'Elixir' },
    { id: 61, name: 'Erlang' },
    { id: 70, name: 'Haskell' },
    { id: 50, name: 'F#' },
    { id: 74, name: 'Perl' },
    { id: 75, name: 'Prolog' },
    { id: 76, name: 'Lua' },
    { id: 58, name: 'Groovy' },
    { id: 77, name: 'Julia' },
    { id: 78, name: 'Pascal' },
    { id: 79, name: 'Fortran' },
    { id: 80, name: 'Objective-C' },
    { id: 81, name: 'Assembly' },
];

/**
 * Funcion para obtener todos los lenguajes soportados desde Judge0
 * @returns {Promise<Array>} - Array de lenguajes con id y name
 */
export const fetchSupportedLanguages = async () => {
    try {
        const possibleUrls = [
            'http://localhost:3010/api/v1/codeExecutions/languages',
            `${import.meta.env.VITE_SYNAPSECODE_URL}/api/v1/codeExecutions/languages`,
        ].filter(url => url && !url.includes('undefined'));

        for (const url of possibleUrls) {
            try {
                const response = await fetch(url, { timeout: 3000 });

                if (response.ok) {
                    const data = await response.json();
                    const languages = Array.isArray(data) ? data : (data.data || data || []);

                    if (Array.isArray(languages) && languages.length > 0) {
                        console.log(`Lenguajes obtenidos exitosamente de ${url}:`, languages.length);
                        return languages;
                    }
                }
            } catch (e) {
                console.debug(`URL no disponible: ${url}`, e.message);
            }
        }

        console.warn('No se pudo conectar a ningun endpoint, usando fallback');
        return FALLBACK_LANGUAGES;
    } catch (error) {
        console.error('Error obteniendo lenguajes:', error);
        return FALLBACK_LANGUAGES;
    }
};

/**
 * Obtener etiqueta legible de un ID de lenguaje
 */
export const getLanguageName = (id) => {
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
        return typeof id === 'string' ? id : 'Lenguaje desconocido';
    }

    const language = FALLBACK_LANGUAGES.find((lang) => lang.id === numericId);
    return language?.name || `Lenguaje ${numericId}`;
};
