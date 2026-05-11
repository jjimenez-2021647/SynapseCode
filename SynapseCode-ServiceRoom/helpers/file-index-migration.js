'use strict';

import File from '../src/files/files.model.js';

const LEGACY_INDEX_NAME = 'roomId_1_fileName_1_fileExtension_1';
const SCOPED_INDEX_NAME = 'roomId_1_parentFolderId_1_fileName_1_fileExtension_1';

const keysMatch = (left = {}, right = {}) => JSON.stringify(left) === JSON.stringify(right);

export const ensureScopedFileIndexes = async () => {
    try {
        const collection = File.collection;
        const existingIndexes = await collection.indexes();

        const scopedIndex = existingIndexes.find(
            (index) =>
                index.unique === true &&
                keysMatch(index.key, {
                    roomId: 1,
                    parentFolderId: 1,
                    fileName: 1,
                    fileExtension: 1,
                })
        );

        if (!scopedIndex) {
            await collection.createIndex(
                { roomId: 1, parentFolderId: 1, fileName: 1, fileExtension: 1 },
                { unique: true, name: SCOPED_INDEX_NAME }
            );
        }

        const legacyIndex = existingIndexes.find((index) => index.name === LEGACY_INDEX_NAME);
        if (legacyIndex) {
            await collection.dropIndex(LEGACY_INDEX_NAME);
        }
    } catch (error) {
        console.error('ensureScopedFileIndexes error:', error);
        throw error;
    }
};
