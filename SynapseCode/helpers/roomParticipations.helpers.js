'use strict'

// Constantes de rol
const ROLE_HOST = 'ANFITRION';
const ROLE_MEMBER = 'MIEMBRO';

// Constantes de estado de conexión
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
        // puedeEditar: true (configurable por anfitrión)
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

    // devolver una copia para evitar mutaciones externas
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

export const PARTICIPATION_ROLES = {
    HOST: ROLE_HOST,
    MEMBER: ROLE_MEMBER,
};

export const CONNECTION_STATUSES = {
    CONNECTED: STATUS_CONNECTED,
    DISCONNECTED: STATUS_DISCONNECTED,
    AWAY: STATUS_AWAY,
};

// Mapea un subRole de sala (HOST_ROLE / ASSISTANT_ROLE) al rol de participación (ANFITRION / MIEMBRO)
export function mapSubRoleToParticipationRole(subRole) {
    const normalized = String(subRole || '').toUpperCase();

    if (normalized === 'HOST_ROLE') {
        return ROLE_HOST;
    }

    if (normalized === 'ASSISTANT_ROLE') {
        return ROLE_MEMBER;
    }

    return null;
}


