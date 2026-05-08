import { clsx } from 'clsx'

const variants = {
    primary: 'bg-gradient-to-r from-primary to-accent text-background font-semibold hover:opacity-90',
    secondary: 'border border-primary text-primary hover:bg-primary/10',
    ghost: 'text-muted hover:text-foreground hover:bg-surface-light',
    danger: 'bg-error text-foreground hover:bg-error/90',
}

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    ...props
    }) {
    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    )
}
