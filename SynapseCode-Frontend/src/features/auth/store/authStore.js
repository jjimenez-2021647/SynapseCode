import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    login as loginRequest,
    register as registerRequest,
    forgotPassword as forgotPasswordRequest,
    resetPassword as resetPasswordRequest,
} from "../../../shared/api"
import { showError } from "../../../shared/utils/toast"

const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= Date.now();
}

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            loading: false,
            error: null,
            isLoadingAuth: true,
            isAuthenticated: false,

            checkAuth: () => {
                const token = get().token;
                const role = get().user?.role;
                const isAdmin = role === "ADMIN_ROLE";

                if (!token || isExpired(get().expiresAt)) {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoadingAuth: false,
                        error: null
                    })
                    return;
                }

                if (token && !isAdmin) {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoadingAuth: false,
                        error: "No tienes permisos para acceder como administrador."
                    })
                    return;
                }

                set({
                    isLoadingAuth: false,
                    isAuthenticated: Boolean(token) && isAdmin
                })
            },

            login: async ({ emailOrUsername, password }) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await loginRequest({ emailOrUsername, password })

                    const role = data?.userDetails?.role;

                    if (role !== "ADMIN_ROLE") {
                        const message =
                            "No tienes permisos para acceder como administrador"
                        set({
                            user: null,
                            token: null,
                            refreshToken: null,
                            expiresAt: null,
                            isAuthenticated: false,
                            isLoadingAuth: false,
                            loading: false,
                            error: message
                        })
                        
                        showError(message);
                        return { success: false, error: message}
                    }

                    set({
                        user: data.userDetails,
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        expiresAt: data.expiresAt,
                        loading: false,
                        isLoadingAuth: false,
                        isAuthenticated: true
                    })

                    return { success: true }

                } catch (err) {
                    console.error("Login error:", err);
                    const message =
                        err.response?.status === 401
                            ? "Usuario o contrasena incorrectos"
                            : err.response?.data?.message || "Error de autenticacion";
                    set({ error: message, loading: false, isLoadingAuth: false })
                    return { success: false, error: message }
                }
            },

            register: async (formData) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await registerRequest(formData);
                    set({ loading: false });
                    return {
                        success: true,
                        emailVerificationRequired: data?.emailVerificationRequired,
                        data,
                    }
                } catch (err) {
                    const message = err.response?.data?.message || "Error al registrarse";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            forgotPassword: async (email) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await forgotPasswordRequest(email);
                    set({ loading: false });
                    return {
                        success: true,
                        message: data?.message || "Te enviamos un enlace para restablecer tu contrasena.",
                        data,
                    };
                } catch (err) {
                    const message =
                        err.response?.data?.message || "No se pudo enviar el correo de recuperacion";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            resetPassword: async (token, newPassword) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await resetPasswordRequest(token, newPassword);
                    set({ loading: false });
                    return {
                        success: true,
                        message: data?.message || "Contrasena actualizada correctamente.",
                        data,
                    };
                } catch (err) {
                    const message =
                        err.response?.data?.message || "No se pudo actualizar la contrasena";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    expiresAt: null,
                    isAuthenticated: false,
                    isLoadingAuth: false
                })
            }
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                expiresAt: state.expiresAt,
                isAuthenticated: state.isAuthenticated,
            })
        }
    )
)
