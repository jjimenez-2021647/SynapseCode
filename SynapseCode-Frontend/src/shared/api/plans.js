import { axiosPlans } from "./api";

export const selectPlan = async ({ planName, email, name, institutionName, maxParticipants, amountPaid }) => {
    return await axiosPlans.post("/subscriptions/select", { planName, email, name, institutionName, maxParticipants, amountPaid });
}
