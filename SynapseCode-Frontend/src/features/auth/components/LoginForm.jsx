import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"
import { clsx } from "clsx"
import toast from "react-hot-toast"

export const LoginForm = ({ onForgot, onRegister }) => {
    const navigate = useNavigate()
    const [showPass, setShowPass] = useState(false)
    const [loginError, setLoginError] = useState("")

    const { register, handleSubmit, formState: { errors } } = useForm()
    const login = useAuthStore(state => state.login)
    const loading = useAuthStore(state => state.loading)

    const onSubmit = async (data) => {
        setLoginError("")
        const res = await login(data)
        if (res.success) {
            navigate(
                res.role === "ADMIN_ROLE"
                    ? "/admin-dashboard"
                    : res.planType
                        ? "/dashboard"
                        : "/pricing-page"
            )
            toast.success("¡Bienvenido de nuevo!", { duration: 4000 })
            return
        }

        setLoginError(res.error || "Usuario o contrasena incorrectos")
    }

    const labelClass = "block mb-[0.4rem] text-[0.85rem] font-medium text-foreground"
    const inputClass = (hasError) => clsx(
        "w-full box-border rounded-[10px] border bg-surface-light !py-[0.7rem] !pr-[0.75rem] !pl-[2.75rem] text-[0.9rem] text-foreground outline-none",
        "transition-[border-color,box-shadow] duration-200",
        "focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]",
        hasError ? "border-error" : "border-border"
    )
    const iconClass = "absolute left-[0.75rem] top-1/2 flex -translate-y-1/2 items-center text-muted-foreground"

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[1.75rem]">

            {/* Email */}
            <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                    <span className={iconClass}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="tu@email.com"
                        className={inputClass(errors.emailOrUsername)}
                        {...register("emailOrUsername", { required: "Este campo es requerido" })}
                    />
                </div>
                {errors.emailOrUsername && (
                    <p className="mt-[0.3rem] text-xs text-error">
                        {errors.emailOrUsername.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div>
                <div className="mb-[0.4rem] flex items-center justify-between gap-[0.75rem]">
                    <label className="block text-[0.85rem] font-medium text-foreground">Contraseña</label>
                    <button
                        type="button"
                        onClick={onForgot}
                        className="cursor-pointer border-0 bg-transparent p-0 text-[0.82rem] font-medium text-primary"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
                <div className="relative">
                    <span className={iconClass}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        className={clsx(inputClass(errors.password), "pr-[2.75rem]")}
                        {...register("password", { required: "La contraseña es obligatoria" })}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-[0.75rem] top-1/2 flex -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-muted-foreground"
                    >
                        {showPass ? (
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
                <label className="mt-[0.75rem] flex w-fit cursor-pointer items-center gap-[0.45rem] text-[0.82rem] font-medium text-muted-foreground">
                    <input
                        type="checkbox"
                        className="cursor-pointer accent-primary"
                        {...register("rememberMe")}
                    />
                    Recordarme
                </label>
                {errors.password && (
                    <p className="mt-[0.3rem] text-xs text-error">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {loginError && (
                <div className="-mt-[0.35rem] rounded-[10px] border border-error/30 bg-error/10 !p-[0.85rem]">
                    <p className="text-center text-[0.85rem] text-error">
                        {loginError}
                    </p>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className={clsx(
                    "mt-[0.55rem] flex w-full items-center justify-center gap-[0.5rem] rounded-[10px] border-0 !p-[0.8rem] text-[0.95rem] font-semibold tracking-[0.02em]",
                    "transition-[opacity,box-shadow] duration-200",
                    loading
                        ? "cursor-not-allowed bg-gradient-to-r from-primary to-accent text-background opacity-80 shadow-[0_4px_24px_rgba(0,217,255,0.25)]"
                        : "cursor-pointer bg-gradient-to-r from-primary to-accent text-background shadow-[0_4px_24px_rgba(0,217,255,0.25)]"
                )}
            >
                {loading ? "Iniciando..." : (
                    <>
                        Iniciar Sesión
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </button>

            <p className="-mt-[0.15rem] text-center text-[0.85rem] text-muted-foreground">
                No tienes cuenta?{' '}
                <button
                    type="button"
                    onClick={onRegister}
                    className="cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] font-medium text-primary"
                >
                    Registrate
                </button>
            </p>
        </form>
    )
}
