'use strict'
import { randomBytes } from 'crypto';

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