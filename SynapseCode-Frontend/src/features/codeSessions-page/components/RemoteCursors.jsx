import { useCodeSessionStore } from '../store/codeSessionStore'
import { useAuthStore } from '../../auth/store/authStore'

// Colores predefinidos para cada usuario
const CURSOR_COLORS = [
    '#FF6B6B', // Rojo
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul
    '#FFA07A', // Salmón
    '#98D8C8', // Verde agua
    '#F7DC6F', // Amarillo
    '#BB8FCE', // Púrpura
    '#85C1E2', // Azul claro
    '#F8B4D3', // Rosa
    '#A8D5BA', // Verde
]

export const RemoteCursors = ({ editorRef }) => {
    const activeCursors = useCodeSessionStore((state) => state.activeCursors)
    const currentUser = useCodeSessionStore((state) => state.currentUser)

    const getColorForUserId = (userId) => {
        // Usar hash del userId para obtener color consistente
        const hash = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
        return CURSOR_COLORS[hash % CURSOR_COLORS.length]
    }

    const calculateCursorPosition = (position) => {
        if (!editorRef?.current) return { top: 0, left: 0, visible: false }

        const textarea = editorRef.current
        const text = textarea.value.substring(0, position)
        const lines = text.split('\n')
        const row = lines.length - 1
        const col = lines[lines.length - 1].length

        // Usar computed styles del textarea para obtener valores exactos
        const style = window.getComputedStyle(textarea)
        const lineHeight = parseFloat(style.lineHeight)
        const padding = parseFloat(style.paddingLeft)
        const fontSize = parseFloat(style.fontSize)
        
        // Aproximación del ancho de un carácter en la fuente monoespaciada
        const charWidth = fontSize * 0.6

        const top = row * lineHeight + padding
        const left = col * charWidth + padding

        return { top, left, visible: true }
    }

    return (
        <>
            {Object.entries(activeCursors).map(([userId, cursor]) => {
                // No mostrar cursor del usuario actual
                if (userId === currentUser?.id) return null

                const { top, left, visible } = calculateCursorPosition(cursor.position)
                if (!visible) return null

                const color = getColorForUserId(userId)

                return (
                    <div key={userId} className="pointer-events-none absolute inset-0">
                        {/* Línea del cursor */}
                        <div
                            className="absolute w-0.5 h-5 animate-pulse"
                            style={{
                                top: `${top}px`,
                                left: `${left}px`,
                                backgroundColor: color,
                                zIndex: 10,
                            }}
                        />
                        
                        {/* Nombre del usuario */}
                        <div
                            className="absolute text-xs font-bold px-2 py-1 rounded text-white whitespace-nowrap"
                            style={{
                                top: `${Math.max(0, top - 24)}px`,
                                left: `${left}px`,
                                backgroundColor: color,
                                zIndex: 10,
                                boxShadow: `0 2px 8px ${color}33`,
                            }}
                        >
                            {cursor.userName}
                        </div>
                    </div>
                )
            })}
        </>
    )
}
