import { clsx } from 'clsx'

export default function Card({ children, className = '', hover = false, glow = false, ...props }) {
    return (
        <div
            className={clsx(
                'rounded-xl bg-surface border border-border p-6 shadow-lg shadow-black/10',
                hover && 'interactive-card cursor-pointer hover:border-primary/50 hover:bg-surface-light',
                glow && 'glow-primary ring-1 ring-primary/10',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
