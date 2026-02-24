import {
    User,
    UserProfile,
    UserEmail,
    UserPasswordReset,
    UserUsernameChange,
    UserPhoneChange,
} from '../src/users/user.model.js';
import { UserRole, Role } from '../src/auth/role.model.js';
import { USER_ROLE } from './role-constants.js';
import { hashPassword } from '../utils/password-utils.js';
import { Op } from 'sequelize';

export const findUserByEmailOrUsername = async (emailOrUsername) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { Email: emailOrUsername.toLowerCase() },
                    { Username: { [Op.iLike]: emailOrUsername } },
                ],
            },
            include: [
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
                { model: UserPasswordReset, as: 'UserPasswordReset' },
                { model: UserUsernameChange, as: 'UserUsernameChange' },
                { model: UserPhoneChange, as: 'UserPhoneChange' },
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const findUserById = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            include: [
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
                { model: UserPasswordReset, as: 'UserPasswordReset' },
                { model: UserUsernameChange, as: 'UserUsernameChange' },
                { model: UserPhoneChange, as: 'UserPhoneChange' },
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por ID:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const checkUserExists = async (email, username) => {
    try {
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { Email: email.toLowerCase() },
                    { Username: username.toLowerCase() },
                ],
            },
        });
        return !!existingUser;
    } catch (error) {
        console.error('Error verificando si el usuario existe:', error);
        throw new Error('Error al verificar usuario');
    }
};

export const createNewUser = async (userData) => {
    const transaction = await User.sequelize.transaction();
    try {
        const { name, surname, username, email, password, phone, profilePicture } = userData;
        const hashedPassword = await hashPassword(password);

        const user = await User.create(
            {
                Name: name,
                Surname: surname,
                Username: username.toLowerCase(),
                Email: email.toLowerCase(),
                Password: hashedPassword,
                Status: false,
            },
            { transaction }
        );

        const { getDefaultAvatarPath } = await import('../helpers/cloudinary-service.js');
        const defaultAvatarFilename = getDefaultAvatarPath();

        await UserProfile.create(
            {
                UserId: user.Id,
                Phone: phone,
                ProfilePicture: profilePicture || defaultAvatarFilename,
            },
            { transaction }
        );

        await UserEmail.create({ UserId: user.Id, EmailVerified: false }, { transaction });
        await UserPasswordReset.create({ UserId: user.Id }, { transaction });
        await UserUsernameChange.create({ UserId: user.Id }, { transaction });
        await UserPhoneChange.create({ UserId: user.Id }, { transaction });

        const userRole = await Role.findOne({ where: { Name: USER_ROLE } }, { transaction });
        if (userRole) {
            await UserRole.create({ UserId: user.Id, RoleId: userRole.Id }, { transaction });
        } else {
            console.warn(`USER_ROLE not found in database during user creation for user ${user.Id}`);
        }

        await transaction.commit();
        const completeUser = await findUserById(user.Id);
        return completeUser;
    } catch (error) {
        await transaction.rollback();
        console.error('Error creando usuario:', error);
        throw new Error('Error al crear usuario');
    }
};

export const updateEmailVerificationToken = async (userId, token, expiry) => {
    try {
        await UserEmail.update(
            { EmailVerificationToken: token, EmailVerificationTokenExpiry: expiry },
            { where: { UserId: userId } }
        );
    } catch (error) {
        console.error('Error actualizando token de verificación:', error);
        throw new Error('Error al actualizar token de verificación');
    }
};

