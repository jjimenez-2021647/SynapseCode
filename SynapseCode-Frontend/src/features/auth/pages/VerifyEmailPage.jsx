import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { clsx } from "clsx"
import Spinner from "../../../shared/components/ui/Spinner"
import { ParticleField } from "../components/landing/ParticleField"
import { useVerifyEmail } from "../hooks/useVerifyEmail"

export const VerifyEmailPage = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const token = new URLSearchParams(location.search).get("token")

    const handleFinish = useCallback(() => {
        setTimeout(() => navigate("/auth", { replace: true }), 2000)
    }, [navigate])

    const { status, message } = useVerifyEmail(token, handleFinish)

    const isLoading = status === "loading"
    const isSuccess = status === "success"

    const displayMessage = isLoading
        ? "Verificando correo, por favor espera..."
        : message

    const title = isLoading
        ? "Verificando tu correo"
        : isSuccess
            ? "Correo verificado"
            : "No pudimos verificarlo"

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)] p-4">
            <ParticleField />

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[18%] right-[12%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[16%] left-[10%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.08)_0%,transparent_70%)] blur-[40px]" />
            </div>

            <section className="relative z-10 w-full max-w-md glass rounded-2xl !px-[2rem] !py-[2.75rem] text-center shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <a href="/" className="mb-[2rem] flex items-center justify-center gap-[0.5rem]">
                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] border-2 border-[#008B9D] bg-transparent">
                        <span className="text-base font-bold text-white">&lt;/&gt;</span>
                    </div>
                    <span className="text-[1.5rem] font-bold leading-none">
                        <span className="text-primary">Synapse</span>
                        <span className="text-accent">Code</span>
                    </span>
                </a>

                <div
                    className={clsx(
                        "mx-auto mb-[1.5rem] flex h-[68px] w-[68px] items-center justify-center rounded-full border",
                        isLoading && "border-primary/30 bg-primary/10 text-primary shadow-[0_0_32px_rgba(0,217,255,0.16)]",
                        isSuccess && "border-success/30 bg-success/10 text-success shadow-[0_0_32px_rgba(16,185,129,0.16)]",
                        !isLoading && !isSuccess && "border-error/30 bg-error/10 text-error shadow-[0_0_32px_rgba(239,68,68,0.16)]"
                    )}
                >
                    {isLoading ? (
                        <Spinner size="md" />
                    ) : isSuccess ? (
                        <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                <h1 className="mb-[0.75rem] text-[1.55rem] font-bold leading-tight text-foreground">
                    {title}
                </h1>

                <p
                    className="mx-auto mb-[2rem] max-w-sm text-[0.92rem] leading-6 text-muted"
                    aria-live="polite"
                >
                    {displayMessage}
                </p>

            </section>
        </div>
    )
}
