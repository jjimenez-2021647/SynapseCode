'use strict'
import { body } from 'express-validator';

export const validateFileExtensionMiddleware = [
    body('fileExtension')
        .trim()
        .notEmpty().withMessage('La extension del archivo es obligatoria')
        .toLowerCase()
        .isIn(['java', 'py', 'js', 'jsx', 'html', 'css', 'cs'])
        .withMessage('Extension no soportada. Permitidas: java, py, js, jsx, html, css, cs'),
];

export const validateFileNameMiddleware = [
    body('fileName')
        .trim()
        .notEmpty().withMessage('El nombre del archivo es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
        .matches(/^[a-zA-Z0-9_\-\.]+$/).withMessage('El nombre solo puede contener letras, numeros, guiones, puntos y guiones bajos')
        .custom((value) => {
            if (value.startsWith('.')) {
                throw new Error('El nombre no puede empezar con punto');
            }
            return true;
        }),
];