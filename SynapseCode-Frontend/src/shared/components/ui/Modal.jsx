import { X } from "lucide-react"
import { useEffect } from "react"
import { createPortal } from "react-dom"

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fadeIn" 
                onClick={onClose}
            />
            <div className="synapse-surface relative w-full max-w-lg rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-6 shadow-2xl animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}
