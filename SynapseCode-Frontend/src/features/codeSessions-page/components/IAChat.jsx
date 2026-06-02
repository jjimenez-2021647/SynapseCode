import { useState, useRef, useEffect } from 'react'
import { Send, Loader } from 'lucide-react'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { emitAIMessage } from '../services/socketService'

export const IAChat = () => {
    const [messageText, setMessageText] = useState('')
    const messagesEndRef = useRef(null)

    const aiMessages = useCodeSessionStore((state) => state.aiMessages)
    const aiWaitingResponse = useCodeSessionStore((state) => state.aiWaitingResponse)
    const currentUser = useCodeSessionStore((state) => state.currentUser)
    const addAIMessage = useCodeSessionStore((state) => state.addAIMessage)
    const setAIWaitingResponse = useCodeSessionStore((state) => state.setAIWaitingResponse)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [aiMessages])

    const handleSendMessage = async () => {
        if (!messageText.trim() || aiWaitingResponse) return

        setAIWaitingResponse(true)

        const userMessage = {
            id: `ai-msg-${Date.now()}`,
            userId: currentUser?.id,
            userName: currentUser?.name,
            content: messageText,
            role: 'user',
            timestamp: new Date(),
        }

        addAIMessage(userMessage)
        emitAIMessage(userMessage)
        setMessageText('')
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40">
            <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">SynapseAI</h3>
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {aiMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted space-y-2">
                        <p className="font-bold">¿Necesitas ayuda?</p>
                        <p>Pregúntale a SynapseAI sobre:</p>
                        <ul className="text-slate-400 mt-3 space-y-1">
                            <li>• Explicaciones de código</li>
                            <li>• Sugerencias de mejora</li>
                            <li>• Debugging</li>
                            <li>• Traducción de código</li>
                        </ul>
                    </div>
                ) : (
                    <>
                        {aiMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.role === 'assistant' ? 'items-start' : 'justify-end'}`}
                            >
                                {msg.role === 'assistant' ? (
                                    <>
                                        <div className="flex-shrink-0">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xs font-bold">
                                                AI
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-accent/10 border border-accent/30 rounded-lg p-2 text-sm text-slate-200">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="max-w-xs bg-primary/20 border border-primary/30 rounded-lg p-2 text-sm text-slate-200">
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        ))}
                        {aiWaitingResponse && (
                            <div className="flex gap-2">
                                <div className="flex-shrink-0">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xs font-bold animate-pulse">
                                        AI
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Loader className="h-3 w-3 animate-spin" />
                                    Pensando...
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10">
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
                        placeholder="Pregúntale a la IA..."
                        className="flex-1 px-3 py-2 bg-slate-900/50 border border-accent/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/60 transition-colors"
                        disabled={aiWaitingResponse}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={aiWaitingResponse || !messageText.trim()}
                        className="p-2 bg-accent/20 hover:bg-accent/30 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Send className="h-4 w-4 text-accent" />
                    </button>
                </div>
            </div>
        </div>
    )
}
