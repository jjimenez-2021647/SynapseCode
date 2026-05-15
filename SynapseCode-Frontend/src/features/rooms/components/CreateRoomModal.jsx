import { useState, useMemo, useEffect } from "react"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { createRoom } from "../../../shared/api"
import { toast } from "react-hot-toast"
import { Search, Globe, Lock, Users, Zap, Code2 } from "lucide-react"
import { fetchSupportedLanguages } from "../../../shared/constants/languages"

export const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [loadingLanguages, setLoadingLanguages] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [allLanguages, setAllLanguages] = useState([])
    const [isMultiLanguage, setIsMultiLanguage] = useState(false)
    const [selectedLangId, setSelectedLangId] = useState(null)
    const [selectedLangIds, setSelectedLangIds] = useState([])
    
    const [formData, setFormData] = useState({
        roomName: "",
        roomType: "PUBLICA",
        passwordRoom: "",
        maxUsers: 8
    })

    // Cargar lenguajes cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadLanguages()
        }
    }, [isOpen])

    const loadLanguages = async () => {
        setLoadingLanguages(true)
        try {
            console.log('Iniciando carga de lenguajes...')
            const languages = await fetchSupportedLanguages()
            console.log('Lenguajes cargados:', languages?.length || 0, languages?.slice(0, 3))
            setAllLanguages(languages || [])
            
            // Seleccionar JavaScript por defecto (ID 63 en Judge0)
            const jsLang = languages?.find(lang => lang.id === 63)
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
            maxUsers: Math.min(formData.maxUsers, 12)
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
            toast.error(err.response?.data?.message || "Error al crear la sala")
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
                            placeholder="Mi proyecto genial"
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
                            <Input 
                                required
                                type="password"
                                placeholder="••••••••"
                                value={formData.passwordRoom}
                                onChange={(e) => setFormData({ ...formData, passwordRoom: e.target.value })}
                                className="bg-black/40 border-white/5 h-12"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Cupos (Máx. 12)</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input 
                                type="number"
                                min="2"
                                max="12"
                                value={formData.maxUsers}
                                onChange={(e) => setFormData({ ...formData, maxUsers: Number.parseInt(e.target.value, 10) })}
                                className="pl-10 bg-black/40 border-white/5 h-12"
                            />
                        </div>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    loading={loading}
                    className="w-full h-14 rounded-xl bg-linear-to-r from-primary to-accent text-background font-black text-sm uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(0,217,255,0.3)] mt-6"
                >
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                    Crear Sala
                </Button>
            </form>
        </Modal>
    )
}
