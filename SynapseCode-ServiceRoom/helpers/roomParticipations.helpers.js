'use strict'

const ROLE_HOST = 'ANFITRION';
const ROLE_MEMBER = 'MIEMBRO';

const STATUS_CONNECTED = 'CONECTADO';
const STATUS_DISCONNECTED = 'DESCONECTADO';
const STATUS_AWAY = 'AUSENTE';

const DEFAULT_PERMISSIONS_BY_ROLE = {
    [ROLE_HOST]: {
        canEdit: true,
        canRun: true,
        canInvite: true,
        canKick: true,
        canCloseRoom: true,
    },
    [ROLE_MEMBER]: {
        canEdit: true,
        canRun: true,
        canInvite: false,
        canKick: false,
        canCloseRoom: false,
    },
};

export function getRoleDefaultPermissions(role) {
    const normalizedRole = String(role || '').toUpperCase();
    const defaults = DEFAULT_PERMISSIONS_BY_ROLE[normalizedRole];

    if (!defaults) {
        throw new Error('Rol de participación inválido para permisos');
    }

    return { ...defaults };
}

export function mergePermissions(role, customPermissions = {}) {
    const base = getRoleDefaultPermissions(role);
    const result = { ...base };

    for (const [key, value] of Object.entries(customPermissions || {})) {
        if (value === undefined) continue;
        if (Object.prototype.hasOwnProperty.call(base, key)) {
            result[key] = Boolean(value);
        }
    }

    return result;
}

export function calculateTotalMinutes(joinedAt, leftAt, previousTotal = 0) {
    if (!joinedAt || !leftAt) return previousTotal;

    const start = new Date(joinedAt).getTime();
    const end = new Date(leftAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        return previousTotal;
    }

    const diffMinutes = Math.floor((end - start) / 60000);
    const total = (previousTotal || 0) + Math.max(0, diffMinutes);

    return total;
}