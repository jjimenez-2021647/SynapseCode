'use strict';
import axios from 'axios';

const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3006',
    CHAT: process.env.CHAT_SERVICE_URL || 'http://localhost:3008',
    CODE_SESSIONS: process.env.CODE_SESSIONS_SERVICE_URL || 'http://localhost:3009',
    EXECUTION_CODE: process.env.EXECUTION_CODE_SERVICE_URL || 'http://localhost:3010',
};

/**
 * Realiza una solicitud HTTP a otro microservicio
 * @param {string} service - Nombre del servicio (CHAT, CODE_SESSIONS, EXECUTION_CODE)
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {string} endpoint - Ruta del endpoint (ej: /api/v1/chats)
 * @param {object} data - Datos a enviar (para POST/PUT)
 * @param {object} headers - Headers adicionales (tokens, etc)
 * @returns {Promise<object>} Respuesta del servicio
 */
export const callService = async (service, method, endpoint, data = null, headers = {}) => {
    try {
        const baseUrl = SERVICES[service];
        if (!baseUrl) {
            throw new Error(`Servicio desconocido: ${service}`);
        }

        const config = {
            method,
            url: `${baseUrl}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            timeout: 5000,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.data = data;
        }

        const response = await axios(config);
        return {
            success: true,
            status: response.status,
            data: response.data,
        };
    } catch (error) {
        console.error(`Error comunicándose con ${service}:`, error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            error: error.message,
            data: error.response?.data || null,
        };
    }
};

/**
 * Intenta crear chats en el servicio de chat Service
 * Si falla, devuelve un warning pero la sala se crea igual
 */
export const createChatsInChatService = async (roomId, numberChat, token) => {
    const chatsPayload = [
        {
            roomId,
            chatType: 'CHAT_SALA',
            numberChat,
        },
        {
            roomId,
            chatType: 'CHAT_IA',
        },
    ];

    const response = await callService(
        'CHAT',
        'POST',
        '/api/v1/chats/batch-create',
        chatsPayload,
        { 'x-token': token }
    );

    if (!response.success) {
        console.warn(`Warning: No se pudieron crear los chats. El servicio de chat podría estar caído.`);
        return {
            success: false,
            chats: [],
            warning: 'El servicio de chats no está disponible. Se crearán cuando se reinicie.',
        };
    }

    return {
        success: true,
        chats: response.data?.chats || [],
    };
};

/**
 * Obtiene datos completos del usuario desde el AuthService
 * @param {string} userId - ID del usuario
 * @param {string} token - Token JWT para autenticación
 * @returns {Promise<object>} Datos del usuario (name, profilePicture, etc) o null si falla
 */
export const getUserDataFromAuthService = async (userId, token) => {
    try {
        const url = `${SERVICES.AUTH}/api/v1/auth/profile/by-id`;
        
        const response = await axios.post(
            url,
            { userId },
            {
                timeout: 3000,
                headers: {
                    'x-token': token || '',
                    'Content-Type': 'application/json',
                },
            }
        );
        
        if (response.data?.success && response.data?.data) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.warn(`[getUserDataFromAuthService] Error obteniendo usuario ${userId}:`, error.message);
        return null;
    }
};

export default {
    callService,
    createChatsInChatService,
    getUserDataFromAuthService,
    SERVICES,
};
