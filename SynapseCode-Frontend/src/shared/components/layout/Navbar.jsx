import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../../features/auth/store/authStore"

export const Navbar = () => {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate("/auth")
    }

    const handleProfileClick = () => {
        navigate("/profile-page")
    }

    return (
        <nav className="w-full border-b-2 border-primary/50 bg-[#0a0e17]/80 backdrop-blur-xl z-[100] shadow-[0_0_20px_rgba(0,217,255,0.25)] element-glow">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* LOGO */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-primary">
                        <span className="text-sm font-black text-white">&lt;/&gt;</span>
                    </div>
                    <span className="text-2xl font-black tracking-tight italic">
                        <span className="text-primary drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]">Synapse</span>
                        <span className="text-accent drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]">Code</span>
                    </span>
                </div>

                {/* PERFIL CON DROPDOWN */}
                <div className="flex items-center gap-4 relative">
                    <button 
                        onClick={handleProfileClick}
                        className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 hover:border-primary transition-all cursor-pointer shadow-[0_0_10px_rgba(0,217,255,0.2)]"
                    >
                        {user?.profilePicture ? (
                            <img 
                                src={user.profilePicture} 
                                alt={user?.username || user?.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                    {(user?.name || user?.username || "U")[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={handleLogout}
                        className={`p-2 rounded-lg transition-all text-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(0,217,255,0.5)]`}
                        title="Cerrar sesión"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                    {/* DROPDOWN MENU REMOVIDO */}
                </div>
            </div>
        </nav>
    )
}
