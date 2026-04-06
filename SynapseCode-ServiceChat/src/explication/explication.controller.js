'use strict'
import Explanation from './explication.model.js';
import { generateCodeWithGroq } from '../../helpers/groq.service.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Helper: genera prompt para explicar código
 */
const generateExplanationPrompt = (code) => {
    return `Explica el siguiente código de forma clara y paso a paso para un estudiante.` +
        `

ATENCIÓN: Debes **mencionar fragmentos específicos** (nombres de clases, métodos, variables) pero sin copiar bloques de código completos.` +
        `

Ejemplos de cómo hacer referencias:` +
        `
- "se crea la clase Main" (NO: "public class Main { }")` +
        `
- "el método main es el punto de entrada" (NO: "public static void main(...) { }")` +
        `
- "se llama a System.out.println para imprimir" (NO: "System.out.println(\"texto\");")` +
        `
- "se declara una variable String llamada nombre" (NO: "String nombre = ...;")` +
        `

Describe:` +
        `
- Qué hace el programa en general.` +
        `
- Cuáles son sus partes principales.` +
        `
- Cómo funciona el algoritmo o lógica utilizada.` +
        `

Organiza la explicación por secciones, con referencias específicas a elementos del código.` +
        `

Ejemplo de formato:` +
        `

1. Clase o estructura principal: Menciona el nombre de la clase y su función.
2. Método o función principal: Menciona el nombre del método y qué hace.
3. Variables o estructuras usadas: Menciona nombres de variables.
4. Bucles o condiciones: Menciona tipos y qué controlan.
5. Lógica del algoritmo: Explica paso a paso cómo funciona.

---

Código a explicar:
${code}`;
};

/**
 * Helper: limpia la respuesta de Groq removiendo código duplicado
 */
const cleanExplanation = (explanation, code) => {
    const codeTrim = code.trim();
    let cleaned = explanation.trim();

    // intenta eliminar el código de varias formas comunes
    if (cleaned.startsWith(codeTrim)) {
        console.log('cleanExplanation: removing code (direct)');
        cleaned = cleaned.slice(codeTrim.length).trim();
    } else if (cleaned.startsWith(`"${codeTrim}"`)) {
        console.log('cleanExplanation: removing code (double quoted)');
        cleaned = cleaned.slice(`"${codeTrim}"`.length).trim();
    } else if (cleaned.startsWith(`'${codeTrim}'`)) {
        console.log('cleanExplanation: removing code (single quoted)');
        cleaned = cleaned.slice(`'${codeTrim}'`.length).trim();
    }

    // limpia delimitadores al inicio
    cleaned = cleaned.replace(/^[\s:\n-]+/u, '').trim();
    return cleaned;
};

/**
 * Genera una explicación del código usando Groq
 * Recibe el código en el body, lo genera con Groq y lo guarda
 */
export const explainCode = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, code, language = 'javascript', version = 0 } = req.body;

        if (!code || !code.trim()) {
            return res.status(200).json({
                success: true,
                data: { explanation: 'El código está vacío.' },
            });
        }

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const prompt = generateExplanationPrompt(code);
        let explanation = await generateCodeWithGroq({
            prompt,
            languageHint: language || '',
        });

        explanation = cleanExplanation(explanation, code);

        // registrar la explicación en la base de datos
        let explanationId = null;
        try {
            const createdExplanation = await Explanation.create({
                userId,
                fileId,
                version,
                language,
                code,
                explanation,
            });
            explanationId = createdExplanation._id;
        } catch (saveError) {
            console.error('Error guardando explicación:', saveError);
            // no bloqueamos la respuesta al usuario
        }

        return res.status(200).json({
            success: true,
            data: { code, explanation, explanationId },
        });
    } catch (error) {
        console.error('explainCode error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generando explicación',
            error: 'EXPLAIN_CODE_ERROR',
        });
    }
};

/**
 * Crear una explicación manualmente
 */
export const createExplanation = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, version, language, code, explanation } = req.body;

        if (!fileId || !code || !explanation) {
            return res.status(400).json({
                success: false,
                message: 'fileId, code y explanation son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        const exp = await Explanation.create({
            userId,
            fileId,
            version: version || 0,
            language: language || 'javascript',
            code,
            explanation,
        });

        return res.status(201).json({
            success: true,
            data: exp,
        });
    } catch (error) {
        console.error('createExplanation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'CREATE_EXPLANATION_ERROR',
        });
    }
};

/**
 * Listar explicaciones filtrando por fileId y/o userId
 */
export const listExplanations = async (req, res) => {
    try {
        const { fileId, userId, version } = req.query;
        const filters = {};

        if (fileId) filters.fileId = fileId;
        if (userId) filters.userId = userId;
        if (version !== undefined) filters.version = parseInt(version, 10);

        const explanations = await Explanation.find(filters).sort({ createdAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            count: explanations.length,
            data: explanations,
        });
    } catch (error) {
        console.error('listExplanations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo explicaciones',
            error: 'LIST_EXPLANATIONS_ERROR',
        });
    }
};

/**
 * Obtener una explicación por su ID
 */
export const getExplanationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID es obligatorio',
                error: 'MISSING_ID',
            });
        }

        const explanation = await Explanation.findById(id).lean();

        if (!explanation) {
            return res.status(404).json({
                success: false,
                message: 'Explicación no encontrada',
                error: 'EXPLANATION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            data: explanation,
        });
    } catch (error) {
        console.error('getExplanationById error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo la explicación',
            error: 'GET_EXPLANATION_ERROR',
        });
    }
};

/**
 * Eliminar una explicación
 */
export const deleteExplanation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID es obligatorio',
                error: 'MISSING_ID',
            });
        }

        const explanation = await Explanation.findByIdAndDelete(id);

        if (!explanation) {
            return res.status(404).json({
                success: false,
                message: 'Explicación no encontrada',
                error: 'EXPLANATION_NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Explicación eliminada exitosamente',
        });
    } catch (error) {
        console.error('deleteExplanation error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error eliminando la explicación',
            error: 'DELETE_EXPLANATION_ERROR',
        });
    }
};