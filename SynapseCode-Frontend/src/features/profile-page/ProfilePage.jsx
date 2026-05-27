import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Activity,
    Building2,
    Camera,
    Check,
    CheckCircle2,
    CreditCard,
    Crown,
    GraduationCap,
    ImagePlus,
    KeyRound,
    Lock,
    Mail,
    Orbit,
    Phone,
    RotateCcw,
    Save,
    ScanLine,
    Shield,
    Sparkles,
    Upload,
    User,
    X,
} from "lucide-react"
import { Navbar } from "../../shared/components/layout/Navbar"
import Button from "../../shared/components/ui/Button"
import Modal from "../../shared/components/ui/Modal"
import Spinner from "../../shared/components/ui/Spinner"
import { ParticleField } from "../auth/components/landing/ParticleField"
import { useAuthStore } from "../auth/store/authStore"
import { selectPlan } from "../../shared/api"
import { getCurrentSubscription } from "../../shared/api/subscriptions"
import { showError, showSuccess } from "../../shared/utils/toast"
import { cn } from "../main-page/mainPageClasses"
import { tiltHandlers } from "../main-page/utils/tiltHandlers"
import "../../styles/main-page.css"

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.82
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const NAME_PATTERN = /^[\p{L}\s]+$/u
const PHONE_PATTERN = /^\d{8}$/
const PROFILE_PARTICLE_COLORS = ["#b985ff", "#00d9ff99", "#d8b4fe88", "#7dd3fc66"]

const inputClass =
    "min-h-11 w-full rounded-lg border border-border-light bg-slate-950/70 px-4 py-3 text-white outline-none transition-all placeholder:text-muted-foreground focus:border-violet-300/70 focus:ring-2 focus:ring-violet-300/20 disabled:cursor-not-allowed disabled:opacity-70"

const planCards = [
    {
        name: "FREE",
        title: "Free",
        price: "$0",
        icon: Sparkles,
        description: "Base colaborativa para empezar sin friccion.",
        features: ["3 salas activas", "5 usuarios por sala", "Ejecucion basica"],
    },
    {
        name: "PRO",
        title: "Pro",
        price: "$20",
        icon: Crown,
        description: "Mas capacidad, IA y flujo prioritario.",
        features: ["Salas ilimitadas", "20 usuarios por sala", "IA ampliada"],
    },
    {
        name: "ORG",
        title: "ORG",
        price: "$50 +/-",
        icon: Building2,
        description: "Acceso institucional para profesores y estudiantes.",
        features: ["Panel administrativo", "Analitica por alumno", "Carnets ORG"],
    },
]

const roleLabels = {
    USER_ROLE: "Usuario",
    ADMIN_ROLE: "Administrador",
    ORG_ROLE: "Organizacion",
}

const planTone = {
    FREE: "border-primary/30 bg-primary/10 text-cyan-200",
    PRO: "border-accent/40 bg-accent/10 text-fuchsia-200",
    ORG: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
}

const getErrorMessage = (err, fallback) =>
    err.response?.data?.message || err.response?.data?.error || err.message || fallback

const formatBytes = (bytes) => {
    if (!bytes) return "0 MB"
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const normalizePlan = (planName) => String(planName || "FREE").toUpperCase()

const getProfileName = (user) =>
    [user?.name, user?.surname].filter(Boolean).join(" ").trim() || user?.username || "Usuario"

const loadImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error("No pudimos leer la imagen seleccionada."))
        image.src = url
    })

const prepareProfileImage = async (file) => {
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Selecciona una imagen JPEG, PNG o WEBP.")
    }

    const objectUrl = URL.createObjectURL(file)

    try {
        const image = await loadImage(objectUrl)
        const largestSide = Math.max(image.width, image.height)
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide)

        if (scale === 1 && file.size <= MAX_UPLOAD_SIZE) {
            return file
        }

        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))

        const context = canvas.getContext("2d")
        if (!context) {
            throw new Error("No pudimos preparar la imagen.")
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const targetType =
            file.type === "image/png" && file.size > MAX_UPLOAD_SIZE ? "image/webp" : file.type
        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, targetType, IMAGE_QUALITY)
        )

        if (!blob) {
            throw new Error("No pudimos comprimir la imagen.")
        }

        const extension = targetType === "image/jpeg" ? "jpg" : targetType.split("/")[1]
        const fileName = file.name.includes(".")
            ? file.name.replace(/\.[^.]+$/, `.${extension}`)
            : `${file.name}.${extension}`
        const preparedFile = new File([blob], fileName, {
            type: targetType,
            lastModified: Date.now(),
        })

        if (preparedFile.size > MAX_UPLOAD_SIZE) {
            throw new Error("La imagen sigue superando 10MB. Prueba con una imagen mas ligera.")
        }

        if (preparedFile.size > file.size && file.size <= MAX_UPLOAD_SIZE) {
            return file
        }

        return preparedFile
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16)
    return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "")
}

