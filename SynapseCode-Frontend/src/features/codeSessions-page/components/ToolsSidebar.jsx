import { Clock, Lightbulb, Play, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { useNavigate } from 'react-router-dom'

export const ToolsSidebar = () => {
    const navigate = useNavigate()
    const [expandedTool, setExpandedTool] = useState('sala')

    const activeToolTab = useCodeSessionStore((state) => state.activeToolTab)
    const setActiveToolTab = useCodeSessionStore((state) => state.setActiveToolTab)
    const versions = useCodeSessionStore((state) => state.versions)
    const roomName = useCodeSessionStore((state) => state.roomName)
    const isPrivate = useCodeSessionStore((state) => state.isPrivate)
    const roomPassword = useCodeSessionStore((state) => state.roomPassword)

    const handleLeaveRoom = () => {
        if (confirm('¿Estás seguro de que deseas salir de la sala?')) {
            navigate('/dashboard')
        }
    }

    const renderToolContent = () => {
        switch (activeToolTab) {
            case 'versiones':
                return (
                    <div className="space-y-2">
                        {versions.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No hay versiones guardadas</p>
                        ) : (
                            versions.map((version, idx) => (
                                <div
                                    key={version.id}
                                    className="p-2 bg-slate-900/50 border border-primary/20 rounded-lg hover:border-primary/50 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-primary">v{version.version}</p>
                                            <p className="text-xs text-slate-400">{version.saveType}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {version.savedAt?.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <button className="p-1 hover:bg-primary/20 rounded opacity-0 group-hover:opacity-100 transition-all">
                                            <Clock className="h-3 w-3 text-primary" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
            case 'explicacion':
                return (
                    <div className="space-y-3 text-xs text-slate-300">
                        <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                            <p className="font-semibold text-accent mb-2">Explicación de código</p>
                            <p>Selecciona un fragmento de código y presiona el botón de IA para obtener una explicación detallada.</p>
                        </div>
                    </div>
                )
            case 'ejecuciones':
                return (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-400 text-center py-4">Últimas ejecuciones</p>
                        {/* Here would be execution history */}
                    </div>
                )
            case 'sala':
                return (
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-900/50 border border-primary/20 rounded-lg space-y-2">
                            <p className="text-xs font-bold text-slate-300">Información de Sala</p>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <p className="text-slate-400">Sala:</p>
                                    <p className="text-slate-200 font-mono font-semibold break-all">{roomName}</p>
                                </div>
                                {isPrivate && (
                                    <div>
                                        <p className="text-slate-400">Contraseña:</p>
                                        <p className="text-slate-200 font-mono font-semibold">{roomPassword}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleLeaveRoom}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-error/20 hover:bg-error/30 border border-error/30 rounded-lg transition-colors text-sm font-semibold text-error"
                        >
                            <LogOut className="h-4 w-4" />
                            Salir de la Sala
                        </button>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40">
            <div className="p-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Herramientas</h3>
            </div>

            <div className="flex gap-2 p-2 border-b border-white/10 overflow-x-auto">
                {[
                    { id: 'versiones', label: 'Versiones', icon: Clock },
                    { id: 'explicacion', label: 'Explicación', icon: Lightbulb },
                    { id: 'ejecuciones', label: 'Ejecuciones', icon: Play },
                    { id: 'sala', label: 'Sala', icon: Settings },
                ].map((tool) => {
                    const Icon = tool.icon
                    const isActive = activeToolTab === tool.id
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveToolTab(tool.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-primary/20 text-primary border border-primary/40'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-primary/10'
                            }`}
                            title={tool.label}
                        >
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{tool.label}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {renderToolContent()}
            </div>
        </div>
    )
}
