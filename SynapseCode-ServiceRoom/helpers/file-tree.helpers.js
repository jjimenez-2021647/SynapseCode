'use strict';

import mongoose from 'mongoose';
import Folder from '../src/folders/folders.model.js';

const FOLDER_NAME_PATTERN = /^[a-zA-Z0-9_\-\. ]+$/;

const crcTable = (() => {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
        let value = index;

        for (let bit = 0; bit < 8; bit += 1) {
            value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }

        table[index] = value >>> 0;
    }

    return table;
})();

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const normalizeOptionalObjectId = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (!isValidObjectId(value)) return null;
    return String(value);
};

export const validateFolderName = (folderName) => {
    const normalized = String(folderName || '').trim();

    if (!normalized) {
        return { valid: false, message: 'El nombre de la carpeta no puede estar vacio' };
    }

    if (normalized.length > 100) {
        return { valid: false, message: 'El nombre de la carpeta no puede exceder 100 caracteres' };
    }

    if (normalized.startsWith('.')) {
        return { valid: false, message: 'El nombre de la carpeta no puede empezar con punto' };
    }

    if (!FOLDER_NAME_PATTERN.test(normalized)) {
        return {
            valid: false,
            message: 'El nombre de la carpeta solo puede contener letras, numeros, espacios, guiones, puntos y guiones bajos',
        };
    }

    return { valid: true, message: 'Nombre valido' };
};

const sortItems = (items = []) =>
    [...items].sort((left, right) => {
        const orderDifference = Number(left.displayOrder || 0) - Number(right.displayOrder || 0);
        if (orderDifference !== 0) return orderDifference;

        return String(left.nodeName || '')
            .toLowerCase()
            .localeCompare(String(right.nodeName || '').toLowerCase());
    });

export const buildFileExplorerTree = ({ room, folders = [], files = [] }) => {
    const folderNodes = folders.map((folder) => ({
        ...folder,
        id: String(folder._id),
        parentFolderId: folder.parentFolderId ? String(folder.parentFolderId) : null,
        type: 'folder',
        nodeName: folder.folderName,
        children: [],
    }));

    const fileNodes = files.map((file) => ({
        ...file,
        id: String(file._id),
        parentFolderId: file.parentFolderId ? String(file.parentFolderId) : null,
        type: 'file',
        nodeName: `${file.fileName}.${file.fileExtension}`,
        fullFileName: `${file.fileName}.${file.fileExtension}`,
    }));

    const foldersById = new Map(folderNodes.map((folder) => [folder.id, folder]));
    const rootChildren = [];

    for (const folder of folderNodes) {
        if (folder.parentFolderId && foldersById.has(folder.parentFolderId)) {
            foldersById.get(folder.parentFolderId).children.push(folder);
        } else {
            rootChildren.push(folder);
        }
    }

    for (const file of fileNodes) {
        if (file.parentFolderId && foldersById.has(file.parentFolderId)) {
            foldersById.get(file.parentFolderId).children.push(file);
        } else {
            rootChildren.push(file);
        }
    }

    const finalizeNode = (node) => {
        if (node.type === 'folder') {
            node.children = sortItems(node.children).map(finalizeNode);
        }

        return node;
    };

    return {
        roomId: room ? String(room._id || room.roomId || room.id || '') : null,
        roomName: room?.roomName || null,
        roomCode: room?.roomCode || null,
        tree: sortItems(rootChildren).map(finalizeNode),
    };
};

export const collectDescendantFolderIds = async (folderId, options = {}) => {
    const includeSelf = options.includeSelf !== false;
    const collectedIds = includeSelf ? [String(folderId)] : [];
    const pendingIds = [String(folderId)];

    while (pendingIds.length) {
        const currentBatch = pendingIds.splice(0, 100);
        const children = await Folder.find({ parentFolderId: { $in: currentBatch } })
            .select('_id')
            .lean();

        for (const child of children) {
            const childId = String(child._id);
            collectedIds.push(childId);
            pendingIds.push(childId);
        }
    }

    return collectedIds;
};

