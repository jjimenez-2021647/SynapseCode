import { Plus } from "lucide-react"

export const CreateRoomCard = ({ onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center rounded-2xl bg-[#0d1320]/80 border-2 border-primary/60 p-6 transition-all duration-300 hover:border-primary/80 hover:shadow-[0_0_40px_rgba(0,217,255,0.4),inset_0_0_20px_rgba(0,217,255,0.1)] shadow-[0_0_25px_rgba(0,217,255,0.25)] cursor-pointer room-card-glow"
        >
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary/60 group-hover:border-primary/80 group-hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all duration-300">
                    <Plus className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-[14px] font-bold text-white group-hover:text-primary transition-colors">
                    Crear sala
                </h3>
            </div>
        </button>
    )
}
