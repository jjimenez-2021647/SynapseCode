import { axiosPlans } from "./api"

export const getCurrentSubscription = async () => {
    return await axiosPlans.get("/subscriptions/current")
}

export const getUserSubscription = async (userId) => {
    return await axiosPlans.get(`/subscriptions/user/${userId}`)
}
