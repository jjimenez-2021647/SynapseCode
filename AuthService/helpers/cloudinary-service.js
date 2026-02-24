import { v2 as cloudinary } from 'cloudinary';
import { config } from '../configs/config.js';
import fs from 'fs/promises';

// FIX: Bypass SSL (Cloudinary, etc.)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const uploadImage = async (filePath, fileName) => {
    try {
        const folder = config.cloudinary.folder;

        // Limpia el nombre: si viene "perfil.jpg", publicId será solo "perfil"
        const publicId = fileName.split('.').slice(0, -1).join('.') || fileName;

        const options = {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            transformation: [
                // 'limit' asegura que la imagen se vea COMPLETA sin recortar los lados
                { width: 800, height: 800, crop: 'limit' }, 
                { quality: 'auto', fetch_format: 'auto' },
            ],
        };

        const result = await cloudinary.uploader.upload(filePath, options);

        // Eliminar archivo local después de subir exitosamente
        try {
            await fs.unlink(filePath);
        } catch {
            console.warn('Warning: Could not delete local file:', filePath);
        }

        if (result.error) {
            throw new Error(`Error uploading image: ${result.error.message}`);
        }

        // Retornamos la URL completa y segura
        return result.secure_url;

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error?.message || error);

        // Intentar borrar el archivo local incluso si falla la subida
        try {
            await fs.unlink(filePath);
        } catch {
            console.warn('Warning: Could not delete local file after upload error');
        }

        throw new Error(
            `Failed to upload image to Cloudinary: ${error?.message || ''}`
        );
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
    //Si no hay imagen, devolver el avatar por defecto
    if (!imagePath) {
        return getDefaultAvatarUrl();
    }

    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Si por alguna razón solo es el nombre del archivo, construir la URL 
    const baseUrl = config.cloudinary.baseUrl;
    const folder = config.cloudinary.folder;

    const pathToUse = imagePath.includes('/')
        ? imagePath
        : `${folder}/${imagePath}`;

    return `${baseUrl}${pathToUse}`;
};

export const getDefaultAvatarUrl = () => {
    return config.cloudinary.defaultAvatarUrl;
};

export const getDefaultAvatarPath = () => {
    const defaultPath = config.cloudinary.defaultAvatarPath;
    // If dotenv didn't expand nested vars, build from env pieces
    if (defaultPath && defaultPath.includes('${')) {
        const folder = process.env.CLOUDINARY_FOLDER;
        const filename = process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME;
        if (folder || filename) {
        return [folder, filename].filter(Boolean).join('/');
        }
    }
    if (defaultPath && defaultPath.includes('/')) {
        return defaultPath.split('/').pop();
    }
    return defaultPath;
};

export default {
    uploadImage,
    deleteImage,
    getFullImageUrl,
    getDefaultAvatarUrl,
    getDefaultAvatarPath,
};
