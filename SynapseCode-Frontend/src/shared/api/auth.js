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