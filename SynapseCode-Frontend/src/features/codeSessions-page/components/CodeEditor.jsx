import { useEffect, useRef, useState } from 'react'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { 
    initializeSocket, 
    disconnectSocket, 
    emitCodeChangeSocket,
    onCodeChangeSocket,
    offCodeChangeSocket,
    onUserJoinedSocket,
    offUserJoinedSocket,
    onUserLeftSocket,
    offUserLeftSocket,
    emitCursorSocket,
    onCursorMoveSocket,
    offCursorMoveSocket,
    onConsoleOutputSocket,
    offConsoleOutputSocket,
    onRoomUsersUpdatedSocket,
    offRoomUsersUpdatedSocket,
    getSocket
} from '../services/socketService'
import { roomAPI } from '../services/apiService'
import { RemoteCursors } from './RemoteCursors'
import { useAuthStore } from '../../auth/store/authStore'

// Nota: Aquí se integraría CodeMirror real. Por ahora es un placeholder
export const CodeEditor = () => {
    const code = useCodeSessionStore((state) => state.code)
    const updateCode = useCodeSessionStore((state) => state.updateCode)
    const updateUserCursor = useCodeSessionStore((state) => state.updateUserCursor)
    const removeUserCursor = useCodeSessionStore((state) => state.removeUserCursor)
    const setConnectedUser = useCodeSessionStore((state) => state.setConnectedUser)
    const removeConnectedUser = useCodeSessionStore((state) => state.removeConnectedUser)
    const addConsoleOutput = useCodeSessionStore((state) => state.addConsoleOutput)
    const addConsole = useCodeSessionStore((state) => state.addConsole)
    const language = useCodeSessionStore((state) => state.language)
    const currentFile = useCodeSessionStore((state) => state.currentFile)
    const roomId = useCodeSessionStore((state) => state.roomId)
    const consoles = useCodeSessionStore((state) => state.consoles)
    const unsavedChanges = useCodeSessionStore((state) => state.unsavedChanges)
    const setUnsavedChanges = useCodeSessionStore((state) => state.setUnsavedChanges)
    const token = useAuthStore((state) => state.token)
    const user = useAuthStore((state) => state.user)
    
    const editorRef = useRef(null)
    const isRemoteChangeRef = useRef(false) // Flag para ignorar emits cuando recibimos cambios remotos
    const cursorEmitTimeoutRef = useRef(null) // Debounce para cursor
    const socketInitializedRef = useRef(false)

    // Inicializar Socket.IO y listeners
    useEffect(() => {
        if (!currentFile || !roomId || !user?.id || !token) return

        // Inicializar Socket.IO
        const socket = initializeSocket(roomId, currentFile.id, user.id, token)
        socketInitializedRef.current = true

        // Escuchar cambios de código de otros usuarios
        const handleCodeChanged = ({ code: newCode, userId }) => {
            // No actualizar si fue el mismo usuario el que hizo el cambio
            if (userId === user.id) return

            // Guardar posición del cursor
            const textarea = editorRef.current
            const cursorPos = textarea?.selectionStart || 0

            // Marcar como cambio remoto
            isRemoteChangeRef.current = true
            updateCode(newCode)
            
            // Restaurar cursor después de la actualización
            setTimeout(() => {
                if (textarea) {
                    textarea.selectionStart = textarea.selectionEnd = Math.min(cursorPos, newCode.length)
                }
                isRemoteChangeRef.current = false
            }, 0)
        }

        // Escuchar movimiento de cursor de otros usuarios
        const handleCursorMoved = ({ position, userId, userName }) => {
            if (userId === user.id) return
            updateUserCursor(userId, position, userName)
        }

        // Escuchar output de consola compartido
        const handleConsoleOutput = ({ consoleId, output, type }) => {
            // Verificar si la consola existe, si no, crearla
            const consoleExists = consoles.some((c) => c.id === consoleId)
            if (!consoleExists) {
                addConsole(consoleId, currentFile.id)
            }
            
            addConsoleOutput(consoleId, {
                type: type || 'output',
                message: output,
                timestamp: new Date(),
            })
        }

        // Escuchar actualizaciones de usuarios conectados
        const handleRoomUsersUpdated = async ({ roomId: updatedRoomId, fileId, userId }) => {
            // Verificar si el usuario ya está en la lista
            const connectedUsers = useCodeSessionStore.getState().connectedUsers
            
            if (!connectedUsers[userId]) {
                // Usuario nuevo, cargar sus datos completos
                try {
                    const roomParticipants = await roomAPI.getRoomParticipants(roomId)
                    const participantsData = Array.isArray(roomParticipants.data)
                        ? roomParticipants.data
                        : (roomParticipants.data?.participations || [])

                    // Buscar el participante que coincide con este userId
                    const participation = participantsData.find(
                        (p) => (p.userId?._id || p.userId?.id || p.userId) === userId
                    )

                    if (participation) {
                        const userData = participation.userId || {}
                        const userName = userData.name || userData.firstName || userData.username || 'Usuario'
                        const userProfilePicture = userData.profilePicture || null
                        const role = participation.role || 'MIEMBRO'
                        
                        // Mapear roles: ANFITRION -> host, MIEMBRO -> guest
                        const roleNormalized = role === 'ANFITRION' ? 'host' : 'guest'

                        setConnectedUser(userId, {
                            id: userId,
                            name: userName,
                            profilePicture: userProfilePicture,
                            role: roleNormalized,
                            backendRole: role,
                            online: true,
                        })
                        console.log(`[CodeEditor] Usuario agregado: ${userName} (${roleNormalized})`)
                    }
                } catch (err) {
                    console.warn(`[CodeEditor] Error al obtener datos del usuario ${userId}:`, err.message)
                }
            }
        }

        const handleUserJoined = ({ userId }) => {
            console.log(`[CodeEditor] Usuario se unió: ${userId}`)
        }

        const handleUserLeft = ({ userId }) => {
            console.log(`[CodeEditor] Usuario se fue: ${userId}`)
            removeUserCursor(userId)
            removeConnectedUser(userId)
        }

        onCodeChangeSocket(handleCodeChanged)
        onCursorMoveSocket(handleCursorMoved)
        onConsoleOutputSocket(handleConsoleOutput)
        onRoomUsersUpdatedSocket(handleRoomUsersUpdated)
        onUserJoinedSocket(handleUserJoined)
        onUserLeftSocket(handleUserLeft)

        return () => {
            offCodeChangeSocket()
            offCursorMoveSocket()
            offConsoleOutputSocket()
            offRoomUsersUpdatedSocket()
            offUserJoinedSocket()
            offUserLeftSocket()
            disconnectSocket(roomId, currentFile.id, user.id)
            socketInitializedRef.current = false
            if (cursorEmitTimeoutRef.current) {
                clearTimeout(cursorEmitTimeoutRef.current)
            }
        }
    }, [currentFile?.id, roomId, user?.id, token, updateCode, updateUserCursor, removeUserCursor, setConnectedUser, removeConnectedUser, addConsoleOutput, addConsole, consoles, user])

    const handleCodeChange = (e) => {
        const newCode = e.target.value
        updateCode(newCode)

        // Emitir cambios de código por Socket.IO en tiempo real
        if (!isRemoteChangeRef.current && currentFile?.id && roomId) {
            emitCodeChangeSocket(roomId, currentFile.id, newCode, user?.id)
        }

        // Emitir cambio de cursor (con debounce)
        if (currentFile?.id && roomId && user?.id) {
            if (cursorEmitTimeoutRef.current) {
                clearTimeout(cursorEmitTimeoutRef.current)
            }
            cursorEmitTimeoutRef.current = setTimeout(() => {
                const textarea = editorRef.current
                if (textarea) {
                    const userName = user.name || user.firstName || 'Usuario'
                    emitCursorSocket(roomId, currentFile.id, textarea.selectionStart, user.id, userName)
                }
            }, 100) // Debounce de 100ms
        }
    }

    const handleKeyDown = (e) => {
        // Tab: insertar tabulación en lugar de navegar
        if (e.key === 'Tab') {
            e.preventDefault()
            const textarea = editorRef.current
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newCode = code.substring(0, start) + '\t' + code.substring(end)
            updateCode(newCode)
            
            // Emitir cambio por Socket.IO
            if (currentFile?.id && roomId) {
                emitCodeChangeSocket(roomId, currentFile.id, newCode, user?.id)
            }
            
            // Restaurar cursor después de la tabulación
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1
                // Emitir cambio de cursor
                if (currentFile?.id && roomId && user?.id) {
                    const userName = user.name || user.firstName || 'Usuario'
                    emitCursorSocket(roomId, currentFile.id, start + 1, user.id, userName)
                }
            }, 0)
        }
    }

    const handleSelectionChange = () => {
        // Emitir cambio de cursor cuando el usuario hace click o selecciona
        if (currentFile?.id && roomId && user?.id) {
            if (cursorEmitTimeoutRef.current) {
                clearTimeout(cursorEmitTimeoutRef.current)
            }
            cursorEmitTimeoutRef.current = setTimeout(() => {
                const textarea = editorRef.current
                if (textarea) {
                    const userName = user.name || user.firstName || 'Usuario'
                    emitCursorSocket(roomId, currentFile.id, textarea.selectionStart, user.id, userName)
                }
            }, 50) // Debounce de 50ms
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            {currentFile?.name || 'Sin archivo'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{language}</p>
                    </div>
                </div>
                {unsavedChanges && (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-error animate-pulse" />
                        <p className="text-xs text-slate-400">Sin guardar</p>
                    </div>
                )}
            </div>

            <div className="flex-1 relative">
                {!currentFile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-10">
                        <p className="text-slate-400 text-sm">Selecciona un archivo para empezar</p>
                    </div>
                )}
                
                <div className="relative w-full h-full">
                    {/* Cursores remotos */}
                    <RemoteCursors editorRef={editorRef} />
                    
                    {/* Editor */}
                    <textarea
                        ref={editorRef}
                        value={code}
                        onChange={handleCodeChange}
                        onKeyDown={handleKeyDown}
                        onMouseUp={handleSelectionChange}
                        onKeyUp={handleSelectionChange}
                        disabled={!currentFile}
                        className={`absolute inset-0 w-full h-full p-4 bg-slate-950 font-mono text-sm resize-none border-none focus:outline-none focus:ring-0 ${
                            currentFile
                                ? 'text-slate-100 cursor-text'
                                : 'text-slate-500 cursor-not-allowed bg-slate-950/70'
                        }`}
                        spellCheck="false"
                        style={{
                            fontFamily: "'Fira Code', 'Courier New', monospace",
                            lineHeight: '1.6',
                            tabSize: 4,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