const formatExpiry = (value) => {
    let digits = value.replace(/\D/g, "").slice(0, 4)

    if (digits.length >= 2) {
        let month = digits.slice(0, 2)
        const monthNumber = Number.parseInt(month, 10)

        if (monthNumber > 12) month = "12"
        if (monthNumber === 0 && digits.length === 2) month = "0"

        digits = digits.length >= 3 ? `${month}/${digits.slice(2, 4)}` : month
    }

    return digits
}

const isCardExpired = (expiryString) => {
    if (!expiryString || expiryString.length !== 5) return false

    const [month, year] = expiryString.split("/")
    const monthNumber = Number.parseInt(month, 10)
    const yearNumber = Number.parseInt(year, 10)

    if (monthNumber < 1 || monthNumber > 12) return true

    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1

    return yearNumber < currentYear || (yearNumber === currentYear && monthNumber < currentMonth)
}

const spotlightHandlers = {
    onPointerMove: (event) => {
        const card = event.currentTarget
        const rect = card.getBoundingClientRect()
        card.style.setProperty("--card-x", `${event.clientX - rect.left}px`)
        card.style.setProperty("--card-y", `${event.clientY - rect.top}px`)
    },
}

function Panel({ children, className = "" }) {
    return (
        <section
            className={cn(
                "profile-reveal synapse-surface spotlight-card interactive-card relative rounded-2xl p-5 sm:p-6",
                className
            )}
            {...spotlightHandlers}
        >
            {children}
        </section>
    )
}

function SectionTitle({ icon: Icon, eyebrow, title, action }) {
    return (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-violet-300/30 bg-violet-300/10 text-violet-100 shadow-[0_0_24px_rgba(185,133,255,0.13)]">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-primary">
                        {eyebrow}
                    </p>
                    <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{title}</h2>
                </div>
            </div>
            {action}
        </div>
    )
}

function SettingsSectionHeader({ icon: Icon, eyebrow, title, action }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-violet-300/25 bg-violet-300/10 text-violet-100">
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-primary">
                        {eyebrow}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-white sm:text-xl">{title}</h3>
                </div>
            </div>
            {action}
        </div>
    )
}

function InfoTile({ icon: Icon, label, value, chip }) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition-all hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-violet-300/[0.045]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950/70 text-primary shadow-[0_0_18px_rgba(0,217,255,0.08)]">
                    <Icon className="h-4 w-4" />
                </span>
                {chip && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                        {chip}
                    </span>
                )}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-1 min-w-0 break-words text-base font-bold text-white">{value || "No registrado"}</p>
        </div>
    )
}

function Field({ label, error, children }) {
    return (
        <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">{label}</span>
            {children}
            {error && <span className="text-sm font-semibold text-error">{error}</span>}
        </label>
    )
}

function PlanBadge({ planName }) {
    const normalizedPlan = normalizePlan(planName)

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em]",
                planTone[normalizedPlan] || planTone.FREE
            )}
        >
            <Sparkles className="h-3.5 w-3.5" />
            {normalizedPlan}
        </span>
    )
}

function MetricPill({ icon: Icon, label, value }) {
    return (
        <div className="profile-metric-pill">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-violet-300/25 bg-violet-300/10 text-violet-100">
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
                    {label}
                </span>
                <span className="block truncate text-sm font-black text-white">{value}</span>
            </span>
        </div>
    )
}

