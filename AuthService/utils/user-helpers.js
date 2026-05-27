import {
    getFullImageUrl,
    getDefaultAvatarPath,
    isDefaultAvatar,
} from '../helpers/cloudinary-service.js';

export const buildUserResponse = (user) => {
    const profilePicture = user.UserProfile?.ProfilePicture;
    const profilePictureIsDefault = isDefaultAvatar(profilePicture);
    const profilePictureUrl =
        profilePicture
            ? getFullImageUrl(profilePicture)
            : getFullImageUrl(getDefaultAvatarPath());

    return {
        id: user.Id,
        name: user.Name,
        surname: user.Surname,
        username: user.Username,
        email: user.Email,
        phone: user.UserProfile?.Phone ?? '',
        profilePicture: profilePictureUrl,
        profilePictureIsDefault,
        role: user.UserRoles?.[0]?.Role?.Name ?? 'USER_ROLE',
        planType: user.UserProfile?.PlanType ?? null,
        orgUserType: user.UserProfile?.OrgUserType ?? null,
        status: user.Status,
        isEmailVerified: user.UserEmail ? user.UserEmail.EmailVerified : false,
        createdAt: user.CreatedAt,
        updatedAt: user.UpdatedAt,
    };
};