export const ensureFolderBelongsToRoom = (folder, roomId) =>
    folder && String(folder.roomId) === String(roomId);

export const ensureFolderIsNotInsideItself = async (folderId, targetParentFolderId) => {
    if (!targetParentFolderId) return false;
    if (String(folderId) === String(targetParentFolderId)) return true;

    const descendantIds = await collectDescendantFolderIds(folderId, { includeSelf: false });
    return descendantIds.includes(String(targetParentFolderId));
};

const sanitizeExportSegment = (value) =>
    String(value || '')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();

export const buildFolderPathMap = (folders = []) => {
    const foldersById = new Map(
        folders.map((folder) => [
            String(folder._id),
            {
                ...folder,
                id: String(folder._id),
                parentFolderId: folder.parentFolderId ? String(folder.parentFolderId) : null,
            },
        ])
    );
    const cache = new Map();

    const resolvePath = (folderId) => {
        if (!folderId) return [];
        if (cache.has(folderId)) return cache.get(folderId);

        const folder = foldersById.get(String(folderId));
        if (!folder) return [];

        const segments = [
            ...resolvePath(folder.parentFolderId),
            sanitizeExportSegment(folder.folderName || 'folder'),
        ];

        cache.set(folderId, segments);
        return segments;
    };

    for (const folder of foldersById.values()) {
        resolvePath(folder.id);
    }

    return cache;
};

const crc32 = (buffer) => {
    let value = 0xffffffff;

    for (const byte of buffer) {
        value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
    }

    return (value ^ 0xffffffff) >>> 0;
};

const dateToDos = (date = new Date()) => {
    const year = Math.max(1980, date.getFullYear());

    return {
        dosTime: ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | Math.floor(date.getSeconds() / 2),
        dosDate: (((year - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f),
    };
};

export const buildZipArchive = (entries = []) => {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
        const entryPath = String(entry.path || '').replace(/\\/g, '/');
        const fileNameBuffer = Buffer.from(entryPath, 'utf8');
        const contentBuffer = Buffer.isBuffer(entry.content)
            ? entry.content
            : Buffer.from(String(entry.content ?? ''), 'utf8');
        const checksum = crc32(contentBuffer);
        const { dosTime, dosDate } = dateToDos(entry.date || new Date());

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(checksum, 14);
        localHeader.writeUInt32LE(contentBuffer.length, 18);
        localHeader.writeUInt32LE(contentBuffer.length, 22);
        localHeader.writeUInt16LE(fileNameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);
        localParts.push(localHeader, fileNameBuffer, contentBuffer);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(checksum, 16);
        centralHeader.writeUInt32LE(contentBuffer.length, 20);
        centralHeader.writeUInt32LE(contentBuffer.length, 24);
        centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        centralParts.push(centralHeader, fileNameBuffer);

        offset += localHeader.length + fileNameBuffer.length + contentBuffer.length;
    }

    const localDirectory = Buffer.concat(localParts);
    const centralDirectory = Buffer.concat(centralParts);
    const endRecord = Buffer.alloc(22);

    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(entries.length, 8);
    endRecord.writeUInt16LE(entries.length, 10);
    endRecord.writeUInt32LE(centralDirectory.length, 12);
    endRecord.writeUInt32LE(localDirectory.length, 16);
    endRecord.writeUInt16LE(0, 20);

    return Buffer.concat([localDirectory, centralDirectory, endRecord]);
};

export const buildExportEntries = ({ folders = [], files = [], roomName = 'synapse-room' }) => {
    const pathMap = buildFolderPathMap(folders);
    const baseFolder = sanitizeExportSegment(roomName || 'synapse-room') || 'synapse-room';

    return files.map((file) => {
        const folderSegments = file.parentFolderId ? pathMap.get(String(file.parentFolderId)) || [] : [];
        const fullName = sanitizeExportSegment(`${file.fileName}.${file.fileExtension}`) || 'file.txt';

        return {
            path: [baseFolder, ...folderSegments, fullName].join('/'),
            content: file.currentCode || '',
            date: file.lastModifiedAt || file.createdAt || new Date(),
        };
    });
};
