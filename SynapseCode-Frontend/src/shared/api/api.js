import axios from 'axios';
import { useAuthStore } from "../../features/auth/store/authStore"

const axiosAuth = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
    timeout: 8000,
    headers: {
        "Content-Type": "application/json"
    }
})

const axiosPlans = axios.create({
    baseURL: import.meta.env.VITE_PLANS_URL || "http://localhost:3013/api/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
})

const axiosRooms = axios.create({
    baseURL: import.meta.env.VITE_ROOMS_URL || "http://localhost:3007/api/v1",
    timeout: 10000,
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

axiosPlans.interceptors.request.use((config) => {
    config.axiosClient = "plans";
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers["x-token"] = token;
    }
    return config;
})

axiosRooms.interceptors.request.use((config) => {
    config.axiosClient = "rooms";
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export { axiosAuth, axiosPlans, axiosRooms }
