import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
    { label, error, icon: Icon, className = '', ...props },
    ref
    ) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <div className="relative">
            {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            )}
            <input
                ref={ref}
                className={clsx(
                    'w-full rounded-lg bg-surface-light border border-border px-4 py-3',
                    'text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'transition-all duration-200 hover:border-border-light',
                    Icon && 'pl-11',
                    error && 'border-error focus:border-error focus:ring-error/50',
                    className
                )}
                {...props}
            />
            </div>
            {error && (
                <p className="text-sm text-error">{error}</p>
            )}
        </div>
    )
})

export default Input
