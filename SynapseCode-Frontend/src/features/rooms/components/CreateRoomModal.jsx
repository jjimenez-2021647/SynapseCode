import { useState, useMemo, useEffect } from "react"
import { getCurrentSubscription } from "../../../shared/api/subscriptions"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { createRoom } from "../../../shared/api"
import { useAuthStore } from "../../auth/store/authStore"
import { toast } from "react-hot-toast"
import { Search, Globe, Lock, Users, Zap, Code2, Eye, EyeOff, Plus } from "lucide-react"
import { fetchSupportedLanguages } from "../../../shared/constants/languages"

export const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
    const user = useAuthStore((state) => state.user)
    const [loading, setLoading] = useState(false)
    const [loadingLanguages, setLoadingLanguages] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [allLanguages, setAllLanguages] = useState([])
    const [isMultiLanguage, setIsMultiLanguage] = useState(false)
    const [selectedLangId, setSelectedLangId] = useState(null)
    const [selectedLangIds, setSelectedLangIds] = useState([])
    const [showPassword, setShowPassword] = useState(false)
    
    // Estado para el límite dinámico de usuarios
    const [maxUsers, setMaxUsers] = useState(5)

    // Obtener el límite dinámico al abrir el modal
    useEffect(() => {
        const fetchMaxUsers = async () => {
            const planName = user?.planType || 'FREE';
            if (planName === 'ORG') {
                try {
                    const resp = await getCurrentSubscription();
                    const orgMax = resp?.data?.data?.orgInfo?.maxParticipants;
                    if (typeof orgMax === 'number' && orgMax > 0) {
                        setMaxUsers(orgMax);
                    } else {
                        setMaxUsers(2); // fallback mínimo
                    }
                } catch (e) {
                    setMaxUsers(2);
                }
            } else if (planName === 'PRO') {
                setMaxUsers(20);
            } else {
                setMaxUsers(5);
            }
        };
        if (isOpen) fetchMaxUsers();
    }, [isOpen, user?.planType]);
    
    const [formData, setFormData] = useState({
        roomName: "",
        roomType: "PUBLICA",
        passwordRoom: "",
        maxUsers: ""
    })
    const [maxUsersError, setMaxUsersError] = useState("")

    // Cargar lenguajes cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadLanguages()
            setMaxUsersError("")
        }
    }, [isOpen])

    const loadLanguages = async () => {
        setLoadingLanguages(true)
        try {
            console.log('Iniciando carga de lenguajes...')
            const languages = await fetchSupportedLanguages()
            console.log('Lenguajes cargados:', languages?.length || 0, languages?.slice(0, 3))
            
            // Transformar estructura si viene desde API
            let transformedLanguages = languages?.map(lang => ({
                id: lang.judge0Id || lang.id,
                name: lang.language || lang.name,
                description: lang.description
            })) || []
            
            // Eliminar duplicados por ID
            const seenIds = new Set()
            transformedLanguages = transformedLanguages.filter(lang => {
                if (seenIds.has(lang.id)) {
                    return false
                }
                seenIds.add(lang.id)
                return true
            })
            
            setAllLanguages(transformedLanguages)
            
            // Seleccionar JavaScript por defecto (ID 63 en Judge0)
            const jsLang = transformedLanguages?.find(lang => lang.id === 63)
            console.log('JavaScript encontrado:', jsLang)
            if (jsLang) {
                setSelectedLangId(jsLang.id)
                setSelectedLangIds([jsLang.id])
            }
        } catch (error) {
            console.error('Error cargando lenguajes:', error)
            toast.error('Error al cargar los lenguajes')
            setAllLanguages([])
        } finally {
            setLoadingLanguages(false)
        }
    }

    // Filtrar lenguajes según búsqueda
    const filteredLanguages = useMemo(() => {
        if (!searchTerm.trim()) {
            return allLanguages
        }
        return allLanguages.filter(lang =>
            lang.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [allLanguages, searchTerm])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        // Validar maxUsers según el plan
        if (!formData.maxUsers || isNaN(formData.maxUsers)) {
            setMaxUsersError("Debes especificar un número de usuarios")
            setLoading(false)
            return
        }

        if (formData.maxUsers < 2) {
            setMaxUsersError("Mínimo 2 usuarios por sala")
            setLoading(false)
            return
        }

        if (formData.maxUsers > maxUsers) {
            setMaxUsersError(`Tu plan permite máximo ${maxUsers} usuarios por sala`)
            setLoading(false)
            return
        }

        setMaxUsersError("")
        
        let languagesToSend;
        
        if (isMultiLanguage) {
            // Si no seleccionó lenguajes, usar todos
            if (selectedLangIds.length === 0) {
                languagesToSend = allLanguages.map(lang => lang.id)
                console.log('Multi-language sin selección: usando todos los lenguajes', languagesToSend)
            } else {
                languagesToSend = selectedLangIds
            }
        } else {
            // Mono-lenguaje: debe tener seleccionado uno
            if (!selectedLangId) {
                toast.error('Debes seleccionar un lenguaje')
                setLoading(false)
                return
            }
            languagesToSend = [selectedLangId]
        }
        
        if (languagesToSend.length === 0 || languagesToSend.some(id => !id)) {
            toast.error('Error: No hay lenguajes disponibles')
            setLoading(false)
            return
        }
        
        const payload = {
            ...formData,
            roomLanguage: isMultiLanguage ? languagesToSend : languagesToSend[0],
            isMultiLanguage: isMultiLanguage,
            maxUsers: formData.maxUsers
        }

        if (payload.roomType === "PUBLICA") {
            delete payload.passwordRoom
        }

        try {
            const { data } = await createRoom(payload)
            toast.success("¡Sala creada con éxito!")
            onSuccess(data)
            onClose()
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Error al crear la sala"
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={<><span className="text-primary">Crear</span> Sala</>}
        >
            <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-200px)]">
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 modal-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Nombre de la sala</label>
                        <Input 
                            required
                            placeholder="Mi sala genial"
                            value={formData.roomName}
                            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                            className="bg-black/40 border-white/5 h-12 focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Lenguaje</label>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <button
                            type="button"
                            onClick={() => setIsMultiLanguage(!isMultiLanguage)}
                            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-tight transition-all border ${
                                isMultiLanguage
                                ? "border-accent bg-accent/10 text-accent" 
                                : "border-white/5 bg-white/2 text-muted-foreground/60 hover:text-white"
                            }`}
                            title="Permitir múltiples lenguajes"
                        >
                            <Code2 className="h-3 w-3" />
                            Multi-Lenguaje
                        </button>
                        {isMultiLanguage && selectedLangIds.length > 0 && (
                            <span className="text-[9px] text-muted-foreground/60">
                                {selectedLangIds.length} seleccionado{selectedLangIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            placeholder="Buscar lenguaje..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 text-xs bg-black/20 border-white/5 mb-2"
                            disabled={loadingLanguages}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingLanguages ? (
                            <p className="col-span-3 text-center text-xs text-muted-foreground/60 py-4">Cargando lenguajes...</p>
                        ) : filteredLanguages.length > 0 ? (
                            filteredLanguages.map(lang => {
                                const isSelected = isMultiLanguage 
                                    ? selectedLangIds.includes(lang.id)
                                    : selectedLangId === lang.id;
                                
                                return (
                                    <button
                                        key={lang.id}
                                        type="button"
                                        onClick={() => {
                                            if (isMultiLanguage) {
                                                setSelectedLangIds(prev => 
                                                    prev.includes(lang.id)
                                                        ? prev.filter(id => id !== lang.id)
                                                        : [...prev, lang.id]
                                                )
                                            } else {
                                                setSelectedLangId(lang.id)
                                            }
                                        }}
                                        className={`rounded-lg py-2.5 px-1 text-[10px] font-black uppercase tracking-tight transition-all border truncate ${
                                            isSelected
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,217,255,0.1)]" 
                                            : "border-white/5 bg-white/2 text-muted-foreground/60 hover:text-white hover:bg-white/5"
                                        }`}
                                        title={lang.name}
                                    >
                                        {lang.name}
                                    </button>
                                )
                            })
                        ) : (
                            <p className="col-span-3 text-center text-xs text-muted-foreground/60 py-4">No hay lenguajes que coincidan</p>
                        )}
                    </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Tipo de acceso</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, roomType: "PUBLICA" })}
                                className={`flex items-center justify-center gap-2 rounded-xl border h-12 transition-all font-bold text-xs uppercase tracking-widest ${
                                    formData.roomType === "PUBLICA" 
                                    ? "border-success bg-success/10 text-success" 
                                    : "border-white/5 bg-white/2 text-muted-foreground/60"
                                }`}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                Pública
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, roomType: "PRIVADA" })}
                                className={`flex items-center justify-center gap-2 rounded-xl border h-12 transition-all font-bold text-xs uppercase tracking-widest ${
                                    formData.roomType === "PRIVADA" 
                                    ? "border-warning bg-warning/10 text-warning" 
                                    : "border-white/5 bg-white/2 text-muted-foreground/60"
                                }`}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Privada
                            </button>
                        </div>
                    </div>

                    {formData.roomType === "PRIVADA" && (
                        <div className="space-y-2 animate-fadeIn">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Contraseña segura</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.passwordRoom}
                                    onChange={(e) => setFormData({ ...formData, passwordRoom: e.target.value })}
                                    className="w-full bg-black/20 border border-primary/50 h-12 rounded-lg px-4 focus:outline-none focus:border-primary transition-all pr-12 text-foreground"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Cupos (Máx. {maxUsers})</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input 
                                type="number"
                                min="2"
                                max={maxUsers}
                                placeholder="+2"
                                value={formData.maxUsers}
                                onChange={(e) => {
                                    const value = e.target.value === '' ? '' : Number.parseInt(e.target.value, 10)
                                    setFormData({ ...formData, maxUsers: value })
                                    // Validación en tiempo real
                                    if (value !== '' && !isNaN(value)) {
                                        if (value < 2) {
                                            setMaxUsersError("Mínimo 2 usuarios")
                                        } else if (value > maxUsers) {
                                            setMaxUsersError(`Máximo ${maxUsers} usuarios para tu plan`)
                                        } else {
                                            setMaxUsersError("")
                                        }
                                    } else {
                                        setMaxUsersError("")
                                    }
                                }}
                                className={`pl-10 bg-black/40 border-white/5 h-12 transition-colors ${
                                    maxUsersError ? 'border-destructive/50 focus:border-destructive' : ''
                                }`}
                            />
                        </div>
                        {maxUsersError && (
                            <p className="text-xs text-destructive mt-1">{maxUsersError}</p>
                        )}
                    </div>
                </div>

                <Button 
                    type="submit" 
                    loading={loading}
                    variant="ghost"
                    className="w-full h-12 rounded-lg border-2 border-primary !bg-transparent !text-primary font-bold text-xs uppercase tracking-widest transition-all mt-6 hover:!bg-transparent hover:border-primary hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Sala
                </Button>
            </form>
        </Modal>
    )
}
