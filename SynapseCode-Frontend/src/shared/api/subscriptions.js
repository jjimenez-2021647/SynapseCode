import { axiosPlans } from "./api"

// Obtener la suscripción actual del usuario
export const getCurrentSubscription = async () => {
    try {
        return await axiosPlans.get("/subscriptions/current")
    } catch (error) {
        console.error('Error obtaining subscription:', error)
        return null
    }
}

// Obtener suscripción de un usuario específico por ID
export const getUserSubscription = async (userId) => {
    try {
        return await axiosPlans.get(`/subscriptions/user/${userId}`)
    } catch (error) {
        console.error('Error obtaining user subscription:', error)
        return null
    }
}
