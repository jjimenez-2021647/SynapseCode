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

const stripExtension = (value = '') => value.replace(/\.[^/.]+$/, '');

const buildDefaultAvatarPath = () => {
    const defaultPath =
        config.cloudinary.defaultAvatarPath || config.cloudinary.defaultAvatar;

    if (defaultPath && defaultPath.includes('${')) {
        const folder = process.env.CLOUDINARY_FOLDER;
        const filename = process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME;
        return [folder, filename].filter(Boolean).join('/');
    }

    if (defaultPath && defaultPath.includes('/')) {
        return defaultPath.split('/').pop();
    }

    return defaultPath || '';
};

const getCloudinaryPublicId = (imagePath) => {
    if (!imagePath) return '';

    try {
        if (imagePath.startsWith('http')) {
            const { pathname } = new URL(imagePath);
            const segments = pathname.split('/').filter(Boolean);
            const uploadIndex = segments.indexOf('upload');
            const publicSegments =
                uploadIndex >= 0 ? segments.slice(uploadIndex + 1) : segments;

            if (publicSegments[0]?.startsWith('v')) {
                publicSegments.shift();
            }

            if (publicSegments.length > 0) {
                publicSegments[publicSegments.length - 1] = stripExtension(
                    publicSegments[publicSegments.length - 1]
                );
            }

            return publicSegments.join('/');
        }
    } catch {
        return '';
    }

    const folder = config.cloudinary.folder;
    const pathToUse = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;
    const segments = pathToUse.split('/').filter(Boolean);

    if (segments.length > 0) {
        segments[segments.length - 1] = stripExtension(segments[segments.length - 1]);
    }

    return segments.join('/');
};

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

        // Retornamos la URL completa y segura de Cloudinary
        // result.secure_url ya incluye todas las transformaciones aplicadas
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
        if (isDefaultAvatar(imagePath)) {
            return true;
        }

        const publicId = getCloudinaryPublicId(imagePath);
        if (!publicId) return false;

        const result = await cloudinary.uploader.destroy(publicId);

        return result.result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
};

export const getFullImageUrl = (imagePath) => {
    // Si no hay imagen, devolver el avatar por defecto
    if (!imagePath) {
        return getDefaultAvatarUrl();
    }

    // Si ya es una URL completa de Cloudinary (https://...), devolverla tal cual
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Si es el avatar por defecto (nombre de archivo sin ruta), devolver la URL del avatar por defecto
    if (isDefaultAvatar(imagePath)) {
        return getDefaultAvatarUrl();
    }

    // Si es una ruta relativa (con o sin carpeta), construir la URL de Cloudinary
    const cloudName = config.cloudinary.cloudName;
    const cloudinaryBaseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

    // Asegurar que tenga la carpeta y el nombre del archivo
    const folder = config.cloudinary.folder;
    const pathToUse = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;

    // Construir la URL completa
    return `${cloudinaryBaseUrl}/${pathToUse}`;
};

export const getDefaultAvatarUrl = () => {
    return config.cloudinary.defaultAvatarUrl;
};

export const getDefaultAvatarPath = () => {
    return buildDefaultAvatarPath();
};

export const isDefaultAvatar = (imagePath) => {
    if (!imagePath) return true;

    const defaultPath = getDefaultAvatarPath();
    const defaultUrl = getDefaultAvatarUrl();
    const defaultPublicId = getCloudinaryPublicId(defaultPath);
    const imagePublicId = getCloudinaryPublicId(imagePath);

    return (
        imagePath === defaultPath ||
        imagePath === defaultUrl ||
        Boolean(defaultPublicId && imagePublicId && defaultPublicId === imagePublicId)
    );
};

export default {
    uploadImage,
    deleteImage,
    getFullImageUrl,
    getDefaultAvatarUrl,
    getDefaultAvatarPath,
    isDefaultAvatar,
};
