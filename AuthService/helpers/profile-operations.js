import {
    findUserById,
    updateUserProfile,
    updateUsernameChangeToken,
    findUserByUsernameChangeToken,
    applyUsernameChange,
    updatePhoneChangeToken,
    findUserByPhoneChangeToken,
    applyPhoneChange,
    updateProfilePicture,
    updatePasswordResetToken,
    deactivateUserAccount,
} from './user-db.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { generatePasswordResetToken } from '../utils/auth-helpers.js';
import { uploadImage, deleteImage } from './cloudinary-service.js';
import { sendUsernameChangeEmail, sendPhoneChangeEmail, sendDeactivateAccountEmail, sendUsernameChangedEmail,
    sendPhoneChangedEmail, sendAccountDeactivatedEmail, sendActivateAccountEmail, sendAccountActivatedEmail } from './email-service.js';
import crypto from 'crypto';
import path from 'path';

export const getUserProfileHelper = async (userId) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }
    return buildUserResponse(user);
};

// Update profile (name, surname)
export const updateProfileHelper = async (userId, { name, surname }) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    await updateUserProfile(userId, {
        name: name || user.Name,
        surname: surname || user.Surname,
    });

    const updatedUser = await findUserById(userId);
    return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: buildUserResponse(updatedUser),
    };
};

// request username change
export const requestUsernameChangeHelper = async (userId, newUsername) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    // Verificar que el nuevo username no este en uso
    const { checkUsernameExists } = await import('./user-db.js');
    const exists = await checkUsernameExists(newUsername);
    if (exists) {
        const err = new Error('El nombre de usuario ya esta en uso');
        err.status = 409;
        throw err;
    }

    const token = await generatePasswordResetToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await updateUsernameChangeToken(userId, token, expiry, newUsername);

    Promise.resolve()
        .then(() => sendUsernameChangeEmail(user.Email, user.Name, token, newUsername))
        .catch((err) => console.error('Error enviando email de cambio de username:', err));

    return {
        success: true,
        message: 'Se ha enviado un token a tu correo para confirmar el cambio de nombre de usuario',
    };
};

// confirm username change
export const confirmUsernameChangeHelper = async (userId, token) => {
    const user = await findUserByUsernameChangeToken(token);
    if (!user) {
        const err = new Error('Token invalido o expirado');
        err.status = 401;
        throw err;
    }

    // Verificar que el token pertenece al usuario que hace la peticion
    if (user.Id !== userId) {
        const err = new Error('No tienes permisos para realizar esta accion');
        err.status = 403;
        throw err;
    }

    const newUsername = user.UserUsernameChange.NewUsername;
    await applyUsernameChange(userId, newUsername);

    Promise.resolve()
    .then(() => sendUsernameChangedEmail(user.Email, user.Name, newUsername))
    .catch((err) => console.error('Error enviando email de confirmación de username:', err));

    const updatedUser = await findUserById(userId);
    return {
        success: true,
        message: 'Nombre de usuario actualizado exitosamente',
        data: buildUserResponse(updatedUser),
    };
};

// request phone change
export const requestPhoneChangeHelper = async (userId, newPhone) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    const token = await generatePasswordResetToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await updatePhoneChangeToken(userId, token, expiry, newPhone);

    Promise.resolve()
        .then(() => sendPhoneChangeEmail(user.Email, user.Name, token, newPhone))
        .catch((err) => console.error('Error enviando email de cambio de teléfono:', err));

    return {
        success: true,
        message: 'Se ha enviado un token a tu correo para confirmar el cambio de número de teléfono',
    };
};

// cofirm phone change
export const confirmPhoneChangeHelper = async (userId, token) => {
    const user = await findUserByPhoneChangeToken(token);
    if (!user) {
        const err = new Error('Token invalido o expirado');
        err.status = 401;
        throw err;
    }

    if (user.Id !== userId) {
        const err = new Error('No tienes permisos para realizar esta accion');
        err.status = 403;
        throw err;
    }

    const newPhone = user.UserPhoneChange.NewPhone;
    await applyPhoneChange(userId, newPhone);

    Promise.resolve()
    .then(() => sendPhoneChangedEmail(user.Email, user.Name, newPhone))
    .catch((err) => console.error('Error enviando email de confirmación de teléfono:', err));

    const updatedUser = await findUserById(userId);
    return {
        success: true,
        message: 'Número de teléfono actualizado exitosamente',
        data: buildUserResponse(updatedUser),
    };
};

