import io from 'socket.io-client'

let socket = null

export const initializeSocket = (roomId, fileId, userId, token) => {
    if (socket?.connected) {
        return socket
    }

    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3007'

    socket = io(SOCKET_SERVER_URL, {
        auth: {
            token,
            roomId,
            fileId,
            userId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
        console.log('[Socket.IO] Conectado:', socket.id)
        // Unirse a la sala del archivo
        socket.emit('join-room', roomId, fileId, userId)
    })

    socket.on('disconnect', () => {
        console.log('[Socket.IO] Desconectado')
    })

    socket.on('error', (error) => {
        console.error('[Socket.IO] Error:', error)
    })

    return socket
}

export const disconnectSocket = (roomId, fileId, userId) => {
    if (socket?.connected) {
        socket.emit('leave-room', roomId, fileId, userId)
        socket.disconnect()
        socket = null
    }
}

export const getSocket = () => socket

// ─── Code collaboration (NEW) ───────────────────────────────────────────────
export const emitCodeChangeSocket = (roomId, fileId, code, userId) => {
    if (socket?.connected) {
        socket.emit('code-change', {
            roomId,
            fileId,
            code,
            userId,
            timestamp: Date.now(),
        })
    }
}

export const onCodeChangeSocket = (callback) => {
    if (socket) {
        socket.on('code-changed', callback)
    }
}

export const offCodeChangeSocket = () => {
    if (socket) {
        socket.off('code-changed')
    }
}

export const onUserJoinedSocket = (callback) => {
    if (socket) {
        socket.on('user-joined', callback)
    }
}

export const offUserJoinedSocket = () => {
    if (socket) {
        socket.off('user-joined')
    }
}

export const onUserLeftSocket = (callback) => {
    if (socket) {
        socket.on('user-left', callback)
    }
}

export const offUserLeftSocket = () => {
    if (socket) {
        socket.off('user-left')
    }
}

// ─── Cursor presence (NEW) ───────────────────────────────────────────────────
export const emitCursorSocket = (roomId, fileId, position, userId, userName) => {
    if (socket?.connected) {
        socket.emit('cursor-move', {
            roomId,
            fileId,
            position,
            userId,
            userName,
            timestamp: Date.now(),
        })
    }
}

export const onCursorMoveSocket = (callback) => {
    if (socket) {
        socket.on('cursor-moved', callback)
    }
}

export const offCursorMoveSocket = () => {
    if (socket) {
        socket.off('cursor-moved')
    }
}

// ─── Console output sharing (NEW) ──────────────────────────────────────────
export const emitConsoleOutputSocket = (roomId, fileId, consoleId, output, type = 'output') => {
    if (socket?.connected) {
        socket.emit('console-output', {
            roomId,
            fileId,
            consoleId,
            output,
            type,
            timestamp: Date.now(),
        })
    }
}

export const onConsoleOutputSocket = (callback) => {
    if (socket) {
        socket.on('console-output-shared', callback)
    }
}

export const offConsoleOutputSocket = () => {
    if (socket) {
        socket.off('console-output-shared')
    }
}

// ─── Users/Participants sync (NEW) ────────────────────────────────────────
export const onRoomUsersUpdatedSocket = (callback) => {
    if (socket) {
        socket.on('room-users-updated', callback)
    }
}

export const offRoomUsersUpdatedSocket = () => {
    if (socket) {
        socket.off('room-users-updated')
    }
}

// ─── Código existente (mantener compatibilidad) ─────────────────────────────

// Cursor events
export const emitCursorMove = (fileId, position) => {
    if (socket?.connected) {
        socket.emit('cursor:move', {
            fileId,
            position,
            timestamp: Date.now(),
        })
    }
}

export const onCursorMove = (callback) => {
    if (socket) {
        socket.on('cursor:move', callback)
    }
}

// User presence events
export const emitUserJoin = (userData) => {
    if (socket?.connected) {
        socket.emit('user:join', userData)
    }
}

export const onUserJoin = (callback) => {
    if (socket) {
        socket.on('user:join', callback)
    }
}

export const onUserLeave = (callback) => {
    if (socket) {
        socket.on('user:leave', callback)
    }
}

export const emitUserLeave = () => {
    if (socket?.connected) {
        socket.emit('user:leave')
    }
}

// Chat events
export const emitChatMessage = (message) => {
    if (socket?.connected) {
        socket.emit('chat:message', {
            ...message,
            timestamp: Date.now(),
        })
    }
}

export const onChatMessage = (callback) => {
    if (socket) {
        socket.on('chat:message', callback)
    }
}

// File events
export const emitFileCreate = (file) => {
    if (socket?.connected) {
        socket.emit('file:create', file)
    }
}

export const emitFileUpdate = (file) => {
    if (socket?.connected) {
        socket.emit('file:update', file)
    }
}

export const emitFileDelete = (fileId) => {
    if (socket?.connected) {
        socket.emit('file:delete', { fileId })
    }
}

export const onFileCreate = (callback) => {
    if (socket) {
        socket.on('file:create', callback)
    }
}

export const onFileUpdate = (callback) => {
    if (socket) {
        socket.on('file:update', callback)
    }
}

export const onFileDelete = (callback) => {
    if (socket) {
        socket.on('file:delete', callback)
    }
}

// Console events
export const emitConsoleOutput = (output) => {
    if (socket?.connected) {
        socket.emit('console:output', output)
    }
}

export const onConsoleOutput = (callback) => {
    if (socket) {
        socket.on('console:output', callback)
    }
}

// AI Chat events
export const emitAIMessage = (message) => {
    if (socket?.connected) {
        socket.emit('ai:message', {
            ...message,
            timestamp: Date.now(),
        })
    }
}

export const onAIMessage = (callback) => {
    if (socket) {
        socket.on('ai:message', callback)
    }
}

export const onAIResponse = (callback) => {
    if (socket) {
        socket.on('ai:response', callback)
    }
}

// Remove listeners
export const offCodeChange = (callback) => {
    if (socket) {
        socket.off('code:change', callback)
    }
}

export const offChatMessage = (callback) => {
    if (socket) {
        socket.off('chat:message', callback)
    }
}

export const offAIMessage = (callback) => {
    if (socket) {
        socket.off('ai:message', callback)
    }
}

// Folder events
export const emitFolderCreate = (folder) => {
    if (socket?.connected) {
        socket.emit('folder:create', folder)
    }
}

export const emitFolderUpdate = (folder) => {
    if (socket?.connected) {
        socket.emit('folder:update', folder)
    }
}

export const emitFolderDelete = (folderId) => {
    if (socket?.connected) {
        socket.emit('folder:delete', { folderId })
    }
}

export const onFolderCreate = (callback) => {
    if (socket) {
        socket.on('folder:create', callback)
    }
}

export const onFolderUpdate = (callback) => {
    if (socket) {
        socket.on('folder:update', callback)
    }
}

export const onFolderDelete = (callback) => {
    if (socket) {
        socket.on('folder:delete', callback)
    }
}
