import { useState } from "react"
import { LogOut, User, Settings, Shield } from "lucide-react"
import { useAuthStore } from "../../../features/auth/store/authStore"

export const Navbar = () => {
    const { user, logout } = useAuthStore()
    const [showDropdown, setShowDropdown] = useState(false)

    return (
        <nav className="w-full border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur-xl z-[100]">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* LOGO */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L4 6V18L12 22L20 18V6L12 2Z" stroke="url(#logo_grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 6L8 8V16L12 18L16 16V8L12 6Z" fill="url(#logo_grad)" fillOpacity="0.3"/>
                            <defs>
                                <linearGradient id="logo_grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#00d9ff"/>
                                    <stop offset="1" stopColor="#ff00ff"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="text-2xl font-black tracking-tight italic">
                        <span className="text-primary drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">Synapse</span>
                        <span className="text-accent drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]">Code</span>
                    </span>
                </div>

                {/* PERFIL CON DROPDOWN */}
                <div className="flex items-center gap-4 relative">
                    <div 
                        className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] cursor-pointer hover:bg-success/20 transition-all"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-success">
                                {user?.username || user?.name || "Carlos M."}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-success/70 leading-none">
                                {user?.planType || "FREE"}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={`p-2 rounded-lg transition-all ${showDropdown ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}
                    >
                        <LogOut className="h-5 w-5" />
                    </button>

                    {/* DROPDOWN MENU */}
                    {showDropdown && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111827] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-2 z-20 animate-fadeInScale">
                                <div className="px-3 py-2 mb-1 border-b border-white/5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ajustes</p>
                                </div>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                                    <User className="h-4 w-4" />
                                    Mi Perfil
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                                    <Shield className="h-4 w-4" />
                                    Seguridad
                                </button>
                                <div className="my-1 border-t border-white/5" />
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-error hover:bg-error/10 transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
