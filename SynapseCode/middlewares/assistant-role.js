'use strict';

// Middleware para marcar la petición como acción de ASSISTANT_ROLE dentro de una sala.
// Úsalo típicamente cuando el usuario se une como asistente/miembro a una sala.
export const setAssistantSubRole = (req, _res, next) => {
    req.subRole = 'ASSISTANT_ROLE';
    next();
};

