import { useNavigate } from "react-router-dom"
import { ParticleField } from "../components/landing/ParticleField"
import { useAuthStore } from "../store/authStore"

export const UnauthorizedPage = () => {
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)] p-4">
            <ParticleField />

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[18%] right-[12%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[16%] left-[10%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.08)_0%,transparent_70%)] blur-[40px]" />
            </div>

            <section className="relative z-10 w-full max-w-md glass rounded-2xl !px-[2rem] !py-[3rem] text-center shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <a href="/" className="mb-[2.35rem] flex items-center justify-center gap-[0.5rem]">
                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#00d9ff,#ff00ff)] shadow-[0_8px_24px_rgba(0,217,255,0.3)]">
                        <span className="text-base font-bold text-background">&lt;/&gt;</span>
                    </div>
                    <span className="text-[1.5rem] font-bold leading-none">
                        <span className="text-primary">Synapse</span>
                        <span className="text-accent">Code</span>
                    </span>
                </a>

                <div className="mb-[1.75rem] flex w-full justify-center">
                    <div className="grid h-[68px] w-[68px] place-items-center rounded-full border border-error/30 bg-error/10 text-error shadow-[0_0_32px_rgba(239,68,68,0.16)]">
                        <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M12 3l8 4v5c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 8v5" strokeLinecap="round" />
                            <path d="M12 16h.01" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <h1 className="mb-[1rem] text-[1.55rem] font-bold leading-tight text-foreground">
                    Acceso denegado
                </h1>

                <p className="mx-auto mb-[2.35rem] max-w-sm text-[0.92rem] leading-6 text-muted">
                    No tienes permisos para entrar a esta seccion. Usa una cuenta autorizada o vuelve a un lugar seguro.
                </p>

                <button
                    type="button"
                    onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
                    className="flex w-full cursor-pointer items-center justify-center gap-[0.5rem] rounded-[10px] border-0 bg-gradient-to-r from-primary to-accent !p-[0.8rem] text-[0.95rem] font-semibold tracking-[0.02em] text-background shadow-[0_4px_24px_rgba(0,217,255,0.25)] transition-[opacity,box-shadow] duration-200"
                >
                    {isAuthenticated ? "Volver al dashboard" : "Volver al login"}
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </section>
        </div>
    )
}
