import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { ParticleField } from '../components/landing/ParticleField'

export const AuthPage = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [authView, setAuthView] = useState(location.pathname === '/register' ? 'register' : 'login')
    const [logoError, setLogoError] = useState(false)

    useEffect(() => {
        setAuthView(location.pathname === '/register' ? 'register' : 'login')
    }, [location.pathname])

    const goLogin = () => {
        setAuthView('login')
        navigate('/')
    }

    const goRegister = () => {
        setAuthView('register')
        navigate('/register')
    }

    const goForgot = () => {
        setAuthView('forgot')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)]">
            <ParticleField />

            {/* Ambient glow blobs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] right-[15%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[20%] left-[10%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.06)_0%,transparent_70%)] blur-[40px]" />
            </div>

            {/* Card */}
            <div className={`relative z-10 w-full glass rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${authView === 'register' ? 'max-w-2xl' : 'max-w-md'}`}>
                <div className="!px-[2rem] !py-[2.75rem]">
                    {/* Logo */}
                    <a href="/" className="mb-[1.5rem] flex items-center justify-center gap-[0.5rem]">
                        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#00d9ff,#ff00ff)] shadow-[0_8px_24px_rgba(0,217,255,0.3)]">
                            {logoError ? (
                                <span className="text-base font-bold text-background">&lt;/&gt;</span>
                            ) : (
                                <img
                                    src="/src/assets/img/kinal_sports.png"
                                    alt="Kinal Sports"
                                    className="h-6 w-auto brightness-0 invert"
                                    onError={() => setLogoError(true)}
                                />
                            )}
                        </div>
                        <span className="text-[1.5rem] font-bold leading-none">
                            <span className="text-primary">Synapse</span>
                            <span className="text-accent">Code</span>
                        </span>
                    </a>

                    {/* Subtitle */}
                    <p className="mb-[2.25rem] text-center text-[0.9rem] text-muted">
                        {authView === 'forgot'
                            ? 'Ingresa tu correo para recuperar tu acceso'
                            : authView === 'register'
                                ? 'Crea tu cuenta para acceder a la administracion'
                                : 'Ingresa a tu espacio de administracion'}
                    </p>

                    <div className="mt-[0.25rem]">
                        {authView === 'forgot' && (
                            <ForgotPasswordForm onSwitch={goLogin} />
                        )}
                        {authView === 'register' && (
                            <RegisterForm onBack={goLogin} onSuccess={goLogin} />
                        )}
                        {authView === 'login' && (
                            <LoginForm onForgot={goForgot} onRegister={goRegister} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