export const markEmailAsVerified = async (userId) => {
    const transaction = await User.sequelize.transaction();
    try {
        await UserEmail.update(
            { EmailVerified: true, EmailVerificationToken: null, EmailVerificationTokenExpiry: null },
            { where: { UserId: userId }, transaction }
        );
        await User.update({ Status: true }, { where: { Id: userId }, transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error marcando email como verificado:', error);
        throw new Error('Error al verificar email');
    }
};

export const updatePasswordResetToken = async (userId, token, expiry) => {
    try {
        await UserPasswordReset.update(
            { PasswordResetToken: token, PasswordResetTokenExpiry: expiry },
            { where: { UserId: userId } }
        );
    } catch (error) {
        console.error('Error actualizando token de reset:', error);
        throw new Error('Error al actualizar token de reset');
    }
};

export const findUserByEmail = async (email) => {
    try {
        const user = await User.findOne({
            where: { Email: email.toLowerCase() },
            include: [
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
                { model: UserPasswordReset, as: 'UserPasswordReset' },
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por email:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const findUserByEmailVerificationToken = async (token) => {
    try {
        const user = await User.findOne({
            include: [
                {
                    model: UserEmail,
                    as: 'UserEmail',
                    where: {
                        EmailVerificationToken: token,
                        EmailVerificationTokenExpiry: { [Op.gt]: new Date() },
                    },
                },
                { model: UserProfile, as: 'UserProfile' },
                { model: UserPasswordReset, as: 'UserPasswordReset' },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por token de verificación:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const findUserByPasswordResetToken = async (token) => {
    try {
        const user = await User.findOne({
            include: [
                {
                    model: UserPasswordReset,
                    as: 'UserPasswordReset',
                    where: {
                        PasswordResetToken: token,
                        PasswordResetTokenExpiry: { [Op.gt]: new Date() },
                    },
                },
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por token de reset:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const updateUserPassword = async (userId, hashedPassword) => {
    const transaction = await User.sequelize.transaction();
    try {
        await User.update({ Password: hashedPassword }, { where: { Id: userId }, transaction });
        await UserPasswordReset.update(
            { PasswordResetToken: null, PasswordResetTokenExpiry: null },
            { where: { UserId: userId }, transaction }
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error actualizando contraseña:', error);
        throw new Error('Error al actualizar contraseña');
    }
};

// Username Change 
export const updateUsernameChangeToken = async (userId, token, expiry, newUsername) => {
    try {
        await UserUsernameChange.update(
            { UsernameChangeToken: token, UsernameChangeTokenExpiry: expiry, NewUsername: newUsername },
            { where: { UserId: userId } }
        );
    } catch (error) {
        console.error('Error actualizando token de cambio de username:', error);
        throw new Error('Error al actualizar token de cambio de username');
    }
};

export const findUserByUsernameChangeToken = async (token) => {
    try {
        const user = await User.findOne({
            include: [
                {
                    model: UserUsernameChange,
                    as: 'UserUsernameChange',
                    where: {
                        UsernameChangeToken: token,
                        UsernameChangeTokenExpiry: { [Op.gt]: new Date() },
                    },
                },
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por token de cambio de username:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const applyUsernameChange = async (userId, newUsername) => {
    const transaction = await User.sequelize.transaction();
    try {
        await User.update({ Username: newUsername }, { where: { Id: userId }, transaction });
        await UserUsernameChange.update(
            { UsernameChangeToken: null, UsernameChangeTokenExpiry: null, NewUsername: null },
            { where: { UserId: userId }, transaction }
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error aplicando cambio de username:', error);
        throw new Error('Error al cambiar username');
    }
};

// Phone Change
export const updatePhoneChangeToken = async (userId, token, expiry, newPhone) => {
    try {
        await UserPhoneChange.update(
            { PhoneChangeToken: token, PhoneChangeTokenExpiry: expiry, NewPhone: newPhone },
            { where: { UserId: userId } }
        );
    } catch (error) {
        console.error('Error actualizando token de cambio de teléfono:', error);
        throw new Error('Error al actualizar token de cambio de teléfono');
    }
};

export const findUserByPhoneChangeToken = async (token) => {
    try {
        const user = await User.findOne({
            include: [
                {
                    model: UserPhoneChange,
                    as: 'UserPhoneChange',
                    where: {
                        PhoneChangeToken: token,
                        PhoneChangeTokenExpiry: { [Op.gt]: new Date() },
                    },
                },
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
            ],
        });
        return user;
    } catch (error) {
        console.error('Error buscando usuario por token de cambio de teléfono:', error);
        throw new Error('Error al buscar usuario');
    }
};

export const applyPhoneChange = async (userId, newPhone) => {
    const transaction = await User.sequelize.transaction();
    try {
        await UserProfile.update({ Phone: newPhone }, { where: { UserId: userId }, transaction });
        await UserPhoneChange.update(
            { PhoneChangeToken: null, PhoneChangeTokenExpiry: null, NewPhone: null },
            { where: { UserId: userId }, transaction }
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error aplicando cambio de teléfono:', error);
        throw new Error('Error al cambiar teléfono');
    }
};

// Profile Update
export const updateUserProfile = async (userId, { name, surname }) => {
    const transaction = await User.sequelize.transaction();
    try {
        await User.update({ Name: name, Surname: surname }, { where: { Id: userId }, transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error actualizando perfil:', error);
        throw new Error('Error al actualizar perfil');
    }
};

// Profile Picture
export const updateProfilePicture = async (userId, profilePicture) => {
    try {
        await UserProfile.update(
            { ProfilePicture: profilePicture },
            { where: { UserId: userId } }
        );
    } catch (error) {
        console.error('Error actualizando foto de perfil:', error);
        throw new Error('Error al actualizar foto de perfil');
    }
};

export const deactivateUserAccount = async (userId) => {
    try {
        await User.update(
            { Status: false },
            { where: { Id: userId } }
        );
    } catch (error) {
        console.error('Error desactivando cuenta:', error);
        throw new Error('Error al desactivar cuenta');
    }
};

export const checkUsernameExists = async (username) => {
    try {
        const existingUser = await User.findOne({
            where: { Username: { [Op.iLike]: username } },
        });
        return !!existingUser;
    } catch (error) {
        console.error('Error verificando si el username existe:', error);
        throw new Error('Error al verificar username');
    }
};

export const activateUserAccount = async (userId) => {
    try {
        await User.update(
            { Status: true },
            { where: { Id: userId } }
        );
    } catch (error) {
        console.error('Error activando cuenta:', error);
        throw new Error('Error al activar cuenta');
    }
};  

// Create user by admin
export const createUserByAdmin = async (userData) => {
    const transaction = await User.sequelize.transaction();
    try {
        const { name, surname, username, email, password, phone, profilePicture, roleName } = userData;
        const hashedPassword = await hashPassword(password);

        const user = await User.create(
            {
                Name: name,
                Surname: surname,
                Username: username.toLowerCase(),
                Email: email.toLowerCase(),
                Password: hashedPassword,
                Status: true, // Admin crea la cuenta ya activa
            },
            { transaction }
        );

        const { getDefaultAvatarPath } = await import('../helpers/cloudinary-service.js');
        const defaultAvatarFilename = getDefaultAvatarPath();

        await UserProfile.create(
            {
                UserId: user.Id,
                Phone: phone,
                ProfilePicture: profilePicture || defaultAvatarFilename,
            },
            { transaction }
        );

        await UserEmail.create({ UserId: user.Id, EmailVerified: true }, { transaction });
        await UserPasswordReset.create({ UserId: user.Id }, { transaction });
        await UserUsernameChange.create({ UserId: user.Id }, { transaction });
        await UserPhoneChange.create({ UserId: user.Id }, { transaction });

        // Asignar el rol que mande el admin
        const role = await Role.findOne({ where: { Name: roleName } }, { transaction });
        if (role) {
            await UserRole.create({ UserId: user.Id, RoleId: role.Id }, { transaction });
        } else {
            console.warn(`Rol ${roleName} no encontrado, asignando USER_ROLE por defecto`);
            const defaultRole = await Role.findOne({ where: { Name: USER_ROLE } }, { transaction });
            if (defaultRole) {
                await UserRole.create({ UserId: user.Id, RoleId: defaultRole.Id }, { transaction });
            }
        }

        await transaction.commit();
        return await findUserById(user.Id);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creando usuario por admin:', error);
        throw new Error('Error al crear usuario');
    }
};

// delete user by admin
export const deleteUser = async (userId) => {
    const transaction = await User.sequelize.transaction();
    try {
        await UserRole.destroy({ where: { UserId: userId }, transaction });
        await UserProfile.destroy({ where: { UserId: userId }, transaction });
        await UserEmail.destroy({ where: { UserId: userId }, transaction });
        await UserPasswordReset.destroy({ where: { UserId: userId }, transaction });
        await UserUsernameChange.destroy({ where: { UserId: userId }, transaction });
        await UserPhoneChange.destroy({ where: { UserId: userId }, transaction });
        await User.destroy({ where: { Id: userId }, transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error eliminando usuario:', error);
        throw new Error('Error al eliminar usuario');
    }
};

// update user by admin
export const updateUserByAdmin = async (userId, { name, surname, phone }) => {
    const transaction = await User.sequelize.transaction();
    try {
        await User.update(
            { Name: name, Surname: surname },
            { where: { Id: userId }, transaction }
        );
        if (phone) {
            await UserProfile.update(
                { Phone: phone },
                { where: { UserId: userId }, transaction }
            );
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error actualizando usuario:', error);
        throw new Error('Error al actualizar usuario');
    }
};

// get all users by admin
export const getAllUsers = async () => {
    try {
        const users = await User.findAll({
            include: [
                { model: UserProfile, as: 'UserProfile' },
                { model: UserEmail, as: 'UserEmail' },
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role' }],
                },
            ],
        });
        return users;
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        throw new Error('Error al obtener usuarios');
    }
};