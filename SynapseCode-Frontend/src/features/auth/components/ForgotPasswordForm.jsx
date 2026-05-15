import { useForm } from "react-hook-form"
import { clsx } from "clsx"
import toast from "react-hot-toast"
import Spinner from "../../../shared/components/ui/Spinner"
import { useAuthStore } from "../store/authStore"

export const ForgotPasswordForm = ({ onSwitch }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()
    const forgotPassword = useAuthStore(state => state.forgotPassword)
    const loading = useAuthStore(state => state.loading)

    const onSubmit = async (data) => {
        const res = await forgotPassword(data.email)
        if (res.success) {
            toast.success(res.message, { duration: 4000 })
            return
        }

        toast.error(res.error || "No se pudo enviar el correo", { duration: 4000 })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[1.75rem]">
            <div>
                <label className="mb-[0.4rem] block text-[0.85rem] font-medium text-foreground">
                    Email
                </label>
                <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    disabled={loading}
                    className={clsx(
                        "w-full box-border rounded-[10px] border bg-surface-light !px-[0.75rem] !py-[0.7rem] text-[0.9rem] text-foreground outline-none",
                        "transition-[border-color,box-shadow] duration-200",
                        "focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]",
                        errors.email ? "border-error" : "border-border"
                    )}
                    {...register("email", { required: "El correo es obligatorio" })}
                />
                {errors.email && (
                    <p className="mt-[0.3rem] text-xs text-error">
                        {errors.email.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className={clsx(
                    "mt-[0.35rem] flex w-full items-center justify-center gap-[0.5rem] rounded-[10px] border-0 !p-[0.8rem] text-[0.95rem] font-semibold text-background transition-opacity duration-200",
                    loading
                        ? "cursor-not-allowed bg-gradient-to-r from-primary to-accent text-background opacity-80 shadow-[0_4px_24px_rgba(0,217,255,0.25)]"
                        : "cursor-pointer bg-gradient-to-r from-primary to-accent shadow-[0_4px_24px_rgba(0,217,255,0.25)]"
                )}
            >
                {loading ? (
                    <>
                        <Spinner size="sm" className="text-background" />
                        Enviando...
                    </>
                ) : "Enviar Correo"}
            </button>

            <p className="text-center text-[0.85rem] text-muted">
                ¿Recordaste tu contraseña?{" "}
                <button
                    type="button"
                    onClick={onSwitch}
                    className="cursor-pointer border-0 bg-transparent text-[0.85rem] font-medium text-primary"
                >
                    Iniciar Sesión
                </button>
            </p>
        </form>
    )
}
