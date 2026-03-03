'use strict'
import Room from '../src/rooms/rooms.model.js';

// dejamos establecido los caracteres a usapra generar el codigo de la sala
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUM = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';


// declararamos la funcion para poder generar el codigo de la sala
function randomSegment(chars, length = 3) {
    // esta variable se va a encargar de almacenar el codigo generado
    let s = '';
    // iniciamos el bulce donde se va a construir el codigo de la sala como indica el length
    for (let i = 0; i < length; i++) {
        // recordemos usamos el chars para obtener un caracte alatorio
        //lugo implementamos el math.floore que redondea hacia abajo para obtener un numero entero
        // usamos el math.random para generar un umero decimal entre 0 y 1
        // y se multiplica por el chars.length que seria la cantidad de caracteres disponibles a usar
        // y s+= para irlos agregando al string
        s += chars[Math.floor(Math.random() * chars.length)];
    }
    //teminamos el for y devolvemos el string creado
    return s;
}

// genera el codigo unico en 20 intentos
export default async function generateUniqueRoomCode(attempts = 20) {
    // decimos que el for se usa hasta llegar los 20 intentos
    for (let i = 0; i < attempts; i++) {
        // generamos el codigo del primer segmento solo con letras
        const first = randomSegment(LETTERS, 3);

        // generamos el segundo y tercer segmento con letras y numeros
        const second = randomSegment(ALPHANUM, 3);
        const third = randomSegment(ALPHANUM, 3);
        // juntamos en la variable code los tres segmentos formando el code tipo ABC-A2S-1B3
        const code = `${first}-${second}-${third}`;

        //verificamos si el codigo generado ya existe en la base de datos
        const exists = await Room.findOne({ roomCode: code }).lean();
        // si no existe devolvemos el codigo que se genero
        if (!exists) return code;
    }
    //Error si no se pudo generar un codigo unico despues de 20 intentos por si las moscas
    throw new Error('No fue posible generar un roomCode único');
}
// exportamos la funcion randomSegment para poder usarla en otros archivos 
export { randomSegment };