import { useState } from 'react'
import { Save, Play, Share2, LogOut } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { useNavigate } from 'react-router-dom'
import { filesAPI, executionAPI } from '../services/apiService'
import { emitConsoleOutputSocket } from '../services/socketService'
import { showSuccess, showError } from '../../../shared/utils/toast'

export const TopBar = () => {
    const navigate = useNavigate()
    const [showShareModal, setShowShareModal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)

    const code = useCodeSessionStore((state) => state.code)
    const currentFile = useCodeSessionStore((state) => state.currentFile)
    const language = useCodeSessionStore((state) => state.language)
    const roomId = useCodeSessionStore((state) => state.roomId)
    const roomName = useCodeSessionStore((state) => state.roomName)
    const isPrivate = useCodeSessionStore((state) => state.isPrivate)
    const roomPassword = useCodeSessionStore((state) => state.roomPassword)
    const consoles = useCodeSessionStore((state) => state.consoles)
    const setSaving = useCodeSessionStore((state) => state.setSaving)
    const setUnsavedChanges = useCodeSessionStore((state) => state.setUnsavedChanges)
    const addConsole = useCodeSessionStore((state) => state.addConsole)
    const addConsoleOutput = useCodeSessionStore((state) => state.addConsoleOutput)
    const setActiveConsole = useCodeSessionStore((state) => state.setActiveConsole)
    const setActiveToolTab = useCodeSessionStore((state) => state.setActiveToolTab)
    const getConsoleByFileId = useCodeSessionStore((state) => state.getConsoleByFileId)

    const handleSave = async () => {
        if (!currentFile || !currentFile.id) {
            showError('No hay archivo para guardar')
            return
        }

        setIsSaving(true)
        setSaving(true)
        try {
            await filesAPI.updateFileContent(currentFile.id, code)
            setUnsavedChanges(false)
            showSuccess('Archivo guardado correctamente')
        } catch (error) {
            console.error('Error al guardar:', error)
            showError(error?.response?.data?.message || 'Error al guardar el archivo')
        } finally {
            setIsSaving(false)
            setSaving(false)
        }
    }

    const handleExecute = async () => {
        if (!currentFile || !currentFile.id) {
            showError('No hay archivo para ejecutar')
            return
        }

        if (!code || code.trim() === '') {
            showError('El archivo está vacío')
            return
        }

        setIsExecuting(true)
        try {
            // Buscar si ya existe una consola para este archivo
            let existingConsole = consoles.find((c) => c.fileId === currentFile.id)
            let consoleId

            if (existingConsole) {
                // Reutilizar la consola existente
                consoleId = existingConsole.id
            } else {
                // Crear una nueva consola para este archivo
                consoleId = `console-${currentFile.id}`
                addConsole(consoleId, currentFile.id)
            }

            // Activar la consola y cambiar a pestaña de ejecuciones
            setActiveConsole(consoleId)
            setActiveToolTab('ejecuciones')

            // Ejecutar el código
            const response = await executionAPI.executeCode({
                fileId: currentFile.id,
                roomId,
                language: language || 'javascript',
                code,
                input: '',
            })

            // Emitir output a través de Socket.IO para que TODOS los usuarios lo vean
            // (incluyendo el que ejecutó)
            if (response.data?.output) {
                emitConsoleOutputSocket(roomId, currentFile.id, consoleId, response.data.output, 'output')
                showSuccess('Código ejecutado correctamente')
            }

            // Emitir errores a través de Socket.IO
            if (response.data?.errors) {
                emitConsoleOutputSocket(roomId, currentFile.id, consoleId, response.data.errors, 'error')
                showError('Error en la ejecución: ' + response.data.diagnosis?.message)
            }
        } catch (error) {
            console.error('Error al ejecutar:', error)
            showError(error?.response?.data?.message || 'Error al ejecutar el código')
        } finally {
            setIsExecuting(false)
        }
    }

    const handleShare = () => {
        setShowShareModal(true)
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alert('Copiado al portapapeles')
    }

    const handleLeave = () => {
        if (confirm('¿Abandonar la sesión?')) {
            navigate('/dashboard')
        }
    }

    return (
        <>
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{roomName}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-300">{currentFile?.name || 'Sin archivo'}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSave}
                        disabled={isSaving}
                        loading={isSaving}
                    >
                        <Save className="h-4 w-4" />
                        Guardar
                    </Button>

                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleExecute}
                        disabled={isExecuting}
                        loading={isExecuting}
                    >
                        <Play className="h-4 w-4" />
                        Ejecutar
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4" />
                        Compartir
                    </Button>

                    <Button
                        size="sm"
                        variant="danger"
                        onClick={handleLeave}
                    >
                        <LogOut className="h-4 w-4" />
                        Salir
                    </Button>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-primary/30 rounded-2xl p-6 max-w-md w-full space-y-4">
                        <h2 className="text-xl font-bold text-white">Compartir Sala</h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Código de Sala
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={roomId}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-slate-950 border border-primary/30 rounded-lg text-sm text-white font-mono"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(roomId)}
                                        className="px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm font-semibold text-primary transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            {isPrivate && (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Contraseña
                                    </label>
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            value={roomPassword}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-accent/30 rounded-lg text-sm text-white font-mono"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(roomPassword)}
                                            className="px-3 py-2 bg-accent/20 hover:bg-accent/30 rounded-lg text-sm font-semibold text-accent transition-colors"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full py-2 bg-primary/20 hover:bg-primary/30 rounded-lg font-semibold text-primary transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
