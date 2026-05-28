import { useEffect, useRef } from 'react'

<<<<<<< HEAD
export const ParticleField = () => {
=======
const DEFAULT_COLORS = ['#00d9ff', '#ff00ff', '#00d9ff80', '#ff00ff80']

export const ParticleField = ({
    particleCount = 60,
    colors = DEFAULT_COLORS,
    connectionDistance = 100,
    trailAlpha = 0.1,
    opacity = 1,
    className = 'fixed inset-0 pointer-events-none z-0',
}) => {
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
<<<<<<< HEAD
        let animationId
        let particles = []

        const COLORS = ['#00d9ff', '#ff00ff', '#00d9ff80', '#ff00ff80']
        const PARTICLE_COUNT = 60
        const CONNECTION_DISTANCE = 100

=======
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const reducedMotion = motionQuery.matches
        let animationId
        let particles = []

>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createParticles = () => {
<<<<<<< HEAD
            particles = Array.from({ length: PARTICLE_COUNT }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
            }))
        }

        const animate = () => {
            // Trail effect - semi-transparent overlay
            ctx.fillStyle = 'rgba(10, 14, 23, 0.1)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Update and draw particles
=======
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

>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
            for (const p of particles) {
                p.x += p.vx
                p.y += p.vy

<<<<<<< HEAD
                // Bounce off edges
=======
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
            }

<<<<<<< HEAD
            // Draw connections between nearby particles
=======
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

<<<<<<< HEAD
                    if (dist < CONNECTION_DISTANCE) {
                        const alpha = 0.12 * (1 - dist / CONNECTION_DISTANCE)
=======
                    if (dist < connectionDistance) {
                        const alpha = 0.12 * (1 - dist / connectionDistance)
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }
<<<<<<< HEAD
=======
        }

        const animate = () => {
            draw()
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e

            animationId = requestAnimationFrame(animate)
        }

        resize()
        createParticles()
<<<<<<< HEAD
        animate()
=======
        if (reducedMotion) {
            draw()
        } else {
            animate()
        }
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e

        const handleResize = () => {
            resize()
            createParticles()
        }
        window.addEventListener('resize', handleResize)

        return () => {
<<<<<<< HEAD
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
        }
    }, [])
=======
            if (animationId) cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
        }
    }, [colors, connectionDistance, particleCount, trailAlpha])
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e

    return (
        <canvas
            ref={canvasRef}
<<<<<<< HEAD
            className="fixed inset-0 pointer-events-none z-0"
=======
            className={className}
            style={{ opacity }}
>>>>>>> 51920ec32349ec74e311630f7954d68a3d8aae2e
        />
    )
}
