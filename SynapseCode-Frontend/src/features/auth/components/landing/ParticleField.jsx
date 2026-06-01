import { useEffect, useRef } from 'react'

const DEFAULT_COLORS = ['#00d9ff', '#ff00ff', '#00d9ff80', '#ff00ff80']

export const ParticleField = ({
    particleCount = 60,
    colors = DEFAULT_COLORS,
    connectionDistance = 100,
    trailAlpha = 0.1,
    opacity = 1,
    className = 'fixed inset-0 pointer-events-none z-0',
}) => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const reducedMotion = motionQuery.matches
        let animationId
        let particles = []

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createParticles = () => {
            const count = reducedMotion ? Math.min(12, particleCount) : particleCount
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: reducedMotion ? 0 : (Math.random() - 0.5) * 0.4,
                vy: reducedMotion ? 0 : (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)] || DEFAULT_COLORS[0],
            }))
        }

        const draw = () => {
            ctx.fillStyle = `rgba(10, 14, 23, ${trailAlpha})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            for (const p of particles) {
                p.x += p.vx
                p.y += p.vy

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < connectionDistance) {
                        const alpha = 0.12 * (1 - dist / connectionDistance)
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }
        }

        const animate = () => {
            draw()

            animationId = requestAnimationFrame(animate)
        }

        resize()
        createParticles()
        if (reducedMotion) {
            draw()
        } else {
            animate()
        }

        const handleResize = () => {
            resize()
            createParticles()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            if (animationId) cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
        }
    }, [colors, connectionDistance, particleCount, trailAlpha])

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ opacity }}
        />
    )
}
