import { useEffect } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { initializeSocket } from '../services/socketService'

export const useCodeSessionSocket = (roomId) => {
    const user = useAuthStore((state) => state.user)
    const token = useAuthStore((state) => state.token)

    // Socket.IO se inicializa en CodeEditor cuando tenemos el currentFile
    // Esta función se mantiene aquí por compatibilidad
    useEffect(() => {
        // El hook ya no hace nada, todo se maneja en CodeEditor
    }, [roomId, token, user?.id])
}
