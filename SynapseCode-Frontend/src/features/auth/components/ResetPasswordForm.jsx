import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { clsx } from "clsx"
import toast from "react-hot-toast"
import Spinner from "../../../shared/components/ui/Spinner"
import { useAuthStore } from "../store/authStore"

const EyeIcon = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const EyeSlashIcon = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ResetPasswordForm = ({ token, onSuccess }) => {
    const { register, handleSubmit, formState: { errors }, control } = useForm()
    const resetPassword = useAuthStore(state => state.resetPassword)
    const loading = useAuthStore(state => state.loading)
    const error = useAuthStore(state => state.error)

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const password = useWatch({ control, name: "password", defaultValue: "" })

    const onSubmit = async (data) => {
        if (!token) {
            toast.error("El enlace de recuperacion no es valido.")
            return
        }

        const res = await resetPassword(token, data.password)

        if (res.success) {
            toast.success(res.message || "Contrasena actualizada correctamente", { duration: 4000 })
            onSuccess?.()
            return
        }

        toast.error(res.error || "Error al cambiar la contrasena", { duration: 4000 })
    }

    const labelClass = "mb-[0.4rem] block text-[0.85rem] font-medium text-foreground"
    const inputClass = (hasError) => clsx(
        "w-full box-border rounded-[10px] border bg-surface-light !py-[0.7rem] !pl-[2.75rem] !pr-[2.75rem] text-[0.9rem] text-foreground outline-none",
        "transition-[border-color,box-shadow] duration-200",
        "focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        hasError ? "border-error" : "border-border"
    )
    const iconClass = "absolute left-[0.75rem] top-1/2 flex -translate-y-1/2 items-center text-muted-foreground"
    const eyeButtonClass = "absolute right-[0.75rem] top-1/2 flex -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-white disabled:cursor-not-allowed disabled:opacity-60 hover:text-white/80 transition-colors"

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[1.75rem]">
            <div>
                <label htmlFor="password" className={labelClass}>
                    Nueva contrasena
                </label>
                <div className="relative">
                    <span className={iconClass}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        disabled={loading}
                        className={inputClass(errors.password)}
                        {...register("password", {
                            required: "La contrasena es obligatoria",
                            minLength: {
                                value: 8,
                                message: "La contrasena debe tener al menos 8 caracteres",
                            },
                        })}
                    />

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setShowPassword(value => !value)}
                        aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                        className={eyeButtonClass}
                    >
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-[0.3rem] text-xs text-error">{errors.password.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                    Confirmar contrasena
                </label>
                <div className="relative">
                    <span className={iconClass}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        disabled={loading}
                        className={inputClass(errors.confirmPassword)}
                        {...register("confirmPassword", {
                            required: "Confirma tu contrasena",
                            validate: (value) => value === password || "Las contrasenas no coinciden",
                        })}
                    />

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setShowConfirmPassword(value => !value)}
                        aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                        className={eyeButtonClass}
                    >
                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-[0.3rem] text-xs text-error">{errors.confirmPassword.message}</p>
                )}
            </div>

            {error && (
                <div className="rounded-[10px] border border-error/30 bg-error/10 !p-[0.85rem]">
                    <p className="text-[0.85rem] text-error">{error}</p>
                </div>
            )}

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
                {loading ? (
                    <>
                        <Spinner size="sm" className="text-background" />
                        Actualizando...
                    </>
                ) : (
                    <>
                        Actualizar contrasena
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </button>
        </form>
    )
}
