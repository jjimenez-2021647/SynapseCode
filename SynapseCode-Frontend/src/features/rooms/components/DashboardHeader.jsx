import { Search, Plus, LogIn } from "lucide-react"
import Input from "../../../shared/components/ui/Input"
import Button from "../../../shared/components/ui/Button"

export const DashboardHeader = ({ onSearch, onCreateRoom, onJoinByCode }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b-2 border-primary/40 line-glow">
                <div>
                    <h1 className="text-3xl font-bold text-white lg:text-4xl">
                        Tus <span className="text-primary">Salas</span>
                    </h1>
                    <p className="mt-1 text-white">
                        Gestiona y únete a salas colaborativas
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={onJoinByCode}
                        className="h-11 border-2 border-primary/50 text-primary hover:border-primary/80 hover:bg-primary/10 px-6 element-glow rounded-lg transition-all"
                    >
                        <span className="mr-2 text-lg">→</span>
                        Unirse
                    </Button>
                    
                    <Button 
                        variant="secondary"
                        onClick={onCreateRoom}
                        className="h-11 border-2 border-primary/50 text-primary hover:border-primary/80 hover:bg-primary/10 px-6 element-glow rounded-lg transition-all"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Crear Sala
                    </Button>
                </div>
            </div>

            <div className="relative w-full element-glow rounded-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/60" />
                <Input 
                    placeholder="Buscar por nombre o código..." 
                    className="h-12 w-full pl-12 bg-surface/40 border-2 border-primary/40 focus:border-primary/80 rounded-xl transition-colors"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    )
}
