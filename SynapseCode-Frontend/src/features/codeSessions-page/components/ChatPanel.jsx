import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { emitChatMessage } from '../services/socketService'

export const ChatPanel = () => {
    const [messageText, setMessageText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const messages = useCodeSessionStore((state) => state.messages)
    const currentUser = useCodeSessionStore((state) => state.currentUser)
    const addMessage = useCodeSessionStore((state) => state.addMessage)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!messageText.trim()) return

        setIsLoading(true)
        const newMessage = {
            id: `msg-${Date.now()}`,
            userId: currentUser?.id,
            userName: currentUser?.name,
            avatar: currentUser?.profilePicture,
            content: messageText,
            timestamp: new Date(),
            type: 'text',
        }

        addMessage(newMessage)
        emitChatMessage(newMessage)
        setMessageText('')
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40">
            <div className="p-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted">
                        <p>Sin mensajes aún</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex gap-2 group">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-xs font-bold text-white">
                                    {msg.userName?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-200">{msg.userName}</p>
                                <p className="text-sm text-slate-300 break-words">{msg.content}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {msg.timestamp?.toLocaleTimeString() || 'ahora'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10 space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                            }
                        }}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-3 py-2 bg-slate-900/50 border border-primary/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 transition-colors"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !messageText.trim()}
                        className="p-2 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Send className="h-4 w-4 text-primary" />
                    </button>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-primary/10 rounded transition-colors">
                    <Paperclip className="h-3 w-3" />
                    Compartir archivo
                </button>
            </div>
        </div>
    )
}
