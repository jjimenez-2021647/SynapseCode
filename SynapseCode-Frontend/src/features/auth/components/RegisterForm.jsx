import { useForm } from "react-hook-form"
import { clsx } from "clsx"
import toast from "react-hot-toast"
import { useRef, useState } from "react"
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
    const fileInputRef = useRef(null)
    const [profileImage, setProfileImage] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Solo se permiten imágenes (JPEG, JPG, PNG, WebP)", { duration: 3000 })
            return
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error("La imagen no debe exceder 10MB", { duration: 3000 })
            return
        }

        setProfileImage(file)

        // Crear preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = (e) => {
        e.preventDefault()
        setProfileImage(null)
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const submit = async (values) => {
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("surname", values.surname)
        formData.append("username", values.username)
        formData.append("email", values.email)
        formData.append("password", values.password)
        formData.append("phone", values.phone)

        // Agregar imagen si fue seleccionada
        if (profileImage) {
            formData.append("profilePicture", profileImage)
        }

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
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-[0.75rem]">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                />
                
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className={clsx(
                        "relative w-[120px] h-[120px] rounded-full border-2 border-dashed transition-all duration-200 flex items-center justify-center overflow-hidden flex-shrink-0",
                        previewUrl 
                            ? "border-primary bg-surface-light" 
                            : "border-border hover:border-primary hover:bg-surface-light",
                        loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    )}
                >
                    {previewUrl ? (
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-[0.3rem] text-muted-foreground">
                            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[0.7rem] font-medium">Agregar foto</span>
                        </div>
                    )}
                </button>

                {previewUrl && (
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={loading}
                        className="text-xs text-error hover:text-error/80 transition-colors duration-200 font-medium"
                    >
                        Remover foto
                    </button>
                )}
                <p className="text-xs text-muted-foreground text-center max-w-[140px]">
                    JPG, PNG o WebP (máx. 10MB)
                </p>
            </div>

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
