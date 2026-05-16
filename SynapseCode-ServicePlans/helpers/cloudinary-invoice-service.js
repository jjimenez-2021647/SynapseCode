import { v2 as cloudinary } from 'cloudinary';
import config from '../configs/config.js';

// FIX: Bypass SSL (Cloudinary, etc.)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary?.cloudName,
    api_key: config.cloudinary?.apiKey,
    api_secret: config.cloudinary?.apiSecret,
});

const getRawPublicId = (fileName) => fileName.replace(/\.pdf$/i, '');

const invoiceExists = async (publicId) => {
    try {
        await cloudinary.api.resource(publicId, { resource_type: 'image' });
        return true;
    } catch (error) {
        if (error?.http_code === 404 || error?.error?.http_code === 404) {
            return false;
        }

        throw error;
    }
};

const getAvailableInvoicePublicId = async (folder, fileName) => {
    const basePublicId = `${folder}/${getRawPublicId(fileName)}`;
    let candidatePublicId = basePublicId;
    let suffix = 0;

    while (await invoiceExists(candidatePublicId)) {
        suffix += 1;
        candidatePublicId = `${basePublicId}_${suffix}`;
    }

    return candidatePublicId.slice(`${folder}/`.length);
};

/**
 * Sube un buffer de PDF de factura a Cloudinary
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} fileName - Nombre del archivo (con extensión .pdf)
 * @returns {Promise<{url: string, publicId: string}>} URL segura y publicId del archivo subido
 */
export const uploadInvoicePdfFromBuffer = async (pdfBuffer, fileName) => {
    try {
        // Validar que las credenciales estén disponibles
        if (!config.cloudinary?.cloudName || !config.cloudinary?.apiKey || !config.cloudinary?.apiSecret) {
            throw new Error(
                'Credenciales de Cloudinary no configuradas. Verifica las variables de entorno: ' +
                'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
            );
        }

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('PDF buffer is empty');
        }

        const folder = config.cloudinary.invoicesFolder;

        // Limpia el nombre: si viene "factura_synapsecode_xxx.pdf", publicId será solo "factura_synapsecode_xxx"
        const publicId = await getAvailableInvoicePublicId(folder, fileName);

        const options = {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            format: 'pdf',
            filename_override: `${publicId}.pdf`,
        };

        console.log('Uploading invoice to Cloudinary:', { fileName, publicId, folder, bufferSize: pdfBuffer.length });

        // Wrapper para timeout
        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload error: ${error.message || JSON.stringify(error)}`));
                } else {
                    resolve(result);
                }
            });

            // Escribir el buffer al stream
            stream.end(pdfBuffer);
        });

        const timeoutMs = 30000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cloudinary upload timeout (30s)')), timeoutMs)
        );

        const result = await Promise.race([uploadPromise, timeoutPromise]);

        if (!result.secure_url) {
            throw new Error(`Upload result missing secure_url: ${JSON.stringify(result)}`);
        }

        console.log('Invoice uploaded successfully:', result.public_id, '- URL:', result.secure_url);

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };

    } catch (error) {
        console.error('Error uploading invoice to Cloudinary:', error?.message || error);
        throw new Error(
            `Failed to upload invoice to Cloudinary: ${error?.message || 'Unknown error'}`
        );
    }
};

/**
 * Sube un archivo PDF de factura a Cloudinary (desde ruta local)
 * @param {string} filePath - Ruta local del archivo PDF
 * @param {string} fileName - Nombre del archivo (sin extensión)
 * @returns {Promise<{url: string, publicId: string}>} URL segura y publicId del archivo subido
 */
export const uploadInvoicePdf = async (filePath, fileName) => {
    try {
        // Validar que las credenciales estén disponibles
        if (!config.cloudinary?.cloudName || !config.cloudinary?.apiKey || !config.cloudinary?.apiSecret) {
            throw new Error(
                'Credenciales de Cloudinary no configuradas. Verifica las variables de entorno: ' +
                'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
            );
        }

        const folder = config.cloudinary.invoicesFolder;

        // Limpia el nombre: si viene "factura_synapsecode_xxx.pdf", publicId será solo "factura_synapsecode_xxx"
        const publicId = await getAvailableInvoicePublicId(folder, fileName);

        const options = {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            format: 'pdf',
            filename_override: `${publicId}.pdf`,
        };


        console.log('Uploading invoice to Cloudinary:', { filePath, publicId, folder });

        // Wrap upload with timeout to avoid hanging requests
        const uploadPromise = cloudinary.uploader.upload(filePath, options);
        const timeoutMs = 30000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cloudinary upload timeout')), timeoutMs)
        );

        const result = await Promise.race([uploadPromise, timeoutPromise]);

        if (result.error) {
            throw new Error(`Error uploading invoice: ${result.error.message}`);
        }

        console.log('Invoice uploaded successfully:', result.public_id);

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };

    } catch (error) {
        console.error('Error uploading invoice to Cloudinary:', error?.message || error);
        throw new Error(
            `Failed to upload invoice to Cloudinary: ${error?.message || ''}`
        );
    }
};

/**
 * Elimina un archivo de factura de Cloudinary
 * @param {string} publicId - Public ID del archivo en Cloudinary
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteInvoicePdf = async (publicId) => {
    try {
        if (!publicId) {
            return true;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting invoice from Cloudinary:', error);
        return false;
    }
};

/**
 * Obtiene la URL de un PDF de factura en Cloudinary
 * @param {string} url - URL completa del archivo en Cloudinary o publicId
 * @returns {string} URL completa del archivo con firma de autenticación
 */
export const getInvoiceUrl = (url) => {
    if (!url) {
        return null;
    }

    if (url.startsWith('http')) {
        return url;
    }

    // Si es un publicId, construir la URL con firma de autenticación
    try {
        return cloudinary.url(url, {
            resource_type: 'image',
            format: 'pdf',
            secure: true,
        });
    } catch (error) {
        console.error('Error generating Cloudinary URL:', error);
        return url;
    }
};
