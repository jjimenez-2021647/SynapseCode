import { useForm } from "react-hook-form"
import { clsx } from "clsx"

export const ForgotPasswordForm = ({ onSwitch }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const onSubmit = (data) => {
        console.log(data)
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
                className="mt-[0.35rem] w-full cursor-pointer rounded-[10px] border-0 bg-gradient-to-r from-primary to-accent !p-[0.8rem] text-[0.95rem] font-semibold text-background shadow-[0_4px_24px_rgba(0,217,255,0.25)] transition-opacity duration-200"
            >
                Enviar Correo
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
