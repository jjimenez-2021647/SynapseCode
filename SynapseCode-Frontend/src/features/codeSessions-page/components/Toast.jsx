import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

export const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const styleConfig = {
        error: {
            bg: 'bg-slate-900/95',
            border: 'border-red-500/40',
            text: 'text-red-100',
            icon: 'text-red-400',
            button: 'hover:text-red-200',
            accent: 'from-red-900/20 to-transparent'
        },
        success: {
            bg: 'bg-slate-900/95',
            border: 'border-emerald-500/40',
            text: 'text-emerald-100',
            icon: 'text-emerald-400',
            button: 'hover:text-emerald-200',
            accent: 'from-emerald-900/20 to-transparent'
        }
    }

    const config = styleConfig[type]
    const Icon = type === 'error' ? AlertCircle : CheckCircle

    return (
        <div className={`fixed bottom-4 right-4 ${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-lg shadow-2xl flex items-start gap-3 max-w-sm z-50 backdrop-blur-sm border-l-4 ${type === 'error' ? 'border-l-red-500' : 'border-l-emerald-500'} animate-slideIn`}>
            <Icon className={`h-5 w-5 ${config.icon} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button
                onClick={onClose}
                className={`${config.text} ${config.button} transition-colors flex-shrink-0`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export const useToast = () => {
    const [toast, setToast] = useState(null)

    const showError = (message, duration = 4000) => {
        setToast({ message, type: 'error', duration })
    }

    const showSuccess = (message, duration = 3000) => {
        setToast({ message, type: 'success', duration })
    }

    const closeToast = () => {
        setToast(null)
    }

    return {
        toast,
        showError,
        showSuccess,
        closeToast,
        ToastComponent: toast ? (
            <Toast {...toast} onClose={closeToast} />
        ) : null,
    }
}
