import {
    registerUserHelper,
    loginUserHelper,
    verifyEmailHelper,
    resendVerificationEmailHelper,
    forgotPasswordHelper,
    resetPasswordHelper,
    changePasswordHelper,
} from '../../helpers/auth-operations.js';
import {
    getUserProfileHelper,
    updateProfileHelper,
    requestUsernameChangeHelper,
    confirmUsernameChangeHelper,
    requestPhoneChangeHelper,
    confirmPhoneChangeHelper,
    changeImageHelper,
    requestDeactivateAccountHelper,
    confirmDeactivateAccountHelper,
    requestActivateAccountHelper, 
    confirmActivateAccountHelper,
} from '../../helpers/profile-operations.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const register = asyncHandler(async (req, res) => {
    try {
        // Agregar la imagen de perfil si fue subida
        const userData = {
            ...req.body,
            profilePicture: req.file ? req.file.path.replace(/\\/g, '/') : null,
        };

        const result = await registerUserHelper(userData);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in register controller:', error);

        let statusCode = 400;
        if (
            error.message.includes('ya está registrado') ||
            error.message.includes('ya está en uso') ||
            error.message.includes('Ya existe un usuario')
        ) {
            statusCode = 409; // Conflict
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error en el registro',
            error: error.message,
        });
    }
});

export const login = asyncHandler(async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const result = await loginUserHelper(emailOrUsername, password);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in login controller:', error);

        let statusCode = 401;
        if (
            error.message.includes('bloqueada') ||
            error.message.includes('desactivada')
        ) {
            statusCode = 423; // Locked
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error en el login',
            error: error.message,
        });
    }
});

export const verifyEmail = asyncHandler(async (req, res) => {
    try {
        const { token } = req.body;
        const result = await verifyEmailHelper(token);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in verifyEmail controller:', error);

        let statusCode = 400;
        if (error.message.includes('no encontrado')) {
            statusCode = 404;
        } else if (
            error.message.includes('inválido') ||
            error.message.includes('expirado')
        ) {
            statusCode = 401;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error en la verificación',
            error: error.message,
        });
    }
});

export const resendVerification = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const result = await resendVerificationEmailHelper(email);

        // Check result.success to determine status code
        if (!result.success) {
            if (result.message.includes('no encontrado')) {
                return res.status(404).json(result);
            }
            if (result.message.includes('ya ha sido verificado')) {
                return res.status(400).json(result);
            }
            // Email sending failed
            return res.status(503).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in resendVerification controller:', error);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
        });
    }
});

export const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordHelper(email);

        // forgotPassword always returns success for security, even if user not found
        // But if email sending fails, we should return 503
        if (!result.success && result.data?.initiated === false) {
            return res.status(503).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in forgotPassword controller:', error);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
        });
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await resetPasswordHelper(token, newPassword);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in resetPassword controller:', error);

        let statusCode = 400;
        if (error.message.includes('no encontrado')) {
            statusCode = 404;
        } else if (
            error.message.includes('inválido') ||
            error.message.includes('expirado')
        ) {
            statusCode = 401;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error al resetear contraseña',
            error: error.message,
        });
    }
});

export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.userId; // Viene del middleware validateJWT
    const user = await getUserProfileHelper(userId);

    // Respuesta estandarizada con envelope
    return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: user,
    });
});

export const getProfileById = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'El userId es requerido',
        });
    }

    const user = await getUserProfileHelper(userId);

    // Respuesta estandarizada con envelope
    return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: user,
    });
});

export const logout = asyncHandler(async (req, res) => {
    const userId = req.userId;
    return res.status(200).json({
        success: true,
        message: 'Sesion cerrada exitosamente',
        data: { userId },
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual y la nueva son requeridas',
            });
        }

        const result = await changePasswordHelper(userId, currentPassword, newPassword);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in changePassword controller:', error);

        let statusCode = 400;
        if (error.message.includes('no encontrado')) {
            statusCode = 404;
        } else if (error.message.includes('incorrecta')) {
            statusCode = 401;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error al cambiar contraseña',
        });
    }
});

// update profile (name, surname)
export const updateProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { name, surname } = req.body;

        if (!name && !surname) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar al menos un campo para actualizar',
            });
        }

        const result = await updateProfileHelper(userId, { name, surname });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in updateProfile controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al actualizar perfil',
        });
    }
});

// request username change
export const requestUsernameChange = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { newUsername } = req.body;

        if (!newUsername) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo nombre de usuario es requerido',
            });
        }

        const result = await requestUsernameChangeHelper(userId, newUsername);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in requestUsernameChange controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al solicitar cambio de nombre de usuario',
        });
    }
});

// confirm username change
export const confirmUsernameChange = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'El token es requerido',
            });
        }

        const result = await confirmUsernameChangeHelper(userId, token);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in confirmUsernameChange controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al confirmar cambio de nombre de usuario',
        });
    }
});

// request phone change
export const requestPhoneChange = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { newPhone } = req.body;

        if (!newPhone) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo número de teléfono es requerido',
            });
        }

        const result = await requestPhoneChangeHelper(userId, newPhone);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in requestPhoneChange controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al solicitar cambio de teléfono',
        });
    }
});

// confirm phone change
export const confirmPhoneChange = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'El token es requerido',
            });
        }

        const result = await confirmPhoneChangeHelper(userId, token);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in confirmPhoneChange controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al confirmar cambio de teléfono',
        });
    }
});

// change profile picture
export const changeImage = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ninguna imagen',
            });
        }

        const filePath = req.file.path.replace(/\\/g, '/');
        const result = await changeImageHelper(userId, filePath);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in changeImage controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al actualizar foto de perfil',
        });
    }
});

export const requestDeactivateAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const result = await requestDeactivateAccountHelper(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in requestDeactivateAccount controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al solicitar desactivación de cuenta',
        });
    }
});

export const confirmDeactivateAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.userId;
        const { token, emailOrUsername, password } = req.body;

        if (!token || !emailOrUsername || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token, email o username y contraseña son requeridos',
            });
        }

        const result = await confirmDeactivateAccountHelper(userId, token, emailOrUsername, password);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in confirmDeactivateAccount controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al confirmar desactivación de cuenta',
        });
    }
});

export const requestActivateAccount = asyncHandler(async (req, res) => {
    try {
        const { emailOrUsername } = req.body;
        if (!emailOrUsername) {
            return res.status(400).json({
                success: false,
                message: 'El email o nombre de usuario es requerido',
            });
        }
        const result = await requestActivateAccountHelper(emailOrUsername);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in requestActivateAccount controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al solicitar activación de cuenta',
        });
    }
});

export const confirmActivateAccount = asyncHandler(async (req, res) => {
    try {
        const { emailOrUsername, password, token } = req.body;
        if (!emailOrUsername || !password || !token) {
            return res.status(400).json({
                success: false,
                message: 'Email o username, contraseña y token son requeridos',
            });
        }
        const result = await confirmActivateAccountHelper(emailOrUsername, password, token);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in confirmActivateAccount controller:', error);
        res.status(error.status || 400).json({
            success: false,
            message: error.message || 'Error al confirmar activación de cuenta',
        });
    }
});