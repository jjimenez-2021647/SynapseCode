import { useAuthStore } from "../../features/auth/store/authStore"

export const DashboardPage = () => {
    const user = useAuthStore((state) => state.user)

    return (
        <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
            <section className="synapse-surface rounded-xl px-8 py-10">
                <p className="text-sm font-bold uppercase text-primary">SynapseCode</p>
                <h1 className="mt-3 text-4xl font-extrabold text-white">Dashboard</h1>
                <p className="mt-4 text-muted">
                    Bienvenido{user?.name ? `, ${user.name}` : ""}. Tu plan actual es{" "}
                    <strong className="text-primary">{user?.planType || "FREE"}</strong>.
                </p>
            </section>
        </main>
    )
}
