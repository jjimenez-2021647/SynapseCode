import { useState, useMemo } from "react"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { createRoom } from "../../../shared/api"
import { toast } from "react-hot-toast"
import { Search, Globe, Lock, Users, Zap } from "lucide-react"

const LANGUAGES = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "HTML/CSS"
]

const LANGUAGE_BACKEND_MAP = {
    "JavaScript": "JAVASCRIPT",
    "TypeScript": "JAVASCRIPT",
    "Python": "PYTHON",
    "Java": "JAVA",
    "C#": "CSHARP",
    "HTML/CSS": "HTML_CSS"
}

export const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLangUI, setSelectedLangUI] = useState("JavaScript")
    
    const [formData, setFormData] = useState({
        roomName: "",
        roomType: "PUBLICA",
        passwordRoom: "",
        maxUsers: 8
    })

    const filteredLanguages = useMemo(() => {
        return LANGUAGES.filter(lang => 
            lang.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [searchTerm])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        const payload = {
            ...formData,
            roomLanguage: LANGUAGE_BACKEND_MAP[selectedLangUI],
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            placeholder="Buscar lenguaje..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 text-xs bg-black/20 border-white/5 mb-2"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredLanguages.map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setSelectedLangUI(lang)}
                                className={`rounded-lg py-2.5 px-1 text-[10px] font-black uppercase tracking-tight transition-all border ${
                                    selectedLangUI === lang
                                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,217,255,0.1)]" 
                                    : "border-white/5 bg-white/[0.02] text-muted-foreground/60 hover:text-white hover:bg-white/[0.05]"
                                }`}
                            >
                                {lang}
                            </button>
                        ))}
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
                                : "border-white/5 bg-white/[0.02] text-muted-foreground/60"
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
                                : "border-white/5 bg-white/[0.02] text-muted-foreground/60"
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
                            onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                            className="pl-10 bg-black/40 border-white/5 h-12"
                        />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    loading={loading}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-black text-sm uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(0,217,255,0.3)]"
                >
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                    Crear Sala
                </Button>
            </form>
        </Modal>
    )
}
