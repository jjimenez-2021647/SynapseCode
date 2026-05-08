import { useEffect, useRef } from 'react'

export const ParticleField = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animationId
        let particles = []

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createParticles = () => {
            particles = []
            const count = Math.floor((canvas.width * canvas.height) / 14000)
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.45,
                    speedY: (Math.random() - 0.5) * 0.45,
                    color: Math.random() > 0.5 ? '#00d9ff' : '#ff00ff',
                    opacity: Math.random() * 0.5 + 0.2,
                })
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach((p, i) => {
                p.x += p.speedX
                p.y += p.speedY

                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.globalAlpha = p.opacity
                ctx.fill()

                particles.slice(i + 1).forEach((p2) => {
                    const dx = p.x - p2.x
                    const dy = p.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 100) {
                        ctx.beginPath()
                        ctx.moveTo(p.x, p.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.strokeStyle = p.color
                        ctx.globalAlpha = (1 - dist / 100) * 0.18
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                })
            })

            ctx.globalAlpha = 1
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
            className="fixed inset-0 pointer-events-none z-0 opacity-65"
        />
    )
}
