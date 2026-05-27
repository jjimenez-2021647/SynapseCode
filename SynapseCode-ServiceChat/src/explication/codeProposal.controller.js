'use strict'
import CodeProposal from './codeProposal.model.js';
import { generateTextWithGroq } from '../../helpers/groq.service.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Validar que el usuario pertenece a la sala
 */
const validateUserInRoom = async (userId, roomId) => {
    // TODO: Implementar validación con el servicio de rooms
    return true;
};

/**
 * Generar prompt para mejorar código incrementalmente
 */
const generateIncrementalCodePrompt = (originalCode, language, instruction) => {
    return `Eres un experto programador. Tu tarea es mejorar el código EXISTENTE basándote en la instrucción del usuario.

IMPORTANTE:
- NO generes código desde cero
- ANALIZA el código actual
- CONTINÚA sobre lo que ya existe
- Mantén el estilo y estructura del código original
- Solo modifica/agrega lo necesario para cumplir la instrucción

LENGUAJE: ${language}

CÓDIGO ACTUAL:
\`\`\`${language}
${originalCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${instruction}

GENERA SOLO el código mejorado/completo (incluyendo el código original + cambios).
NO incluyas explicaciones, solo código.
`;
};

/**
 * Generar propuesta de código incremental
 * POST /api/v1/explication/code-proposal/generate
 */
export const generateCodeProposal = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId, roomId, originalCode, language, instruction, chatId } = req.body;

        if (!fileId || !roomId || !originalCode || !instruction) {
            return res.status(400).json({
                success: false,
                message: 'fileId, roomId, originalCode e instruction son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Validar que el usuario pertenece a la sala
        const isUserInRoom = await validateUserInRoom(userId, roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Generar prompt
        const prompt = generateIncrementalCodePrompt(
            originalCode,
            language || 'JAVASCRIPT',
            instruction
        );

        // Generar código con Groq
        let proposedCode;
        try {
            proposedCode = await generateTextWithGroq(prompt);
        } catch (groqError) {
            console.error('Error generando código con Groq:', groqError);
            return res.status(500).json({
                success: false,
                message: 'Error generando propuesta de código',
                error: 'GROQ_ERROR',
            });
        }

        // Limpiar código (quitar markdown si lo incluye)
        proposedCode = proposedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

        if (!proposedCode || proposedCode === originalCode) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo generar una propuesta de cambios válida',
                error: 'INVALID_PROPOSAL',
            });
        }

        // Crear propuesta
        const proposal = await CodeProposal.create({
            fileId,
            roomId,
            userId,
            chatId: chatId || null,
            originalCode,
            proposedCode,
            language: language || 'JAVASCRIPT',
            description: instruction,
            changesSummary: `Cambios solicitados: ${instruction}`,
        });

        return res.status(201).json({
            success: true,
            message: 'Propuesta generada exitosamente',
            data: {
                proposalId: proposal._id,
                status: proposal.status,
                language: proposal.language,
                diffLines: proposal.diffLines,
                description: proposal.description,
                originalCode: proposal.originalCode,
                proposedCode: proposal.proposedCode,
                createdAt: proposal.createdAt,
                expiresAt: proposal.expiresAt,
            },
        });
    } catch (error) {
        console.error('generateCodeProposal error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generando propuesta',
            error: 'GENERATE_PROPOSAL_ERROR',
        });
    }
};

/**
 * Obtener detalles de una propuesta
 * GET /api/v1/explication/code-proposal/:proposalId
 */
export const getCodeProposal = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { proposalId } = req.params;

        const proposal = await CodeProposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada',
                error: 'PROPOSAL_NOT_FOUND',
            });
        }

        // Validar acceso a la sala
        const isUserInRoom = await validateUserInRoom(userId, proposal.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        return res.status(200).json({
            success: true,
            data: proposal,
        });
    } catch (error) {
        console.error('getCodeProposal error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error obteniendo propuesta',
            error: 'GET_PROPOSAL_ERROR',
        });
    }
};

/**
 * Listar propuestas de un archivo
 * GET /api/v1/explication/code-proposal/file/:fileId
 */
export const listCodeProposals = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { fileId } = req.params;
        const { roomId, status } = req.query;

        const filter = { fileId };
        if (roomId) filter.roomId = roomId;
        if (status) filter.status = status;

        const proposals = await CodeProposal.find(filter)
            .select('_id status language diffLines description createdAt expiresAt')
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            count: proposals.length,
            data: proposals,
        });
    } catch (error) {
        console.error('listCodeProposals error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error listando propuestas',
            error: 'LIST_PROPOSALS_ERROR',
        });
    }
};

/**
 * Aprobar una propuesta de código
 * PUT /api/v1/explication/code-proposal/:proposalId/approve
 */
export const approveCodeProposal = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { proposalId } = req.params;

        const proposal = await CodeProposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada',
                error: 'PROPOSAL_NOT_FOUND',
            });
        }

        // Validar acceso a la sala
        const isUserInRoom = await validateUserInRoom(userId, proposal.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Validar estado
        if (proposal.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `No se puede aprobar una propuesta en estado ${proposal.status}`,
                error: 'INVALID_STATUS',
            });
        }

        // Validar que no expiró
        if (new Date() > proposal.expiresAt) {
            proposal.expire();
            await proposal.save();
            return res.status(400).json({
                success: false,
                message: 'La propuesta ha expirado',
                error: 'PROPOSAL_EXPIRED',
            });
        }

        // Aprobar
        proposal.approve(userId);
        await proposal.save();

        return res.status(200).json({
            success: true,
            message: 'Propuesta aprobada exitosamente',
            data: {
                proposalId: proposal._id,
                status: proposal.status,
                proposedCode: proposal.proposedCode,
                approvedAt: proposal.approvedAt,
            },
        });
    } catch (error) {
        console.error('approveCodeProposal error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error aprobando propuesta',
            error: 'APPROVE_PROPOSAL_ERROR',
        });
    }
};

/**
 * Rechazar una propuesta de código
 * PUT /api/v1/explication/code-proposal/:proposalId/reject
 */
export const rejectCodeProposal = async (req, res) => {
    try {
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'UNAUTHORIZED',
            });
        }

        const { proposalId } = req.params;
        const { reason } = req.body;

        const proposal = await CodeProposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada',
                error: 'PROPOSAL_NOT_FOUND',
            });
        }

        // Validar acceso a la sala
        const isUserInRoom = await validateUserInRoom(userId, proposal.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Validar estado
        if (proposal.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `No se puede rechazar una propuesta en estado ${proposal.status}`,
                error: 'INVALID_STATUS',
            });
        }

        // Rechazar
        proposal.reject(userId, reason || '');
        await proposal.save();

        return res.status(200).json({
            success: true,
            message: 'Propuesta rechazada',
            data: {
                proposalId: proposal._id,
                status: proposal.status,
                rejectionReason: proposal.rejectionReason,
                rejectedAt: proposal.rejectedAt,
            },
        });
    } catch (error) {
        console.error('rejectCodeProposal error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error rechazando propuesta',
            error: 'REJECT_PROPOSAL_ERROR',
        });
    }
};

export default {
    generateCodeProposal,
    getCodeProposal,
    listCodeProposals,
    approveCodeProposal,
    rejectCodeProposal,
};
