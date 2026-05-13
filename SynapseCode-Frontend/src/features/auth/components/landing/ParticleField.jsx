import { useEffect, useRef } from 'react'

export const ParticleField = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animationId
        let particles = []

        const COLORS = ['#00d9ff', '#ff00ff', '#00d9ff80', '#ff00ff80']
        const PARTICLE_COUNT = 60
        const CONNECTION_DISTANCE = 100

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createParticles = () => {
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
            for (const p of particles) {
                p.x += p.vx
                p.y += p.vy

                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
            }

            // Draw connections between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < CONNECTION_DISTANCE) {
                        const alpha = 0.12 * (1 - dist / CONNECTION_DISTANCE)
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            animationId = requestAnimationFrame(animate)
        }

        resize()
        createParticles()
        animate()

        const handleResize = () => {
            resize()
            createParticles()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
        />
    )
}
