import { Circle, Crown } from 'lucide-react'
import { useCodeSessionStore } from '../store/codeSessionStore'

export const Participants = () => {
    const connectedUsers = useCodeSessionStore((state) => state.connectedUsers)
    const currentUser = useCodeSessionStore((state) => state.currentUser)
    const maxParticipants = useCodeSessionStore((state) => state.maxParticipants)

    // Separar usuarios por rol
    const hosts = Object.values(connectedUsers).filter((user) => user.role === 'host' || user.role === 'HOST_ROLE')
    const regularParticipants = Object.values(connectedUsers).filter((user) => user.role !== 'host' && user.role !== 'HOST_ROLE')
    
    const totalUsers = hosts.length + regularParticipants.length

    const renderUserItem = (user) => {
        // Obtener la foto de perfil
        const profilePicture = user.profilePicture
        const displayName = user.name || user.username || 'Usuario'
        const initial = displayName[0]?.toUpperCase() || 'U'

        return (
            <div
                key={user.id || user.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
                <div className="relative">
                    {profilePicture ? (
                        <img
                            src={profilePicture}
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover"
                            onError={(e) => {
                                // Si la imagen falla, mostrar avatar con inicial
                                e.target.style.display = 'none'
                                if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = 'flex'
                                }
                            }}
                        />
                    ) : null}
                    <div 
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-xs font-bold text-white"
                        style={profilePicture ? { display: 'none' } : {}}
                    >
                        {initial}
                    </div>
                    <Circle
                        className={`h-3 w-3 absolute bottom-0 right-0 ${
                            user.online ? 'fill-emerald-400 text-emerald-400' : 'fill-slate-600 text-slate-600'
                        }`}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        {user.id === currentUser?.id && (
                            <span className="text-xs bg-primary/30 text-primary px-1.5 rounded">Tú</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">
                        {user.role === 'host' || user.role === 'HOST_ROLE' ? 'Anfitrión' : 'Participante'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40">
            <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Participantes</h3>
                    <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded-full">
                        {totalUsers}/{maxParticipants}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {totalUsers === 0 ? (
                    <div className="text-center py-6 text-xs text-muted">
                        <p>Esperando participantes...</p>
                    </div>
                ) : (
                    <>
                        {/* Anfitriones */}
                        {hosts.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 px-2 py-2 mb-2">
                                    <Crown className="h-4 w-4 text-yellow-400" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                                        Anfitriones ({hosts.length})
                                    </h4>
                                </div>
                                <div className="space-y-2">
                                    {hosts.map((user) => renderUserItem(user))}
                                </div>
                            </div>
                        )}

                        {/* Participantes */}
                        {regularParticipants.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 px-2 py-2 mb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Participantes ({regularParticipants.length})
                                    </h4>
                                </div>
                                <div className="space-y-2">
                                    {regularParticipants.map((user) => renderUserItem(user))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
