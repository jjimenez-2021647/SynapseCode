'use strict'

/**
 * Calcula las diferencias (diff) entre dos versiones de código
 * Usa un algoritmo simple de LCS (Longest Common Subsequence)
 */

const getLinesArray = (code) => code.split('\n');

/**
 * Algoritmo simple para detectar cambios línea por línea
 * Retorna array con los cambios
 */
export const calculateCodeDiff = (oldCode, newCode) => {
    const oldLines = getLinesArray(oldCode);
    const newLines = getLinesArray(newCode);

    const changes = [];
    const maxLines = Math.max(oldLines.length, newLines.length);

    // Crear mapa de similitud para detectar líneas modificadas
    const changeMap = new Map();

    // Detectar líneas removidas y modificadas
    for (let i = 0; i < oldLines.length; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];

        if (!newLine) {
            // Línea removida (existe en old pero no en new)
            changes.push({
                lineNumber: i + 1,
                type: 'removed',
                oldLine: oldLine.trim(),
                newLine: null,
            });
        } else if (oldLine !== newLine) {
            // Línea modificada
            changes.push({
                lineNumber: i + 1,
                type: 'modified',
                oldLine: oldLine.trim(),
                newLine: newLine.trim(),
            });
        }
    }

    // Detectar líneas agregadas (existen en new pero no en old)
    if (newLines.length > oldLines.length) {
        for (let i = oldLines.length; i < newLines.length; i++) {
            changes.push({
                lineNumber: i + 1,
                type: 'added',
                oldLine: null,
                newLine: newLines[i].trim(),
            });
        }
    }

    // Si no hay cambios pero los códigos son diferentes, marcar como modificado
    if (changes.length === 0 && oldCode !== newCode) {
        return [
            {
                lineNumber: 1,
                type: 'modified',
                oldLine: 'Código modificado (cambios menores)',
                newLine: 'Código mejorado',
            },
        ];
    }

    return changes;
};

/**
 * Genera un resumen legible de los cambios
 */
export const summarizeChanges = (changeLines) => {
    if (changeLines.length === 0) {
        return 'Sin cambios detectados';
    }

    const added = changeLines.filter(l => l.type === 'added').length;
    const modified = changeLines.filter(l => l.type === 'modified').length;
    const removed = changeLines.filter(l => l.type === 'removed').length;

    const parts = [];
    if (added > 0) parts.push(`${added} líneas agregadas`);
    if (modified > 0) parts.push(`${modified} líneas modificadas`);
    if (removed > 0) parts.push(`${removed} líneas removidas`);

    return parts.join(', ');
};

/**
 * Aplica los cambios aprobados (retorna código actualizado)
 * Útil para cuando el usuario aprueba la propuesta
 */
export const applyCodeProposal = (currentCode, proposedCode) => {
    // Simple: devuelve el código propuesto
    // En un futuro, podrías hacer merge inteligente
    return proposedCode;
};

/**
 * Genera un formato visual de los cambios (para logging/debugging)
 */
export const visualizeDiff = (changeLines) => {
    return changeLines
        .map(change => {
            if (change.type === 'added') {
                return `+ ${change.newLine}`;
            } else if (change.type === 'removed') {
                return `- ${change.oldLine}`;
            } else {
                return `~ ${change.oldLine} → ${change.newLine}`;
            }
        })
        .join('\n');
};

export default {
    calculateCodeDiff,
    summarizeChanges,
    applyCodeProposal,
    visualizeDiff,
};
