import { Star, Users, Lock, Globe, ArrowRight, Copy, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { useRoomStore } from "../store/roomStore"
import { toast } from "react-hot-toast"
import { getUserSubscription } from "../../../shared/api/subscriptions"
import { getLanguageName } from "../../../shared/constants/languages"

export const RoomCard = ({ room, onJoin }) => {
    const { favorites, toggleFavorite } = useRoomStore()
    const [copied, setCopied] = useState(false)
    const [hostPlan, setHostPlan] = useState(room?.hostPlan || null)
    const favorite = favorites.includes(room._id)

    const handleCopy = (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(room.roomCode)
        setCopied(true)
        toast.success("Código copiado")
        setTimeout(() => setCopied(false), 2000)
    }

    // Colores directos de la referencia (Hexadecimales vibrantes)
    const getLanguageColor = (lang) => {
        const l = lang?.toUpperCase() || ""
        if (l.includes("JAVASCRIPT")) return "#f7df1e" // Amarillo JS
        if (l.includes("TYPESCRIPT")) return "#3178c6" // Azul TS
        if (l.includes("PYTHON")) return "#3776ab" // Azul/Verde Python
        if (l.includes("JAVA")) return "#007396" // Azul Java
        if (l.includes("GO")) return "#00add8" // Cyan Go
        if (l.includes("RUST")) return "#dea584" // Naranja Rust
        if (l.includes("HTML") || l.includes("CSS")) return "#e34f26" // Naranja HTML
        return "#00d9ff" // Default Cyan
    }

    const hostUser = room.connectedUsers?.find(u => u.subRole === "HOST_ROLE")
    const hostName = hostUser?.username || "Usuario"
    const displayLanguage = room.isMultiLanguage
        ? "MULTI-LENGUAJE"
        : getLanguageName(room.roomLanguage || "JAVASCRIPT")

    useEffect(() => {
        setHostPlan(room?.hostPlan || null)

        if (room?.hostPlan || !room?.hostId) {
            return
        }

        const fetchHostPlan = async () => {
            try {
                const response = await getUserSubscription(room.hostId)
                const resolvedPlan = response?.data?.data?.planName || response?.data?.data?.planId?.name || "FREE"
                setHostPlan(resolvedPlan)
            } catch (error) {
                console.error("Error fetching host plan:", error)
                setHostPlan("FREE")
            }
        }

        fetchHostPlan()
    }, [room?.hostId, room?.hostPlan])

    return (
        <div 
            onClick={() => onJoin(room)}
            className="group relative flex flex-col rounded-2xl bg-[#0d1320]/80 border-2 border-primary/60 p-6 transition-all duration-300 hover:border-primary/80 hover:shadow-[0_0_40px_rgba(0,217,255,0.4),inset_0_0_20px_rgba(0,217,255,0.1)] shadow-[0_0_25px_rgba(0,217,255,0.25)] cursor-pointer room-card-glow"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-bold text-white group-hover:text-primary transition-colors">
                        {room.roomName}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-white font-bold">
                        <span className="tracking-widest uppercase">
                            {room.roomCode || "ABC-DEF-GHI"}
                        </span>
                        <button 
                            onClick={handleCopy}
                            className="p-1 hover:bg-white/5 rounded transition-all hover:text-white"
                        >
                            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {room.roomType === "PRIVADA" ? (
                        <Lock className="h-3.5 w-3.5 text-[#f59e0b]" />
                    ) : (
                        <Globe className="h-3.5 w-3.5 text-[#10b981]" />
                    )}
                    <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,1)]" />
                </div>
            </div>

            <div className="flex items-center gap-4 mt-5">
                <span 
                    className="text-xs font-black tracking-tight text-primary"
                >
                    {displayLanguage}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-white font-bold uppercase tracking-tighter">
                    <Users className="h-3 w-3 text-white" />
                    <span>{room.connectedUsers?.length || 0} / {room.maxUsers || 12}</span>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-white/60 font-bold uppercase tracking-wider leading-none">
                            {hostName}
                        </span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none">
                            {hostPlan || "FREE"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(room._id)
                        }}
                        className={`transition-all ${favorite ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : "text-white/5 hover:text-white/20"}`}
                        style={{
                            color: favorite ? "#a855f7" : "currentColor"
                        }}
                    >
                        <Star className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} />
                    </button>
                    <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
            </div>
        </div>
    )
}
