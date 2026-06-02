import { Trash2, Plus } from 'lucide-react'
import { useCodeSessionStore } from '../store/codeSessionStore'

export const ConsolePanel = () => {
    const consoles = useCodeSessionStore((state) => state.consoles)
    const activeConsole = useCodeSessionStore((state) => state.activeConsole)
    const setActiveConsole = useCodeSessionStore((state) => state.setActiveConsole)
    const addConsole = useCodeSessionStore((state) => state.addConsole)
    const clearConsoleOutput = useCodeSessionStore((state) => state.clearConsoleOutput)

    // Buscar la consola activa por su ID
    const currentConsole = consoles.find((c) => c.id === activeConsole)

    const handleNewConsole = () => {
        const newConsoleId = `console-${Date.now()}`
        addConsole(newConsoleId) // Sin fileId para consolas manuales
        setActiveConsole(newConsoleId)
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/70">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Consola</h3>
                    <div className="flex gap-1">
                        {consoles.map((console, idx) => (
                            <button
                                key={console.id}
                                onClick={() => setActiveConsole(console.id)}
                                className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                                    activeConsole === console.id
                                        ? 'bg-primary/20 text-primary border border-primary/40'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-primary/10'
                                }`}
                                title={console.fileId ? `Archivo: ${console.fileId}` : 'Consola manual'}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleNewConsole}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-primary/20 rounded transition-colors"
                        title="Nueva consola"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    {currentConsole && (
                        <button
                            onClick={() => clearConsoleOutput(currentConsole.id)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-error/20 rounded transition-colors"
                            title="Limpiar consola"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-slate-300 space-y-1">
                {currentConsole && currentConsole.output.length > 0 ? (
                    currentConsole.output.map((line, idx) => (
                        <div key={idx} className={`${line.type === 'error' ? 'text-error' : ''}`}>
                            {line.message || line}
                        </div>
                    ))
                ) : (
                    <div className="text-slate-500">
                        {currentConsole ? 'Esperando salida...' : 'No hay consolas'}
                    </div>
                )}
            </div>
        </div>
    )
}