// change profile picture
export const changeImageHelper = async (userId, filePath) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    // Eliminar imagen anterior de Cloudinary si no es el avatar por defecto
    const currentPicture = user.UserProfile?.ProfilePicture;
    if (currentPicture) {
        await deleteImage(currentPicture).catch((err) =>
            console.warn('No se pudo eliminar la imagen anterior:', err)
        );
    }

    // Subir nueva imagen a Cloudinary
    const ext = path.extname(filePath);
    const randomHex = crypto.randomBytes(6).toString('hex');
    const cloudinaryFileName = `profile-${randomHex}${ext}`;
    const newImageUrl = await uploadImage(filePath, cloudinaryFileName);

    await updateProfilePicture(userId, newImageUrl);

    const updatedUser = await findUserById(userId);
    return {
        success: true,
        message: 'Foto de perfil actualizada exitosamente',
        data: buildUserResponse(updatedUser),
    };
};

export const requestDeactivateAccountHelper = async (userId) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    const token = await generatePasswordResetToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await updatePasswordResetToken(userId, token, expiry);

    Promise.resolve()
        .then(() => sendDeactivateAccountEmail(user.Email, user.Name, token))
        .catch((err) => console.error('Error enviando email de desactivación:', err));

    return {
        success: true,
        message: 'Se ha enviado un token a tu correo para confirmar la desactivación de tu cuenta',
    };
};

export const confirmDeactivateAccountHelper = async (userId, token, emailOrUsername, password) => {
    const user = await findUserById(userId);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    // Verificar que el token pertenece al usuario
    const userPasswordReset = user.UserPasswordReset;
    if (
        !userPasswordReset?.PasswordResetToken ||
        userPasswordReset.PasswordResetToken !== token ||
        new Date(userPasswordReset.PasswordResetTokenExpiry) < new Date()
    ) {
        const err = new Error('Token invalido o expirado');
        err.status = 401;
        throw err;
    }

    // Verificar email o username
    const isEmailOrUsername =
        user.Email === emailOrUsername.toLowerCase() ||
        user.Username.toLowerCase() === emailOrUsername.toLowerCase();
    if (!isEmailOrUsername) {
        const err = new Error('Credenciales invalidas');
        err.status = 401;
        throw err;
    }

    // Verificar contraseña
    const { verifyPassword } = await import('../utils/password-utils.js');
    const isValidPassword = await verifyPassword(user.Password, password);
    if (!isValidPassword) {
        const err = new Error('Credenciales invalidas');
        err.status = 401;
        throw err;
    }

    await deactivateUserAccount(userId);

    // Limpiar token
    await updatePasswordResetToken(userId, null, null);

    Promise.resolve()
    .then(() => sendAccountDeactivatedEmail(user.Email, user.Name))
    .catch((err) => console.error('Error enviando email de confirmación de desactivación:', err));

    return {
        success: true,
        message: 'Cuenta desactivada exitosamente',
    };
};                       

export const requestActivateAccountHelper = async (emailOrUsername) => {
    const { findUserByEmailOrUsername } = await import('./user-db.js');
    const user = await findUserByEmailOrUsername(emailOrUsername);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    if (user.Status) {
        const err = new Error('La cuenta ya está activa');
        err.status = 400;
        throw err;
    }

    const token = await generatePasswordResetToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await updatePasswordResetToken(user.Id, token, expiry);

    Promise.resolve()
        .then(() => sendActivateAccountEmail(user.Email, user.Name, token))
        .catch((err) => console.error('Error enviando email de activación:', err));

    return {
        success: true,
        message: 'Se ha enviado un token a tu correo para confirmar la activación de tu cuenta',
    };
};

export const confirmActivateAccountHelper = async (emailOrUsername, password, token) => {
    const { findUserByEmailOrUsername } = await import('./user-db.js');
    const user = await findUserByEmailOrUsername(emailOrUsername);
    if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }

    if (user.Status) {
        const err = new Error('La cuenta ya está activa');
        err.status = 400;
        throw err;
    }

    // Verificar contraseña
    const { verifyPassword } = await import('../utils/password-utils.js');
    const isValidPassword = await verifyPassword(user.Password, password);
    if (!isValidPassword) {
        const err = new Error('Credenciales invalidas');
        err.status = 401;
        throw err;
    }

    // Verificar token
    const userPasswordReset = user.UserPasswordReset;
    if (
        !userPasswordReset?.PasswordResetToken ||
        userPasswordReset.PasswordResetToken !== token ||
        new Date(userPasswordReset.PasswordResetTokenExpiry) < new Date()
    ) {
        const err = new Error('Token invalido o expirado');
        err.status = 401;
        throw err;
    }

    const { activateUserAccount } = await import('./user-db.js');
    await activateUserAccount(user.Id);
    await updatePasswordResetToken(user.Id, null, null);

    Promise.resolve()
        .then(() => sendAccountActivatedEmail(user.Email, user.Name))
        .catch((err) => console.error('Error enviando email de confirmación de activación:', err));

    return {
        success: true,
        message: 'Cuenta activada exitosamente',
    };
};