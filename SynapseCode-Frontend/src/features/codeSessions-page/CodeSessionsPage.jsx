import { useEffect } from "react"
import { Navbar } from "../../shared/components/layout/Navbar"
import { ParticleField } from "../auth/components/landing/ParticleField"

export const CodeSessionsPage = () => {
    useEffect(() => {
        const root = document.documentElement
        const update = (event) => {
            root.style.setProperty("--cursor-x", `${event.clientX}px`)
            root.style.setProperty("--cursor-y", `${event.clientY}px`)
        }

        window.addEventListener("pointermove", update, { passive: true })
        return () => window.removeEventListener("pointermove", update)
    }, [])

    return (
        <div className="min-h-screen synapse-page overflow-x-hidden flex flex-col bg-[linear-gradient(135deg,#050812_0%,#0a0e17_50%,#0d0a1a_100%)]">
            <ParticleField />

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] right-[15%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,0,255,0.08)_0%,transparent_70%)] blur-[40px]" />
                <div className="absolute bottom-[20%] left-[10%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.06)_0%,transparent_70%)] blur-[40px]" />
            </div>

            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
                <h1 className="text-4xl font-bold text-white mb-8">Te has unido a sala</h1>

                <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center p-10 bg-surface/10">
                    <div className="rounded-full bg-white/5 p-6 mb-4">
                        <div className="h-10 w-10 text-muted/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Code Sessions</h3>
                    <p className="mt-2 max-w-sm text-muted-foreground">
                        Te has unido a sala. Esta vista sera desarrollada proximamente.
                    </p>
                </div>
            </main>
        </div>
    )
}
