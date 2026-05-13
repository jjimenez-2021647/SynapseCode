import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../features/auth/store/authStore"
import { useRoomStore } from "../../features/rooms/store/roomStore"
import { RoomCard } from "../../features/rooms/components/RoomCard"
import { DashboardHeader } from "../../features/rooms/components/DashboardHeader"
import { CreateRoomModal } from "../../features/rooms/components/CreateRoomModal"
import { JoinRoomModal } from "../../features/rooms/components/JoinRoomModal"
import { Star, LayoutGrid, User, Users } from "lucide-react"
import Spinner from "../../shared/components/ui/Spinner"
import { Navbar } from "../../shared/components/layout/Navbar"

export const DashboardPage = () => {
    const user = useAuthStore((state) => state.user)
    const { rooms, fetchRooms, loading, favorites } = useRoomStore()
    const navigate = useNavigate()

    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("all") // all, my, joined, favorites
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesSearch = 
                room.roomName?.toLowerCase().includes(search.toLowerCase()) || 
                room.roomLanguage?.toLowerCase().includes(search.toLowerCase()) ||
                room.roomCode?.toLowerCase().includes(search.toLowerCase())

            if (!matchesSearch) return false

            if (category === "favorites") return favorites.includes(room._id)
            if (category === "my") return room.hostId === user?.id
            if (category === "joined") return room.connectedUsers?.some(u => u.userId === user?.id) && room.hostId !== user?.id
            
            return true
        })
    }, [rooms, search, category, favorites, user?.id])

    const handleJoin = (room) => {
        if (room.roomType === "PRIVADA") {
            setIsJoinModalOpen(true)
        } else {
            navigate(`/sessionCode/${room._id}`)
        }
    }

    const categories = [
        { id: "all", label: "Todas", icon: LayoutGrid },
        { id: "my", label: "Propias", icon: User },
        { id: "joined", label: "Unidas", icon: Users },
        { id: "favorites", label: "Favoritas", icon: Star },
    ]

    return (
        <div className="min-h-screen synapse-page overflow-x-hidden flex flex-col">
            <Navbar />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
                <DashboardHeader 
                    onSearch={setSearch}
                    onCreateRoom={() => setIsCreateModalOpen(true)}
                    onJoinByCode={() => setIsJoinModalOpen(true)}
                />

                <div className="mt-10 mb-8 flex items-center gap-6 border-b border-white/5 pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`relative pb-4 text-sm font-bold transition-all duration-300 ${
                                category === cat.id
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary after:shadow-[0_0_10px_rgba(0,217,255,0.8)]"
                                : "text-muted-foreground hover:text-white"
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
                ) : filteredRooms.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRooms.map((room) => (
                            <RoomCard 
                                key={room._id} 
                                room={room} 
                                onJoin={handleJoin}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center p-10 bg-surface/10">
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
            </main>

            <CreateRoomModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(newRoom) => {
                    fetchRooms()
                    navigate(`/sessionCode/${newRoom._id}`)
                }}
            />

            <JoinRoomModal 
                isOpen={isJoinModalOpen} 
                onClose={() => setIsJoinModalOpen(false)}
                onSuccess={(room) => {
                    navigate(`/sessionCode/${room._id}`)
                }}
            />
        </div>
    )
}
