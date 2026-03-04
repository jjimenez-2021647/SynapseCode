'use strict';

// Middleware para marcar la petición como acción de HOST_ROLE dentro de una sala.
// Úsalo típicamente cuando el usuario está creando la sala o actuando como anfitrión.
export const setHostSubRole = (req, _res, next) => {
    req.subRole = 'HOST_ROLE';
    next();
};

