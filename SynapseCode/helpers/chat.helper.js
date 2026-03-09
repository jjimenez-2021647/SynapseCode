'use strict'
import { randomBytes } from 'crypto';

// Genera un numberChat con formato: chat_<8 caracteres alfanuméricos mayúsculas>
// Ej: chat_A1B2C3D4
export const generateNumberChat = (length = 8) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
        result += alphabet[bytes[i] % alphabet.length];
    }

    return `chat_${result}`;
};

export default { generateNumberChat };
