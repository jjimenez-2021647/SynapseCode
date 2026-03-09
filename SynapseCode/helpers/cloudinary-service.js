'use strict';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

const config = {
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'synapse-code',
        baseUrl: process.env.CLOUDINARY_BASE_URL || '',
        defaultAvatarUrl: process.env.CLOUDINARY_DEFAULT_AVATAR_URL || '',
        defaultAvatarPath: process.env.CLOUDINARY_DEFAULT_AVATAR_PATH || '',
    },
};

// FIX: Bypass SSL (Cloudinary, etc.)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const uploadImage = async (filePath, fileName) => {
    try {
        const folder = config.cloudinary.folder;
        const publicId = fileName.split('.').slice(0, -1).join('.') || fileName;

        const options = {
            public_id: publicId,
            folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        };

        const result = await cloudinary.uploader.upload(filePath, options);

        try {
            await fs.unlink(filePath);
        } catch {
            console.warn('Warning: Could not delete local file:', filePath);
        }

        if (result.error) {
            throw new Error(`Error uploading image: ${result.error.message}`);
        }

        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error?.message || error);

        try {
            await fs.unlink(filePath);
        } catch {
            console.warn('Warning: Could not delete local file after upload error');
        }

        throw new Error(`Failed to upload image to Cloudinary: ${error?.message || ''}`);
    }
};

export const deleteImage = async (imagePath) => {
    try {
        if (!imagePath || imagePath === config.cloudinary.defaultAvatarPath) {
            return true;
        }

        const folder = config.cloudinary.folder;
        const publicId = imagePath.includes('/')
            ? imagePath
            : `${folder}/${imagePath}`;
        const result = await cloudinary.uploader.destroy(publicId);

        return result.result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
};

export const getFullImageUrl = (imagePath) => {
    if (!imagePath) return getDefaultAvatarUrl();
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = config.cloudinary.baseUrl;
    const folder = config.cloudinary.folder;
    const pathToUse = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;

    return `${baseUrl}${pathToUse}`;
};

export const getDefaultAvatarUrl = () => {
    return config.cloudinary.defaultAvatarUrl;
};

export const getDefaultAvatarPath = () => {
    const defaultPath = config.cloudinary.defaultAvatarPath;
    if (defaultPath && defaultPath.includes('${')) {
        const folder = process.env.CLOUDINARY_FOLDER;
        const filename = process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME;
        if (folder || filename) return [folder, filename].filter(Boolean).join('/');
    }
    if (defaultPath && defaultPath.includes('/')) return defaultPath.split('/').pop();
    return defaultPath;
};

// Backward compatibility for existing callers in messages.controller.js
export const uploadToCloudinary = async (file, options = {}) => {
    if (file?.url) return { secure_url: file.url };

    if (!file?.path) {
        throw new Error('No se proporciono un archivo valido para subir a Cloudinary');
    }

    const fileName = file.originalname || file.filename || `file_${Date.now()}`;
    const secureUrl = await uploadImage(file.path, fileName);
    return { secure_url: secureUrl, ...options };
};

export default {
    uploadImage,
    deleteImage,
    getFullImageUrl,
    getDefaultAvatarUrl,
    getDefaultAvatarPath,
    uploadToCloudinary,
};