function SmoothCursorGlow() {
    const glowRef = useRef(null)

    useEffect(() => {
        const glow = glowRef.current
        if (!glow) return undefined

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reducedMotion) {
            glow.style.opacity = "0"
            return undefined
        }

        const target = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        }
        const current = { ...target }
        let frameId

        const handlePointerMove = (event) => {
            target.x = event.clientX
            target.y = event.clientY
        }

        const render = () => {
            current.x += (target.x - current.x) * 0.18
            current.y += (target.y - current.y) * 0.18
            glow.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`
            frameId = window.requestAnimationFrame(render)
        }

        window.addEventListener("pointermove", handlePointerMove, { passive: true })
        render()

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.cancelAnimationFrame(frameId)
        }
    }, [])

    return <div ref={glowRef} className="profile-cursor-glow" aria-hidden="true" />
}

export const ProfilePage = () => {
    const user = useAuthStore((state) => state.user)
    const loadProfile = useAuthStore((state) => state.loadProfile)
    const updateProfile = useAuthStore((state) => state.updateProfile)
    const updateProfileImage = useAuthStore((state) => state.updateProfileImage)
    const resetProfileImage = useAuthStore((state) => state.resetProfileImage)
    const changePassword = useAuthStore((state) => state.changePassword)
    const requestPhoneChange = useAuthStore((state) => state.requestPhoneChange)
    const confirmPhoneChange = useAuthStore((state) => state.confirmPhoneChange)

    const fileInputRef = useRef(null)
    const previewUrlRef = useRef(null)

    const [profileLoading, setProfileLoading] = useState(true)
    const [subscription, setSubscription] = useState(null)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [profileBusy, setProfileBusy] = useState(false)
    const [profileForm, setProfileForm] = useState({ name: "", surname: "" })
    const [profileErrors, setProfileErrors] = useState({})

    const [selectedImage, setSelectedImage] = useState(null)
    const [selectedImagePreview, setSelectedImagePreview] = useState("")
    const [imageInfo, setImageInfo] = useState("")
    const [imageBusy, setImageBusy] = useState(false)

    const [phoneBusy, setPhoneBusy] = useState(false)
    const [phoneStep, setPhoneStep] = useState("request")
    const [phoneForm, setPhoneForm] = useState({ newPhone: "", token: "" })

    const [passwordBusy, setPasswordBusy] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const [selectedPlan, setSelectedPlan] = useState(null)
    const [planBusy, setPlanBusy] = useState(null)
    const [paymentData, setPaymentData] = useState({
        name: "",
        email: "",
        cardNumber: "",
        expiry: "",
        cvc: "",
    })
    const [orgData, setOrgData] = useState({
        orgUserType: "PROFESSOR",
        institutionName: "",
        numStudents: "",
        carnetNumber: "",
    })

    const fullName = useMemo(() => getProfileName(user), [user])
    const currentPlan = normalizePlan(user?.planType || subscription?.planName || subscription?.planId?.name)
    const accountStatus = user?.status === false ? "Inactiva" : "Activa"
    const displayImage = selectedImagePreview || user?.profilePicture
    const hasCustomProfileImage = Boolean(user?.profilePicture) && user?.profilePictureIsDefault === false
    const canOfferOrg = user?.role === "USER_ROLE"

    const refreshSubscription = useCallback(async () => {
        try {
            const response = await getCurrentSubscription()
            setSubscription(response?.data?.data || null)
        } catch {
            setSubscription(null)
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            setProfileLoading(true)
            const result = await loadProfile()

            if (isMounted && !result.success) {
                showError(result.error)
            }

            if (isMounted) {
                await refreshSubscription()
                setProfileLoading(false)
            }
        }

        load()

        return () => {
            isMounted = false
        }
    }, [loadProfile, refreshSubscription])

    useEffect(() => {
        setProfileForm({
            name: user?.name || "",
            surname: user?.surname || "",
        })
        setPhoneForm((current) => ({
            ...current,
            newPhone: current.newPhone || user?.phone || "",
        }))
    }, [user?.name, user?.surname, user?.phone])

    useEffect(() => {
        setPaymentData((current) => ({
            ...current,
            name: current.name || fullName || user?.username || "",
            email: current.email || user?.email || "",
        }))
    }, [fullName, user?.email, user?.username])

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current)
            }
        }
    }, [])

    const clearSelectedImage = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = null
        }
        setSelectedImage(null)
        setSelectedImagePreview("")
        setImageInfo("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const validateProfileForm = () => {
        const nextErrors = {}
        const name = profileForm.name.trim()
        const surname = profileForm.surname.trim()

        if (!name) nextErrors.name = "El nombre es requerido."
        if (!surname) nextErrors.surname = "El apellido es requerido."
        if (name && name.length > 25) nextErrors.name = "Maximo 25 caracteres."
        if (surname && surname.length > 25) nextErrors.surname = "Maximo 25 caracteres."
        if (name && !NAME_PATTERN.test(name)) nextErrors.name = "Usa solo letras y espacios."
        if (surname && !NAME_PATTERN.test(surname)) nextErrors.surname = "Usa solo letras y espacios."

        setProfileErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleProfileSubmit = async (event) => {
        event.preventDefault()

        if (!validateProfileForm()) return

        setProfileBusy(true)
        const result = await updateProfile({
            name: profileForm.name.trim(),
            surname: profileForm.surname.trim(),
        })
        setProfileBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        showSuccess(result.message)
        setIsEditingProfile(false)
    }

    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        setImageBusy(true)
        try {
            const preparedFile = await prepareProfileImage(file)

            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current)
            }

            const previewUrl = URL.createObjectURL(preparedFile)
            previewUrlRef.current = previewUrl
            setSelectedImage(preparedFile)
            setSelectedImagePreview(previewUrl)
            setImageInfo(
                preparedFile.size < file.size
                    ? `Lista para subir: ${formatBytes(file.size)} -> ${formatBytes(preparedFile.size)}`
                    : `Lista para subir: ${formatBytes(preparedFile.size)}`
            )
        } catch (err) {
            showError(err.message || "No pudimos preparar la imagen.")
            clearSelectedImage()
        } finally {
            setImageBusy(false)
        }
    }

    const handleImageUpload = async () => {
        if (!selectedImage) return

        setImageBusy(true)
        const formData = new FormData()
        formData.append("profilePicture", selectedImage)
        const result = await updateProfileImage(formData)
        setImageBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        clearSelectedImage()
        showSuccess(result.message)
    }

    const handleResetProfileImage = async () => {
        setImageBusy(true)
        clearSelectedImage()
        const result = await resetProfileImage()
        setImageBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        showSuccess(result.message)
    }

    const handlePhoneRequest = async (event) => {
        event.preventDefault()

        const newPhone = phoneForm.newPhone.trim()
        if (!PHONE_PATTERN.test(newPhone)) {
            showError("El telefono debe tener exactamente 8 digitos.")
            return
        }

        setPhoneBusy(true)
        const result = await requestPhoneChange({ newPhone })
        setPhoneBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        showSuccess(result.message)
        setPhoneStep("confirm")
    }

    const handlePhoneConfirm = async (event) => {
        event.preventDefault()

        const token = phoneForm.token.trim()
        if (!token) {
            showError("Ingresa el token enviado a tu correo.")
            return
        }

        setPhoneBusy(true)
        const result = await confirmPhoneChange({ token })
        setPhoneBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        showSuccess(result.message)
        setPhoneStep("request")
        setPhoneForm({ newPhone: result.data?.phone || "", token: "" })
    }

    const handlePasswordSubmit = async (event) => {
        event.preventDefault()

        if (!passwordForm.currentPassword) {
            showError("Ingresa tu contrasena actual.")
            return
        }

        if (passwordForm.newPassword.length < 8) {
            showError("La nueva contrasena debe tener al menos 8 caracteres.")
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError("La confirmacion no coincide con la nueva contrasena.")
            return
        }

        setPasswordBusy(true)
        const result = await changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        })
        setPasswordBusy(false)

        if (!result.success) {
            showError(result.error)
            return
        }

        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        showSuccess(result.message)
    }

    const getPlanProfile = async () => {
        if (user?.email && fullName) {
            return { email: user.email, name: fullName }
        }

        const result = await loadProfile()
        if (!result.success) {
            throw new Error(result.error)
        }

        const profileName = getProfileName(result.data)
        if (!result.data?.email || !profileName) {
            throw new Error("No pudimos completar tu nombre y correo para cambiar el plan.")
        }

        return { email: result.data.email, name: profileName }
    }

    const getOrgAmount = () => {
        const students = Number(orgData.numStudents)
        return students > 0 ? students * 2 : null
    }

    const activatePlan = async (planName, customerData = null) => {
        setPlanBusy(planName)
        try {
            const profile = customerData || (await getPlanProfile())
            const payload = {
                planName,
                email: profile.email,
                name: profile.name,
                ...(customerData?.orgUserType && { orgUserType: customerData.orgUserType }),
                ...(customerData?.carnetNumber && { carnetNumber: customerData.carnetNumber }),
                ...(customerData?.institutionName && { institutionName: customerData.institutionName }),
                ...(customerData?.maxParticipants && { maxParticipants: customerData.maxParticipants }),
                amountPaid:
                    planName === "ORG" && customerData?.orgUserType !== "STUDENT"
                        ? getOrgAmount()
                        : planName === "PRO"
                        ? 20
                        : undefined,
            }

            const { data } = await selectPlan(payload)

            if (!data?.success) {
                throw new Error(data?.message || "No se pudo seleccionar el plan.")
            }

            await loadProfile()
            await refreshSubscription()
            setSelectedPlan(null)
            setPaymentData((current) => ({ ...current, cardNumber: "", expiry: "", cvc: "" }))
            showSuccess(
                planName === "FREE"
                    ? "Plan FREE activado"
                    : planName === "PRO"
                    ? "Pago verificado. Plan PRO activado"
                    : customerData?.orgUserType === "STUDENT"
                    ? "Carnet validado. Plan ORG estudiante activado"
                    : "Pago verificado. Plan ORG activado"
            )
        } catch (err) {
            showError(getErrorMessage(err, "Error al procesar el plan"))
        } finally {
            setPlanBusy(null)
        }
    }

    const openPlanModal = (planName) => {
        setSelectedPlan(planName)
        setPaymentData((current) => ({
            ...current,
            name: current.name || fullName || user?.username || "",
            email: current.email || user?.email || "",
            cardNumber: "",
            expiry: "",
            cvc: "",
        }))
    }

    const handlePlanAction = async (planName) => {
        if (planName === "FREE") {
            await activatePlan("FREE")
            return
        }

        if (planName === "PRO") {
            openPlanModal("PRO")
            return
        }

        if (planName === "ORG" && canOfferOrg) {
            openPlanModal("ORG")
        }
    }

    const handlePaymentChange = (event) => {
        const { name, value } = event.target
        const formattedValue =
            name === "cardNumber" ? formatCardNumber(value) : name === "expiry" ? formatExpiry(value) : value

        setPaymentData((current) => ({ ...current, [name]: formattedValue }))
    }

    const handleOrgChange = (event) => {
        const { name, value } = event.target
        setOrgData((current) => ({ ...current, [name]: value }))
    }

    const validatePaymentFields = () => {
        if (!paymentData.name.trim() || !paymentData.email.trim()) {
            showError("Completa nombre y correo para continuar.")
            return false
        }

        if (!/^\S+@\S+\.\S+$/.test(paymentData.email.trim())) {
            showError("Ingresa un correo valido.")
            return false
        }

        if (
            paymentData.cardNumber.replace(/\D/g, "").length < 12 ||
            paymentData.expiry.trim().length !== 5 ||
            paymentData.cvc.trim().length < 3
        ) {
            showError("Completa los datos de pago.")
            return false
        }

        if (isCardExpired(paymentData.expiry)) {
            showError("La tarjeta ha vencido. Usa una tarjeta valida.")
            return false
        }

        return true
    }

    const handlePlanSubmit = async (event) => {
        event.preventDefault()

        if (selectedPlan === "PRO") {
            if (!validatePaymentFields()) return

            await activatePlan("PRO", {
                name: paymentData.name.trim(),
                email: paymentData.email.trim(),
            })
            return
        }

        if (selectedPlan === "ORG") {
            if (orgData.orgUserType === "STUDENT") {
                if (!orgData.carnetNumber.trim()) {
                    showError("Ingresa tu numero de carnet.")
                    return
                }

                await activatePlan("ORG", {
                    name: paymentData.name.trim() || fullName || user?.username,
                    email: paymentData.email.trim() || user?.email,
                    orgUserType: "STUDENT",
                    carnetNumber: orgData.carnetNumber.trim().toUpperCase(),
                })
                return
            }

            if (!orgData.institutionName.trim() || !Number(orgData.numStudents) || Number(orgData.numStudents) < 1) {
                showError("Completa institucion y numero de estudiantes.")
                return
            }

            if (!validatePaymentFields()) return

            await activatePlan("ORG", {
                name: paymentData.name.trim(),
                email: paymentData.email.trim(),
                orgUserType: "PROFESSOR",
                institutionName: orgData.institutionName.trim(),
                maxParticipants: Number.parseInt(orgData.numStudents, 10),
            })
        }
    }

    const visiblePlans = planCards.filter((plan) => plan.name !== "ORG" || canOfferOrg)

    return (
        <div className="profile-page synapse-page flex min-h-screen flex-col overflow-x-hidden bg-[linear-gradient(135deg,#050812_0%,#0a0e17_48%,#110b22_100%)]">
            <ParticleField
                particleCount={42}
                colors={PROFILE_PARTICLE_COLORS}
                connectionDistance={112}
                trailAlpha={0.08}
                opacity={0.72}
            />
            <SmoothCursorGlow />

            <div className="profile-grid-overlay" aria-hidden="true" />

            <Navbar />

            <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
                <header className="profile-reveal mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.22em] text-violet-200">
                            <ScanLine className="h-4 w-4 text-primary" />
                            Centro de identidad
                        </p>
                        <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
                            Perfil SynapseCode
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                            Identidad operativa de {fullName}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <PlanBadge planName={currentPlan} />
                        <span
                            className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em]",
                                user?.status === false
                                    ? "border-error/40 bg-error/10 text-red-200"
                                    : "border-success/40 bg-success/10 text-emerald-200"
                            )}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {accountStatus}
                        </span>
                    </div>
                </header>

                {profileLoading ? (
                    <div className="grid min-h-[28rem] place-items-center">
                        <div className="grid justify-items-center gap-4 text-center">
                            <Spinner size="lg" />
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
                                Cargando perfil
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        <Panel className="profile-command-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ALLOWED_IMAGE_TYPES.join(",")}
                                className="hidden"
                                onChange={handleImageSelect}
                            />

                            <div className="grid gap-7 lg:grid-cols-[auto_minmax(0,1fr)_minmax(13rem,auto)] lg:items-center">
                                <div className="grid justify-items-center gap-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="profile-avatar-button group"
                                        aria-label="Cambiar foto de perfil"
                                    >
                                        <span className="profile-avatar-ring" aria-hidden="true" />
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt={fullName}
                                                className="relative z-10 h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="relative z-10 grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-primary/30 via-violet-300/25 to-accent/25 text-6xl font-black text-white">
                                                {(user?.name || user?.username || "U")[0]?.toUpperCase()}
                                            </span>
                                        )}
                                        <span className="absolute inset-0 z-20 grid place-items-center rounded-full bg-slate-950/58 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                                            <span className="grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-primary/15 text-primary shadow-[0_0_24px_rgba(0,217,255,0.22)]">
                                                <Camera className="h-6 w-6" />
                                            </span>
                                        </span>
                                    </button>
                                    {imageInfo && (
                                        <p className="max-w-56 text-sm font-semibold leading-5 text-cyan-100">
                                            {imageInfo}
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 text-center lg:text-left">
                                    <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary">
                                        Command center
                                    </p>
                                    <h2 className="mt-2 break-words text-3xl font-black text-white sm:text-4xl">
                                        {fullName}
                                    </h2>
                                    <p className="mt-2 break-all text-sm font-bold text-violet-100">
                                        @{user?.username}
                                    </p>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        <MetricPill icon={Orbit} label="Plan" value={currentPlan} />
                                        <MetricPill icon={Activity} label="Estado" value={accountStatus} />
                                        <MetricPill
                                            icon={Shield}
                                            label="Rol"
                                            value={roleLabels[user?.role] || user?.role || "Usuario"}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                    {selectedImage ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                loading={imageBusy}
                                                onClick={handleImageUpload}
                                                className="w-full"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Actualizar
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={imageBusy}
                                                onClick={clearSelectedImage}
                                                className="w-full"
                                            >
                                                <X className="h-4 w-4" />
                                                Cancelar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={imageBusy}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full"
                                            >
                                                <ImagePlus className="h-4 w-4" />
                                                Cambiar foto
                                            </Button>
                                            {hasCustomProfileImage && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    loading={imageBusy}
                                                    onClick={handleResetProfileImage}
                                                    className="w-full border border-violet-300/25 bg-violet-300/5 text-violet-100 hover:bg-violet-300/10"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    Restablecer foto
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </Panel>

                        <Panel>
                            <SectionTitle icon={User} eyebrow="Datos" title="Informacion personal" />
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <InfoTile icon={User} label="Nombre" value={user?.name} />
                                <InfoTile icon={User} label="Apellido" value={user?.surname} />
                                <InfoTile icon={Shield} label="Usuario" value={`@${user?.username || ""}`} chip="Solo lectura" />
                                <InfoTile icon={Mail} label="Correo" value={user?.email} chip="Solo lectura" />
                                <InfoTile icon={Phone} label="Telefono" value={user?.phone} />
                                <InfoTile icon={Crown} label="Rol" value={roleLabels[user?.role] || user?.role} />
                            </div>
                        </Panel>

                        <Panel>
                            <SectionTitle icon={Shield} eyebrow="Cuenta" title="Ajustes de cuenta" />

                            <div className="grid gap-7">
                                <div className="grid gap-7 xl:grid-cols-2 xl:gap-8">
                                    <div className="grid content-start gap-4 xl:border-r xl:border-white/10 xl:pr-8">
                                        <SettingsSectionHeader
                                            icon={Save}
                                            eyebrow="Editar"
                                            title="Nombre y apellido"
                                            action={
                                                !isEditingProfile ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsEditingProfile(true)}
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                ) : null
                                            }
                                        />

                                        <form onSubmit={handleProfileSubmit} className="grid gap-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field label="Nombre" error={profileErrors.name}>
                                                    <input
                                                        value={profileForm.name}
                                                        maxLength={25}
                                                        disabled={!isEditingProfile || profileBusy}
                                                        onChange={(event) =>
                                                            setProfileForm((current) => ({
                                                                ...current,
                                                                name: event.target.value,
                                                            }))
                                                        }
                                                        className={inputClass}
                                                        placeholder="Tu nombre"
                                                    />
                                                </Field>
                                                <Field label="Apellido" error={profileErrors.surname}>
                                                    <input
                                                        value={profileForm.surname}
                                                        maxLength={25}
                                                        disabled={!isEditingProfile || profileBusy}
                                                        onChange={(event) =>
                                                            setProfileForm((current) => ({
                                                                ...current,
                                                                surname: event.target.value,
                                                            }))
                                                        }
                                                        className={inputClass}
                                                        placeholder="Tu apellido"
                                                    />
                                                </Field>
                                            </div>

                                            {isEditingProfile && (
                                                <div className="flex flex-wrap gap-3">
                                                    <Button type="submit" loading={profileBusy}>
                                                        <Check className="h-4 w-4" />
                                                        Guardar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        disabled={profileBusy}
                                                        onClick={() => {
                                                            setProfileForm({
                                                                name: user?.name || "",
                                                                surname: user?.surname || "",
                                                            })
                                                            setProfileErrors({})
                                                            setIsEditingProfile(false)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            )}
                                        </form>
                                    </div>

                                    <div className="grid content-start gap-4">
                                        <SettingsSectionHeader
                                            icon={Phone}
                                            eyebrow="Verificacion"
                                            title="Telefono por correo"
                                        />
                                        <form
                                            onSubmit={phoneStep === "confirm" ? handlePhoneConfirm : handlePhoneRequest}
                                            className="grid gap-4"
                                        >
                                            <div
                                                className={
                                                    phoneStep === "confirm"
                                                        ? "grid gap-4 sm:grid-cols-2"
                                                        : "grid gap-4"
                                                }
                                            >
                                                <Field
                                                    label={
                                                        phoneStep === "confirm"
                                                            ? "Telefono solicitado"
                                                            : "Nuevo telefono"
                                                    }
                                                >
                                                    <input
                                                        value={phoneForm.newPhone}
                                                        inputMode="numeric"
                                                        maxLength={8}
                                                        disabled={phoneBusy || phoneStep === "confirm"}
                                                        onChange={(event) =>
                                                            setPhoneForm((current) => ({
                                                                ...current,
                                                                newPhone: event.target.value
                                                                    .replace(/\D/g, "")
                                                                    .slice(0, 8),
                                                            }))
                                                        }
                                                        className={inputClass}
                                                        placeholder="12345678"
                                                    />
                                                </Field>

                                                {phoneStep === "confirm" && (
                                                    <Field label="Token de correo">
                                                        <input
                                                            value={phoneForm.token}
                                                            disabled={phoneBusy}
                                                            onChange={(event) =>
                                                                setPhoneForm((current) => ({
                                                                    ...current,
                                                                    token: event.target.value,
                                                                }))
                                                            }
                                                            className={inputClass}
                                                            placeholder="Token recibido"
                                                        />
                                                    </Field>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <Button type="submit" loading={phoneBusy}>
                                                    {phoneStep === "confirm" ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Mail className="h-4 w-4" />
                                                    )}
                                                    {phoneStep === "confirm" ? "Confirmar telefono" : "Enviar token"}
                                                </Button>
                                                {phoneStep === "confirm" && (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        disabled={phoneBusy}
                                                        onClick={() => {
                                                            setPhoneStep("request")
                                                            setPhoneForm({ newPhone: user?.phone || "", token: "" })
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div className="grid gap-4 border-t border-white/10 pt-6">
                                    <SettingsSectionHeader
                                        icon={KeyRound}
                                        eyebrow="Seguridad"
                                        title="Cambiar contrasena"
                                    />
                                    <form onSubmit={handlePasswordSubmit} className="grid gap-4">
                                        <div className="grid gap-4 lg:grid-cols-3">
                                            <Field label="Contrasena actual">
                                                <input
                                                    type="password"
                                                    value={passwordForm.currentPassword}
                                                    disabled={passwordBusy}
                                                    onChange={(event) =>
                                                        setPasswordForm((current) => ({
                                                            ...current,
                                                            currentPassword: event.target.value,
                                                        }))
                                                    }
                                                    className={inputClass}
                                                    placeholder="Actual"
                                                />
                                            </Field>
                                            <Field label="Nueva contrasena">
                                                <input
                                                    type="password"
                                                    value={passwordForm.newPassword}
                                                    disabled={passwordBusy}
                                                    onChange={(event) =>
                                                        setPasswordForm((current) => ({
                                                            ...current,
                                                            newPassword: event.target.value,
                                                        }))
                                                    }
                                                    className={inputClass}
                                                    placeholder="Minimo 8 caracteres"
                                                />
                                            </Field>
                                            <Field label="Confirmar contrasena">
                                                <input
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    disabled={passwordBusy}
                                                    onChange={(event) =>
                                                        setPasswordForm((current) => ({
                                                            ...current,
                                                            confirmPassword: event.target.value,
                                                        }))
                                                    }
                                                    className={inputClass}
                                                    placeholder="Repite la nueva"
                                                />
                                            </Field>
                                        </div>
                                        <Button type="submit" loading={passwordBusy} className="w-full sm:w-fit">
                                            <Lock className="h-4 w-4" />
                                            Actualizar contrasena
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </Panel>

                        <Panel>
                            <SectionTitle
                                icon={CreditCard}
                                eyebrow="Suscripcion"
                                title="Plan actual y cambios"
                                action={<PlanBadge planName={currentPlan} />}
                            />

                            <div className="grid gap-4 lg:grid-cols-3">
                                {visiblePlans.map((plan) => {
                                    const Icon = plan.icon
                                    const isCurrent = currentPlan === plan.name
                                    const isOrgLocked = plan.name === "ORG" && !canOfferOrg
                                    const isCancelPro = plan.name === "FREE" && currentPlan === "PRO"
                                    const isUnavailableFree = plan.name === "FREE" && currentPlan === "ORG"
                                    const isCurrentOrgManaged = currentPlan === "ORG" && !isCurrent

                                    return (
                                        <article
                                            key={plan.name}
                                            className={cn(
                                                "mp-tilt-card mp-pricing-card grid min-h-[22rem] content-start gap-4 rounded-2xl border border-border-light/70 bg-slate-900/68 p-5 backdrop-blur-md",
                                                isCurrent ? "is-popular border-primary/50" : ""
                                            )}
                                            {...tiltHandlers}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="grid h-12 w-12 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                {isCurrent && (
                                                    <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-200">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white">{plan.title}</h3>
                                                <p className="mt-2 text-4xl font-black text-white">{plan.price}</p>
                                                <p className="mt-3 text-sm leading-6 text-muted">{plan.description}</p>
                                            </div>
                                            <ul className="grid gap-2 border-t border-white/10 pt-4">
                                                {plan.features.map((feature) => (
                                                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                                                        <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button
                                                type="button"
                                                variant={isCancelPro ? "danger" : plan.name === "PRO" ? "primary" : "secondary"}
                                                loading={planBusy === plan.name}
                                                disabled={
                                                    isCurrent ||
                                                    isOrgLocked ||
                                                    isUnavailableFree ||
                                                    isCurrentOrgManaged ||
                                                    Boolean(planBusy)
                                                }
                                                onClick={() => handlePlanAction(plan.name)}
                                                className="mt-auto w-full"
                                            >
                                                {isCurrent
                                                    ? "Plan actual"
                                                    : isCancelPro
                                                    ? "Cancelar PRO"
                                                    : isUnavailableFree || isCurrentOrgManaged
                                                    ? "ORG no se cambia aqui"
                                                    : plan.name === "FREE"
                                                    ? "Cambiar a FREE"
                                                    : `Cambiar a ${plan.name}`}
                                            </Button>
                                        </article>
                                    )
                                })}
                            </div>
                        </Panel>
                    </div>
                )}
            </main>

            <Modal
                isOpen={Boolean(selectedPlan)}
                onClose={() => {
                    if (!planBusy) setSelectedPlan(null)
                }}
                title={
                    <>
                        <span className="text-primary">Activar</span> {selectedPlan}
                    </>
                }
            >
                <form onSubmit={handlePlanSubmit} className="grid max-h-[calc(100vh-12rem)] gap-4 overflow-y-auto pr-1 modal-scrollbar">
                    {selectedPlan === "ORG" && (
                        <div className="grid gap-2">
                            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                                Tipo de acceso
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: "PROFESSOR", label: "Profesor", icon: Building2 },
                                    { value: "STUDENT", label: "Estudiante", icon: GraduationCap },
                                ].map((option) => {
                                    const Icon = option.icon
                                    const active = orgData.orgUserType === option.value

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={Boolean(planBusy)}
                                            onClick={() =>
                                                setOrgData((current) => ({ ...current, orgUserType: option.value }))
                                            }
                                            className={cn(
                                                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-all",
                                                active
                                                    ? "border-primary bg-primary/10 text-cyan-200"
                                                    : "border-border-light bg-slate-950/60 text-muted hover:text-white"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {selectedPlan === "ORG" && orgData.orgUserType === "STUDENT" ? (
                        <Field label="Numero de carnet">
                            <input
                                name="carnetNumber"
                                value={orgData.carnetNumber}
                                disabled={Boolean(planBusy)}
                                onChange={handleOrgChange}
                                className={inputClass}
                                placeholder="2021647"
                            />
                        </Field>
                    ) : (
                        <>
                            {selectedPlan === "ORG" && (
                                <>
                                    <Field label="Institucion">
                                        <input
                                            name="institutionName"
                                            value={orgData.institutionName}
                                            disabled={Boolean(planBusy)}
                                            onChange={handleOrgChange}
                                            className={inputClass}
                                            placeholder="Universidad Nacional"
                                        />
                                    </Field>
                                    <Field label="Numero de estudiantes">
                                        <input
                                            name="numStudents"
                                            type="number"
                                            min="1"
                                            value={orgData.numStudents}
                                            disabled={Boolean(planBusy)}
                                            onChange={handleOrgChange}
                                            className={inputClass}
                                            placeholder="100"
                                        />
                                    </Field>
                                    {getOrgAmount() !== null && (
                                        <p className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-cyan-100">
                                            Monto simulado: ${getOrgAmount()}
                                        </p>
                                    )}
                                </>
                            )}

                            <Field label="Nombre">
                                <input
                                    name="name"
                                    value={paymentData.name}
                                    disabled={Boolean(planBusy)}
                                    onChange={handlePaymentChange}
                                    className={inputClass}
                                    placeholder="Nombre completo"
                                />
                            </Field>
                            <Field label="Correo">
                                <input
                                    name="email"
                                    type="email"
                                    value={paymentData.email}
                                    disabled={Boolean(planBusy)}
                                    onChange={handlePaymentChange}
                                    className={inputClass}
                                    placeholder="tu@email.com"
                                />
                            </Field>
                            <Field label="Numero de tarjeta">
                                <input
                                    name="cardNumber"
                                    inputMode="numeric"
                                    value={paymentData.cardNumber}
                                    disabled={Boolean(planBusy)}
                                    onChange={handlePaymentChange}
                                    className={inputClass}
                                    placeholder="4242-4242-4242-4242"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Vencimiento">
                                    <input
                                        name="expiry"
                                        inputMode="numeric"
                                        maxLength={5}
                                        value={paymentData.expiry}
                                        disabled={Boolean(planBusy)}
                                        onChange={handlePaymentChange}
                                        className={inputClass}
                                        placeholder="MM/AA"
                                    />
                                </Field>
                                <Field label="CVC">
                                    <input
                                        name="cvc"
                                        inputMode="numeric"
                                        maxLength={3}
                                        value={paymentData.cvc}
                                        disabled={Boolean(planBusy)}
                                        onChange={handlePaymentChange}
                                        className={inputClass}
                                        placeholder="123"
                                    />
                                </Field>
                            </div>
                        </>
                    )}

                    <Button type="submit" loading={planBusy === selectedPlan} className="mt-2 w-full">
                        <CreditCard className="h-4 w-4" />
                        {selectedPlan === "ORG" && orgData.orgUserType === "STUDENT"
                            ? "Validar carnet y activar"
                            : `Pagar y activar ${selectedPlan}`}
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
