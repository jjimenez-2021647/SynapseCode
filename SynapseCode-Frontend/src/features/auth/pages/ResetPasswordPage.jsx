import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ParticleField } from '../components/landing/ParticleField'
import { ResetPasswordForm } from '../components/ResetPasswordForm'

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')
    const [isValidToken, setIsValidToken] = useState(true)

    useEffect(() => {
        setIsValidToken(Boolean(token) && token.length >= 20)
    }, [token])

    const handleSuccess = () => {
        navigate('/', { replace: true })
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)] p-4">
            <ParticleField />

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[18%] right-[12%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[16%] left-[10%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.08)_0%,transparent_70%)] blur-[40px]" />
            </div>

            <section className="relative z-10 w-full max-w-md glass rounded-2xl !px-[2rem] !py-[2.75rem] shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <a href="/" className="mb-[1.5rem] flex items-center justify-center gap-[0.5rem]">
                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#00d9ff,#ff00ff)] shadow-[0_8px_24px_rgba(0,217,255,0.3)]">
                        <span className="text-base font-bold text-background">&lt;/&gt;</span>
                    </div>
                    <span className="text-[1.5rem] font-bold leading-none">
                        <span className="text-primary">Synapse</span>
                        <span className="text-accent">Code</span>
                    </span>
                </a>

                <div className="mb-[2.25rem] text-center">
                    <div className="mb-[1.25rem] flex w-full justify-center">
                        <div className="grid h-[60px] w-[60px] place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_32px_rgba(0,217,255,0.16)]">
                            <svg className="block translate-y-[1px]" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <rect x="4" y="10" width="16" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="mb-[0.75rem] text-[1.55rem] font-bold leading-tight text-foreground">
                        Restablecer contrasena
                    </h1>
                    <p className="mx-auto max-w-sm text-[0.92rem] leading-6 text-muted">
                        Crea una nueva contrasena segura para volver a ingresar a tu cuenta.
                    </p>
                </div>

                {isValidToken ? (
                    <ResetPasswordForm token={token} onSuccess={handleSuccess} />
                ) : (
                    <div className="flex flex-col gap-[1.75rem]">
                        <div className="rounded-[10px] border border-error/30 bg-error/10 !p-[1rem]">
                            <h2 className="mb-[0.35rem] text-[0.95rem] font-semibold text-error">
                                Enlace invalido o expirado
                            </h2>
                            <p className="text-[0.85rem] leading-6 text-muted">
                                El enlace no es valido o ya expiro. Vuelve al login y solicita uno nuevo.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex w-full cursor-pointer items-center justify-center gap-[0.5rem] rounded-[10px] border-0 bg-gradient-to-r from-primary to-accent !p-[0.8rem] text-[0.95rem] font-semibold tracking-[0.02em] text-background shadow-[0_4px_24px_rgba(0,217,255,0.25)] transition-[opacity,box-shadow] duration-200"
                        >
                            Volver al login
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}
