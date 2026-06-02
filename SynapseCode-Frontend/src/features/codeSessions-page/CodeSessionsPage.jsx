import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/store/authStore'
import { useCodeSessionStore } from './store/codeSessionStore'
import { useCodeSessionSocket } from './hooks/useCodeSessionSocket'
import { roomAPI, filesAPI, foldersAPI } from './services/apiService'
import {
    CodeEditor,
    ConsolePanel,
    FileExplorer,
    IAChat,
    ChatPanel,
    Participants,
    ToolsSidebar,
    TopBar,
} from './components'
import { Navbar } from '../../shared/components/layout/Navbar'
import Spinner from '../../shared/components/ui/Spinner'
import './styles.css'

export const CodeSessionsPage = () => {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const activePanel = useCodeSessionStore((state) => state.activePanel)
    const setActivePanel = useCodeSessionStore((state) => state.setActivePanel)
    const setRoomInfo = useCodeSessionStore((state) => state.setRoomInfo)
    const setCurrentUser = useCodeSessionStore((state) => state.setCurrentUser)
    const setFiles = useCodeSessionStore((state) => state.setFiles)
    const setConnectedUsers = useCodeSessionStore((state) => state.setConnectedUsers)
    const addConsole = useCodeSessionStore((state) => state.addConsole)

    // Inicializar Socket.IO
    useCodeSessionSocket(roomId)

    // Inicialización
    useEffect(() => {
        const loadRoom = async () => {
            setIsLoading(true)
            setError(null)

            if (!roomId || !user) {
                setError('Sala o usuario inválido')
                setIsLoading(false)
                return
            }

            // Validar que roomId es un MongoDB ObjectId válido
            const mongoIdRegex = /^[a-f\d]{24}$/i
            if (!mongoIdRegex.test(roomId)) {
                setError('El ID de la sala no es válido')
                setIsLoading(false)
                return
            }

            try {
                // Validar que la sala existe en el backend
                const roomData = await roomAPI.getRoom(roomId)
                
                if (!roomData || !roomData.data) {
                    setError('No pudimos encontrar la sala. Verifica que el enlace sea correcto.')
                    setIsLoading(false)
                    return
                }

                const room = roomData.data

                // Cargar datos reales de la sala
                setRoomInfo({
                    roomId: room._id || roomId,
                    roomName: room.roomName || `Sala-${roomId.substring(0, 8)}`,
                    isPrivate: room.roomType === 'PRIVADA',
                    roomPassword: room.passwordRoom || null,
                    maxParticipants: room.maxUsers || 10,
                    roomLanguage: room.roomLanguage || 'MULTI',
                    allowedLanguages: Array.isArray(room.roomLanguage) 
                        ? room.roomLanguage 
                        : ['JAVASCRIPT', 'PYTHON', 'JAVA', 'CSHARP', 'HTML_CSS'],
                })

                setCurrentUser({
                    id: user.id,
                    name: user.name || user.username,
                    profilePicture: user.profilePicture,
                    online: true,
                })

                // Cargar archivos y carpetas desde el backend
                try {
                    const filesResponse = await filesAPI.getFilesByRoom(roomId)
                    const foldersResponse = await foldersAPI.getFoldersByRoom(roomId)

                    // Transformar archivos del backend al formato del store
                    const filesData = Array.isArray(filesResponse.data) 
                        ? filesResponse.data 
                        : (filesResponse.data?.files || [])
                    
                    const transformedFiles = filesData.map(file => ({
                        id: file._id,
                        name: `${file.fileName}.${file.fileExtension}`,
                        isFolder: false,
                        path: file.fileName,
                        language: file.language,
                        code: file.currentCode || '',
                        parentFolderId: file.parentFolderId || null,
                    }))

                    // Transformar carpetas del backend al formato del store
                    const foldersData = Array.isArray(foldersResponse.data) 
                        ? foldersResponse.data 
                        : (foldersResponse.data?.folders || [])
                    
                    const transformedFolders = foldersData.map(folder => ({
                        id: folder._id,
                        name: folder.folderName,
                        isFolder: true,
                        children: [],
                        parentFolderId: folder.parentFolderId || null,
                    }))

                    // Combinar archivos y carpetas
                    const allItems = [...transformedFiles, ...transformedFolders]
                    
                    // Organizar en jerarquía (carpetas con sus hijos)
                    const organizedFiles = []
                    const itemsById = {}
                    
                    allItems.forEach(item => {
                        itemsById[item.id] = item
                    })

                    allItems.forEach(item => {
                        if (!item.parentFolderId) {
                            organizedFiles.push(item)
                        }
                    })

                    // Agregar hijos a sus carpetas padres
                    allItems.forEach(item => {
                        if (item.parentFolderId && itemsById[item.parentFolderId]) {
                            if (!itemsById[item.parentFolderId].children) {
                                itemsById[item.parentFolderId].children = []
                            }
                            itemsById[item.parentFolderId].children.push(item)
                        }
                    })

                    setFiles(organizedFiles)
                } catch (err) {
                    console.warn('[CodeSessionsPage] No se pudieron cargar archivos (esperado si es la primera vez):', err.message)
                    // No es error crítico si no hay archivos
                    setFiles([])
                }

                // Cargar participantes de la sala
                try {
                    const participantsResponse = await roomAPI.getRoomParticipants(roomId)
                    console.log('[CodeSessionsPage] Respuesta de participantes:', participantsResponse)
                    
                    const participantsData = Array.isArray(participantsResponse.data)
                        ? participantsResponse.data
                        : (participantsResponse.data?.participations || [])
                    
                    console.log('[CodeSessionsPage] Datos transformados:', participantsData)

                    // Transformar participantes al formato del store
                    const connectedUsersObj = {}
                    participantsData.forEach((participation) => {
                        console.log('[CodeSessionsPage] Procesando participación:', participation)
                        
                        // Extraer datos del usuario - puede ser objeto o ID
                        const userId = participation.userId?._id || participation.userId?.id || participation.userId
                        const userName = participation.userId?.name || 
                                       participation.userId?.firstName || 
                                       participation.userId?.username || 
                                       'Usuario'
                        const userProfilePicture = participation.userId?.profilePicture || null
                        const role = participation.role || 'MIEMBRO'

                        console.log(`[CodeSessionsPage] Usuario: ${userName} (${userId}), Role: ${role}, ProfilePic: ${userProfilePicture}`)

                        // Mapear roles del backend: ANFITRION -> host, MIEMBRO -> guest
                        const roleNormalized = role === 'ANFITRION' ? 'host' : 'guest'

                        connectedUsersObj[userId] = {
                            id: userId,
                            name: userName,
                            profilePicture: userProfilePicture,
                            role: roleNormalized,
                            backendRole: role, // Guardar rol original para mostrar
                            online: true,
                            joinedAt: participation.createdAt,
                        }
                    })

                    console.log('[CodeSessionsPage] connectedUsersObj final:', connectedUsersObj)
                    setConnectedUsers(connectedUsersObj)
                } catch (err) {
                    console.error('[CodeSessionsPage] Error al cargar participantes:', err)
                    // No es error crítico
                    setConnectedUsers({})
                }

                setIsLoading(false)
            } catch (err) {
                console.error('[CodeSessionsPage] Error al cargar sala:', err)
                
                // Mostrar mensaje de error más amigable
                if (err.response?.status === 404) {
                    setError('La sala no existe o fue eliminada')
                } else if (err.response?.status === 401) {
                    setError('Tu sesión expiró. Por favor inicia sesión de nuevo')
                } else if (err.message === 'Network Error' || !err.response) {
                    setError('Sin conexión. Verifica tu internet')
                } else {
                    setError('Error al cargar la sala. Intenta de nuevo')
                }
                setIsLoading(false)
            }
        }

        loadRoom()
    }, [roomId, user, setRoomInfo, setCurrentUser, setFiles, setConnectedUsers, addConsole])

    // Manejo de cursor
    useEffect(() => {
        const root = document.documentElement
        const update = (event) => {
            root.style.setProperty('--cursor-x', `${event.clientX}px`)
            root.style.setProperty('--cursor-y', `${event.clientY}px`)
        }

        window.addEventListener('pointermove', update, { passive: true })
        return () => window.removeEventListener('pointermove', update)
    }, [])

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Por favor inicia sesión primero</p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <Spinner size="lg" />
                <p className="mt-4 text-slate-400">Cargando sesión de código...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <p className="text-error text-lg font-bold">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Volver al Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="h-screen synapse-page overflow-hidden flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Navbar />

            <TopBar />

            <div className="flex-1 flex gap-0 overflow-hidden">
                {/* Panel Izquierdo - 5 Secciones */}
                <div className="w-64 border-r border-white/10 flex flex-col overflow-hidden">
                    <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
                        {[
                            { id: 'files', icon: '📁', label: 'Archivos' },
                            { id: 'participants', icon: '👥', label: 'Participantes' },
                            { id: 'chat', icon: '💬', label: 'Chat' },
                            { id: 'ia-chat', icon: '🤖', label: 'IA' },
                            { id: 'tools', icon: '🔧', label: 'Herramientas' },
                        ].map((panel) => (
                            <button
                                key={panel.id}
                                onClick={() => setActivePanel(panel.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                                    activePanel === panel.id
                                        ? 'bg-primary/20 text-primary border border-primary/40'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-primary/10'
                                }`}
                                title={panel.label}
                            >
                                <span>{panel.icon}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activePanel === 'files' && <FileExplorer />}
                        {activePanel === 'participants' && <Participants />}
                        {activePanel === 'chat' && <ChatPanel />}
                        {activePanel === 'ia-chat' && <IAChat />}
                        {activePanel === 'tools' && <ToolsSidebar />}
                    </div>
                </div>

                {/* Panel Central/Derecho - Editor arriba, Consolas abajo */}
                <div className="flex-1 flex flex-col overflow-hidden gap-0">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden border-b border-white/10">
                        <CodeEditor />
                    </div>

                    {/* Consolas abajo */}
                    <div className="h-64 flex flex-col overflow-hidden">
                        <ConsolePanel />
                    </div>
                </div>
            </div>
        </div>
    )
}
