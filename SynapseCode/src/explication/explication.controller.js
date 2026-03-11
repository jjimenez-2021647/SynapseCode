'use strict'
import File from '../files/files.model.js';
import CodeSession from '../codeSessions/codeSessions.model.js';
import Explanation from './explication.model.js';
import { generateCodeWithGroq } from '../../helpers/groq.service.js';

/**
 * Helper: obtiene la versión más reciente de un archivo (0 si no hay sesiones)
 */
const getCurrentFileVersion = async (fileId) => {
    try {
        const last = await CodeSession.findOne({ fileId }).sort({ version: -1 }).lean();
        return last ? last.version : 0;
    } catch (err) {
        console.error('getCurrentFileVersion error:', err);
        return 0;
    }
};

/**
 * Genera una explicación del código que exista en un archivo específico.
 * El usuario debe tener acceso a la sala donde está el archivo (middleware lo valida).
 */
export const explainFile = async (req, res) => {
    try {
        const { idFile } = req.params;
        console.log(`explainFile called with idFile='${idFile}'`);

        if (!idFile) {
            console.warn('explainFile: idFile missing');
            return res.status(400).json({
                success: false,
                message: 'idFile es obligatorio en la ruta',
                error: 'MISSING_FILE_ID',
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(idFile)) {
            console.warn('explainFile: invalid ObjectId format', idFile);
            return res.status(400).json({
                success: false,
                message: 'Formato de idFile invalido',
                error: 'INVALID_FILE_ID',
            });
        }

        const file = await File.findById(idFile).lean();
        if (!file) {
            console.warn('explainFile: file not found', idFile);
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                error: 'FILE_NOT_FOUND',
            });
        }

        const code = String(file.currentCode || '').trim();
        if (!code) {
            return res.status(200).json({
                success: true,
                data: { explanation: 'El archivo no contiene código para explicar.' },
            });
        }

        const prompt = `Explica el siguiente código de forma clara y paso a paso para un estudiante.` +
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

1. Clase o estructura principal  ` +
            `
Menciona el nombre de la clase (ej: "la clase Main es...") y su función.` +
            `

2. Método o función principal  ` +
            `
Menciona el nombre del método (ej: "el método main...") y qué hace.` +
            `

3. Variables o estructuras usadas  ` +
            `
Menciona nombres de variables (ej: "se usa la variable contador para...").` +
            `

4. Bucles o condiciones  ` +
            `
Menciona tipos (ej: "el bucle for itera...") y qué controlan.` +
            `

5. Lógica del algoritmo  ` +
            `
Explica paso a paso cómo funciona (ej: "primero se crea..., luego se invoca...").` +
            `

---` +
            `

Código a explicar:` +
            `
${code}`;

        let explanation = await generateCodeWithGroq({
            prompt,
            languageHint: file.language || '',
        });

        // si la IA incluyó o repitió el código literal al inicio, eliminarlo
        const codeTrim = code.trim();
        let cleaned = explanation.trim();

        // intenta eliminar el código de varias formas comunes:
        // 1. código directo
        if (cleaned.startsWith(codeTrim)) {
            console.log('explainFile: stripping code (direct)');
            cleaned = cleaned.slice(codeTrim.length).trim();
        } else if (cleaned.startsWith(`"${codeTrim}"`)) {
            // 2. dentro de comillas dobles
            console.log('explainFile: stripping code (double quoted)');
            cleaned = cleaned.slice(`"${codeTrim}"`.length).trim();
        } else if (cleaned.startsWith(`'${codeTrim}'`)) {
            // 3. dentro de comillas simples
            console.log('explainFile: stripping code (single quoted)');
            cleaned = cleaned.slice(`'${codeTrim}'`.length).trim();
        } else if (cleaned.startsWith(`\"${codeTrim}\"`) || cleaned.startsWith(`\\'${codeTrim}\\'`)) {
            // 4. con comillas escapadas
            console.log('explainFile: stripping code (escaped quotes)');
            cleaned = cleaned.replace(/^[\s\\"']*/, '').trim();
        }

        // limpia cualquier delimitador al inicio (newlines, colons, guiones)
        cleaned = cleaned.replace(/^[\s:\n-]+/u, '').trim();
        explanation = cleaned;

        // registrar la explicación en la base de datos
        let explanationId = null;
        try {
            const version = await getCurrentFileVersion(idFile);
            const createdExplanation = await Explanation.create({
                userId: req.user.userId,
                fileId: idFile,
                version,
                language: file.language,
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
        console.error('explainFile error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generando explicación',
            error: 'EXPLAIN_FILE_ERROR',
        });
    }
};

// Listar explicaciones filtrando por fileId (requerido)
export const listExplanations = async (req, res) => {
    try {
        // fileId puede venir de query string O de params.idFile (via middleware)
        const fileId = req.query.fileId || req.params.idFile;
        const { version, userId } = req.query;
        
        if (!fileId) {
            console.warn('listExplanations: missing fileId in query or params', { query: req.query, params: req.params });
            return res.status(400).json({
                success: false,
                message: 'fileId es obligatorio',
                error: 'MISSING_FILE_ID',
            });
        }

        const filter = { fileId };
        if (version) {
            filter.version = parseInt(version, 10);
        }
        if (userId) {
            filter.userId = userId;
        }

        const explanations = await Explanation.find(filter).sort({ createdAt: -1 }).lean();
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

// Obtener una explicación por su ID (req.explanation puede estar cargada por middleware)
export const getExplanationById = async (req, res) => {
    try {
        const explanation = req.explanation || (await Explanation.findById(req.params.id).lean());
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
        return res.status(400).json({
            success: false,
            message: error.message || 'Error obteniendo la explicación',
            error: 'GET_EXPLANATION_ERROR',
        });
    }
};

// Eliminar una explicación
export const deleteExplanation = async (req, res) => {
    try {
        const explanation = req.explanation || (await Explanation.findById(req.params.id));
        if (!explanation) {
            return res.status(404).json({
                success: false,
                message: 'Explicación no encontrada',
                error: 'EXPLANATION_NOT_FOUND',
            });
        }
        const explanationId = req.params.id;
        await Explanation.findByIdAndDelete(explanationId);
        return res.status(200).json({
            success: true,
            message: 'Explicación eliminada exitosamente',
        });
    } catch (error) {
        console.error('deleteExplanation error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error eliminando la explicación',
            error: 'DELETE_EXPLANATION_ERROR',
        });
    }
};
