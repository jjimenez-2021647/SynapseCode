import { clsx } from 'clsx'

export default function Card({ children, className = '', hover = false, glow = false, ...props }) {
    return (
        <div
            className={clsx(
                'rounded-xl bg-surface border border-border p-6',
                hover && 'transition-all duration-300 hover:border-primary/50 hover:bg-surface-light cursor-pointer',
                glow && 'glow-primary',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
