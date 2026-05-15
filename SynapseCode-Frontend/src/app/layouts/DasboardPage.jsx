import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../features/auth/store/authStore"
import { useRoomStore } from "../../features/rooms/store/roomStore"
import { RoomCard } from "../../features/rooms/components/RoomCard"
import { CreateRoomCard } from "../../features/rooms/components/CreateRoomCard"
import { DashboardHeader } from "../../features/rooms/components/DashboardHeader"
import { CreateRoomModal } from "../../features/rooms/components/CreateRoomModal"
import { JoinRoomModal } from "../../features/rooms/components/JoinRoomModal"
import { Star, LayoutGrid, User, Users } from "lucide-react"
import Spinner from "../../shared/components/ui/Spinner"
import { Navbar } from "../../shared/components/layout/Navbar"
import { ParticleField } from "../../features/auth/components/landing/ParticleField"
import { joinRoom } from "../../shared/api"
import { toast } from "react-hot-toast"

export const DashboardPage = () => {
    const user = useAuthStore((state) => state.user)
    const { rooms, fetchRooms, loading, favorites } = useRoomStore()
    const navigate = useNavigate()

    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("all") // all, my, joined, favorites
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [selectedRoomToJoin, setSelectedRoomToJoin] = useState(null)

    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    useEffect(() => {
        const root = document.documentElement
        const update = (event) => {
            root.style.setProperty("--cursor-x", `${event.clientX}px`)
            root.style.setProperty("--cursor-y", `${event.clientY}px`)
        }
        window.addEventListener("pointermove", update, { passive: true })
        return () => window.removeEventListener("pointermove", update)
    }, [])

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            // Para roomLanguage, manejar tanto string como array (multi-lenguaje)
            let languageMatch = false
            if (room.isMultiLanguage) {
                languageMatch = "MULTI-LENGUAJE".toLowerCase().includes(search.toLowerCase())
            } else if (typeof room.roomLanguage === 'string') {
                languageMatch = room.roomLanguage.toLowerCase().includes(search.toLowerCase())
            }

            const matchesSearch = 
                room.roomName?.toLowerCase().includes(search.toLowerCase()) || 
                languageMatch ||
                room.roomCode?.toLowerCase().includes(search.toLowerCase())

            if (!matchesSearch) return false

            if (category === "favorites") return favorites.includes(room._id)
            if (category === "my") return room.hostId === user?.id
            if (category === "joined") return room.connectedUsers?.some(u => u.userId === user?.id)
            
            return true
        })
    }, [rooms, search, category, favorites, user?.id])

    const handleJoin = async (room) => {
        if (room.roomType === "PRIVADA") {
            setSelectedRoomToJoin(room)
            setIsJoinModalOpen(true)
        } else {
            try {
                const response = await joinRoom({
                    roomCode: room.roomCode,
                    roomName: room.roomName,
                })

                fetchRooms()
                toast.success("Te has unido a la sala")
                navigate(`/codeSessions-page/${response?.data?.data?.room?._id || room._id}`)
            } catch (error) {
                toast.error(error.response?.data?.message || "Error al unirse a la sala")
            }
        }
    }

    const categories = [
        { id: "all", label: "Todas", icon: LayoutGrid },
        { id: "my", label: "Propias", icon: User },
        { id: "joined", label: "Unidas", icon: Users },
        { id: "favorites", label: "Favoritas", icon: Star },
    ]

    return (
        <div className="min-h-screen synapse-page overflow-x-hidden flex flex-col bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)]">
            <ParticleField />
            
            {/* Ambient glow blobs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] right-[15%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[20%] left-[10%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.06)_0%,transparent_70%)] blur-[40px]" />
            </div>
            
            <Navbar />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
                <DashboardHeader 
                    onSearch={setSearch}
                    onCreateRoom={() => setIsCreateModalOpen(true)}
                    onJoinByCode={() => {
                        setSelectedRoomToJoin(null)
                        setIsJoinModalOpen(true)
                    }}
                />

                <div className="mt-10 mb-8 flex items-center gap-6 border-b-2 border-primary/30 pb-1 line-glow">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`relative pb-4 text-sm font-bold transition-all duration-300 ${
                                category === cat.id
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary after:shadow-[0_0_10px_rgba(0,217,255,0.8)] category-active"
                                : "text-white hover:text-primary hover:drop-shadow-[0_0_8px_rgba(0,217,255,0.7)] hover:scale-105"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4">
                        <Spinner size="lg" />
                        <p className="animate-pulse text-sm text-primary">Sincronizando con el servidor...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <CreateRoomCard onClick={() => setIsCreateModalOpen(true)} />
                        {filteredRooms.length > 0 ? (
                            filteredRooms.map((room) => (
                                <RoomCard 
                                    key={room._id} 
                                    room={room} 
                                    onJoin={handleJoin}
                                />
                            ))
                        ) : (
                            <div className="sm:col-span-2 lg:col-span-2 flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center p-10 bg-surface/10">
                                <div className="rounded-full bg-white/5 p-6 mb-4">
                                    <LayoutGrid className="h-10 w-10 text-muted/20" />
                                </div>
                                <h3 className="text-xl font-bold text-white">No hay salas disponibles</h3>
                                <p className="mt-2 max-w-sm text-muted-foreground">
                                    {search 
                                        ? `No hay resultados para "${search}".` 
                                        : "Parece que no hay salas activas en esta categoría."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <CreateRoomModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(newRoom) => {
                    fetchRooms()
                    navigate(`/codeSessions-page/${newRoom._id}`)
                }}
            />

            <JoinRoomModal 
                isOpen={isJoinModalOpen} 
                room={selectedRoomToJoin}
                onClose={() => {
                    setIsJoinModalOpen(false)
                    setSelectedRoomToJoin(null)
                }}
                onSuccess={(room) => {
                    fetchRooms()
                    navigate(`/codeSessions-page/${room._id}`)
                }}
            />
        </div>
    )
}
