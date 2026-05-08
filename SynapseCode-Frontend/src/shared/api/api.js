import axios from 'axios';
import { useAuthStore } from "../../features/auth/store/authStore"

const axiosAuth = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
    timeout: 8000,
    headers: {
        "Content-Type": "application/json"
    }
})

axiosAuth.interceptors.request.use((config) => {
    config.axiosClient = "auth";
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export { axiosAuth }