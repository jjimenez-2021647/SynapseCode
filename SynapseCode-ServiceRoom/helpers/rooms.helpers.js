'use strict'
import Room from '../src/rooms/rooms.model.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUM = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';

function randomSegment(chars, length = 3) {
    let s = '';
    for (let i = 0; i < length; i++) {
        s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
}

export default async function generateUniqueRoomCode(attempts = 20) {
    for (let i = 0; i < attempts; i++) {
        const first = randomSegment(LETTERS, 3);
        const second = randomSegment(ALPHANUM, 3);
        const third = randomSegment(ALPHANUM, 3);
        const code = `${first}-${second}-${third}`;

        const exists = await Room.findOne({ roomCode: code }).lean();
        if (!exists) return code;
    }
    throw new Error('No fue posible generar un roomCode único');
}

export function generatePasswordRoom() {
    const randomPart = randomSegment(ALPHANUM, 8);
    return `pass_${randomPart}`;
}

export { randomSegment };