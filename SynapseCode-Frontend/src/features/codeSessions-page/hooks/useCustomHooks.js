import { useEffect, useState } from 'react'

/**
 * Hook para manejar estado compartido entre usuarios en tiempo real
 * Simula la experiencia de Figma donde ves cambios al instante
 */
export const useSharedState = (key, initialValue) => {
    const [value, setValue] = useState(initialValue)
    const [isSharing, setIsSharing] = useState(false)

    // En una implementación real, aquí iría Socket.IO
    useEffect(() => {
        // Simular sincronización con otros usuarios
        setIsSharing(true)
    }, [key])

    return [value, setValue, isSharing]
}

/**
 * Hook para agregar mensajes del sistema
 */
export const useSystemMessage = (store) => {
    return (message, type = 'info', duration = 3000) => {
        const id = `sys-${Date.now()}`
        const systemMsg = {
            id,
            content: message,
            type,
            timestamp: new Date(),
            isSystem: true,
        }

        store.addMessage(systemMsg)

        if (duration) {
            setTimeout(() => {
                // Aquí se podría remover el mensaje del store
            }, duration)
        }
    }
}

/**
 * Hook para manejar debounce en edición colaborativa
 */
export const useCollaborativeEdit = (callback, delay = 500) => {
    const [timeoutId, setTimeoutId] = useState(null)

    const debouncedCallback = (data) => {
        if (timeoutId) clearTimeout(timeoutId)

        const newTimeoutId = setTimeout(() => {
            callback(data)
        }, delay)

        setTimeoutId(newTimeoutId)
    }

    return debouncedCallback
}

/**
 * Hook para detectar cambios de conexión
 */
export const useConnectionStatus = (socket) => {
    const [isConnected, setIsConnected] = useState(socket?.connected || false)
    const [connectionError, setConnectionError] = useState(null)

    useEffect(() => {
        if (!socket) return

        const onConnect = () => {
            setIsConnected(true)
            setConnectionError(null)
        }

        const onDisconnect = () => {
            setIsConnected(false)
        }

        const onError = (error) => {
            setConnectionError(error)
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        socket.on('error', onError)

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
            socket.off('error', onError)
        }
    }, [socket])

    return { isConnected, connectionError }
}

/**
 * Hook para manejo de permisos de edición
 */
export const useEditPermissions = (user, roomRole) => {
    const canEdit = roomRole === 'ADMIN' || roomRole === 'EDITOR'
    const canDelete = roomRole === 'ADMIN'
    const canInvite = roomRole === 'ADMIN'
    const canChangeSettings = roomRole === 'ADMIN'

    return {
        canEdit,
        canDelete,
        canInvite,
        canChangeSettings,
    }
}
