import { axiosAuth } from "./api";

export const login = async (data) => {
    return await axiosAuth.post("/auth/login", data)
}

export const register = async (data) => {
    return await axiosAuth.post("/auth/register", data, {
        headers: { "Content-Type": "multipart/form-data" }
    })
}

export const verifyEmail = async (token) => {
    return await axiosAuth.post("/auth/verify-email", {token})
}

export const forgotPassword = async (email) => {
    return await axiosAuth.post("/auth/forgot-password", { email })
}

export const resetPassword = async (token, newPassword) => {
    return await axiosAuth.post("/auth/reset-password", { token, newPassword })
}

export const getProfile = async () => {
    return await axiosAuth.get("/auth/profile")
}

export const updateProfile = async (data) => {
    return await axiosAuth.put("/auth/profile", data)
}

export const updateProfileImage = async (formData) => {
    return await axiosAuth.put("/auth/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
}

export const resetProfileImage = async () => {
    return await axiosAuth.delete("/auth/profile/image")
}

export const changePassword = async (data) => {
    return await axiosAuth.put("/auth/change-password", data)
}

export const requestPhoneChange = async (data) => {
    return await axiosAuth.put("/auth/profile/phone", data)
}

export const confirmPhoneChange = async (data) => {
    return await axiosAuth.post("/auth/profile/phone/confirm", data)
}
