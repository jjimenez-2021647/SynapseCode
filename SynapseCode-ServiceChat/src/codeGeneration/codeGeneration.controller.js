'use strict'
import CodeProposal from './codeProposal.model.js';
import { generateTextWithGroq } from '../../helpers/groq.service.js';
import { getIncrementalCodePrompt } from '../../configs/prompts.config.js';
import { calculateCodeDiff } from '../../helpers/code-diff.helper.js';

const getRequesterUserId = (req) =>
    req.user?.userId || req.user?.id || req.user?.sub || null;

/**
 * Validar que el usuario pertenece a la sala
 */
const validateUserInRoom = async (userId, roomId) => {
    // TODO: Consultar con servicio de rooms
    return true;
};

/**
 * Generar una propuesta de código incremental
 * POST /api/v1/code-generation/propose
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

        const { fileId, roomId, currentCode, language, request, context } = req.body;

        if (!fileId || !roomId || !currentCode || !request) {
            return res.status(400).json({
                success: false,
                message: 'fileId, roomId, currentCode y request son obligatorios',
                error: 'MISSING_REQUIRED_FIELDS',
            });
        }

        // Validar que pertenece a la sala
        const isUserInRoom = await validateUserInRoom(userId, roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        // Generar prompt incremental
        const prompt = getIncrementalCodePrompt(currentCode, language || 'JAVASCRIPT', request);

        // Llamar a Groq para generar código
        let proposedCode = await generateTextWithGroq(prompt);

        // Limpiar código (remover markdown si lo incluye)
        proposedCode = proposedCode
            .replace(/```[\w]*\n?/g, '')
            .replace(/```/g, '')
            .trim();

        // Calcular diff
        const changeLines = calculateCodeDiff(currentCode, proposedCode);

        // Crear propuesta
        const proposal = await CodeProposal.create({
            fileId,
            roomId,
            createdByUserId: userId,
            language: language || 'JAVASCRIPT',
            currentCode,
            proposedCode,
            changeLines,
            generationPrompt: prompt,
            generationContext: context || null,
            changeDescription: `Se generaron ${changeLines.length} cambios en el código`,
        });

        return res.status(201).json({
            success: true,
            message: 'Propuesta generada exitosamente',
            data: {
                proposalId: proposal._id,
                fileId: proposal.fileId,
                status: proposal.status,
                currentCode: proposal.currentCode,
                proposedCode: proposal.proposedCode,
                changeLines: proposal.changeLines,
                diffSummary: proposal.getDiffSummary(),
                changeDescription: proposal.changeDescription,
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
 * Obtener una propuesta de código
 * GET /api/v1/code-generation/proposal/:proposalId
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

        // Validar acceso
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
            message: 'Propuesta obtenida',
            data: {
                proposalId: proposal._id,
                fileId: proposal.fileId,
                roomId: proposal.roomId,
                status: proposal.status,
                currentCode: proposal.currentCode,
                proposedCode: proposal.proposedCode,
                changeLines: proposal.changeLines,
                diffSummary: proposal.getDiffSummary(),
                changeDescription: proposal.changeDescription,
                createdByUserId: proposal.createdByUserId,
                approvedByUserId: proposal.approvedByUserId,
                rejectedByUserId: proposal.rejectedByUserId,
                createdAt: proposal.createdAt,
            },
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
 * Aprobar una propuesta de código
 * POST /api/v1/code-generation/proposal/:proposalId/approve
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

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, proposal.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        if (proposal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `La propuesta ya fue ${proposal.status}`,
                error: 'INVALID_STATUS',
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
                approvedAt: proposal.approvedAt,
                proposedCode: proposal.proposedCode,
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
 * POST /api/v1/code-generation/proposal/:proposalId/reject
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

        // Validar acceso
        const isUserInRoom = await validateUserInRoom(userId, proposal.roomId);
        if (!isUserInRoom) {
            return res.status(403).json({
                success: false,
                message: 'No perteneces a esta sala',
                error: 'FORBIDDEN',
            });
        }

        if (proposal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `La propuesta ya fue ${proposal.status}`,
                error: 'INVALID_STATUS',
            });
        }

        // Rechazar
        proposal.reject(userId, reason || null);
        await proposal.save();

        return res.status(200).json({
            success: true,
            message: 'Propuesta rechazada exitosamente',
            data: {
                proposalId: proposal._id,
                status: proposal.status,
                rejectedAt: proposal.rejectedAt,
                rejectionReason: proposal.rejectionReason,
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

/**
 * Listar propuestas pendientes de un archivo
 * GET /api/v1/code-generation/proposals/file/:fileId
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
        const { status, roomId } = req.query;

        const filter = {
            fileId,
            deletedAt: null,
        };

        if (status) {
            filter.status = status;
        }

        if (roomId) {
            filter.roomId = roomId;
        }

        const proposals = await CodeProposal.find(filter)
            .select(
                '_id fileId roomId status createdByUserId approvedByUserId changeDescription createdAt diffSummary'
            )
            .sort({ createdAt: -1 });

        // Enriquecer con summary
        const enriched = proposals.map(p => ({
            ...p.toObject(),
            diffSummary: p.getDiffSummary(),
        }));

        return res.status(200).json({
            success: true,
            message: 'Propuestas listadas',
            data: enriched,
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

export default {
    generateCodeProposal,
    getCodeProposal,
    approveCodeProposal,
    rejectCodeProposal,
    listCodeProposals,
};
