import { useForm } from "react-hook-form"
import { clsx } from "clsx"
import toast from "react-hot-toast"
import Spinner from "../../../shared/components/ui/Spinner"
import { useAuthStore } from "../store/authStore"

export const RegisterForm = ({ onBack, onSuccess }) => {
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm()

    const registerUser = useAuthStore((state) => state.register)
    const loading = useAuthStore((state) => state.loading)

    const submit = async (values) => {
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("surname", values.surname)
        formData.append("username", values.username)
        formData.append("email", values.email)
        formData.append("password", values.password)
        formData.append("phone", values.phone)

        const result = await registerUser(formData)

        if (result.success) {
            toast.success("Cuenta creada correctamente. Inicia sesion para continuar.", { duration: 4000 })
            onSuccess?.()
            return
        }

        toast.error(result.error || "No se pudo crear la cuenta. Intenta de nuevo.", { duration: 4000 })
    }

    const labelClass = "mb-[0.4rem] block text-[0.85rem] font-medium text-foreground"
    const inputClass = (hasError) => clsx(
        "w-full box-border rounded-[10px] border bg-surface-light !px-[0.75rem] !py-[0.7rem] text-[0.9rem] text-foreground outline-none",
        "transition-[border-color,box-shadow] duration-200",
        "focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]",
        hasError ? "border-error" : "border-border"
    )
    const errorClass = "mt-[0.3rem] text-xs text-error"

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-[1.75rem]">
            <div className="grid grid-cols-1 gap-[1.35rem] md:grid-cols-2">
                <div>
                    <label className={labelClass}>Nombre</label>
                    <input
                        type="text"
                        placeholder="Tu nombre"
                        className={inputClass(errors.name)}
                        {...register("name", { required: "El nombre es obligatorio" })}
                    />
                    {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>

                <div>
                    <label className={labelClass}>Apellido</label>
                    <input
                        type="text"
                        placeholder="Tu apellido"
                        className={inputClass(errors.surname)}
                        {...register("surname", { required: "El apellido es obligatorio" })}
                    />
                    {errors.surname && <p className={errorClass}>{errors.surname.message}</p>}
                </div>

                <div>
                    <label className={labelClass}>Usuario</label>
                    <input
                        type="text"
                        placeholder="usuario"
                        className={inputClass(errors.username)}
                        {...register("username", {
                            required: "El usuario es obligatorio",
                            minLength: {
                                value: 3,
                                message: "Debe tener al menos 3 caracteres",
                            },
                        })}
                    />
                    {errors.username && <p className={errorClass}>{errors.username.message}</p>}
                </div>

                <div>
                    <label className={labelClass}>Telefono</label>
                    <input
                        type="tel"
                        placeholder="12345678"
                        className={inputClass(errors.phone)}
                        {...register("phone", {
                            required: "El telefono es obligatorio",
                            pattern: {
                                value: /^[0-9]{8}$/,
                                message: "Debe ser un numero de 8 digitos",
                            },
                        })}
                    />
                    {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
                </div>
            </div>

            <div>
                <label className={labelClass}>Email</label>
                <input
                    type="email"
                    placeholder="tu@email.com"
                    className={inputClass(errors.email)}
                    {...register("email", {
                        required: "El email es obligatorio",
                        pattern: {
                            value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                            message: "Formato de email invalido",
                        },
                    })}
                />
                {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-[1.35rem] md:grid-cols-2">
                <div>
                    <label className={labelClass}>Contrasena</label>
                    <input
                        type="password"
                        placeholder="********"
                        className={inputClass(errors.password)}
                        {...register("password", {
                            required: "La contrasena es obligatoria",
                            minLength: {
                                value: 8,
                                message: "Debe tener al menos 8 caracteres",
                            },
                        })}
                    />
                    {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                </div>

                <div>
                    <label className={labelClass}>Confirmar contrasena</label>
                    <input
                        type="password"
                        placeholder="********"
                        className={inputClass(errors.confirmPassword)}
                        {...register("confirmPassword", {
                            required: "Debes confirmar tu contrasena",
                            validate: {
                                matchesPassword: (value) =>
                                    value === getValues("password") ||
                                    "Las contrasenas no coinciden",
                            },
                        })}
                    />
                    {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={clsx(
                    "mt-[0.55rem] flex w-full items-center justify-center gap-[0.5rem] rounded-[10px] border-0 !p-[0.8rem] text-[0.95rem] font-semibold tracking-[0.02em]",
                    "transition-[opacity,box-shadow] duration-200",
                    loading
                        ? "cursor-not-allowed bg-primary/30 text-foreground shadow-none"
                        : "cursor-pointer bg-gradient-to-r from-primary to-accent text-background shadow-[0_4px_24px_rgba(0,217,255,0.25)]"
                )}
            >
                {loading ? (
                    <>
                        <Spinner size="sm" className="text-foreground" />
                        Registrando...
                    </>
                ) : (
                    <>
                        Crear cuenta
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </button>

            <p className="-mt-[0.15rem] text-center text-[0.85rem] text-muted-foreground">
                Ya tienes cuenta?{" "}
                <button
                    type="button"
                    onClick={onBack}
                    className="cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] font-medium text-primary"
                >
                    Iniciar Sesion
                </button>
            </p>
        </form>
    )
}
