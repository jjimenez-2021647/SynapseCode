import { Search, Plus, LogIn } from "lucide-react"
import Input from "../../../shared/components/ui/Input"
import Button from "../../../shared/components/ui/Button"

export const DashboardHeader = ({ onSearch, onCreateRoom, onJoinByCode }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white lg:text-4xl">
                        Tus <span className="text-primary">Salas</span>
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Gestiona y únete a salas colaborativas
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={onJoinByCode}
                        className="h-11 border-primary/40 text-primary hover:bg-primary/5 px-6"
                    >
                        <span className="mr-2 text-lg">#</span>
                        Unirse
                    </Button>
                    
                    <Button 
                        onClick={onCreateRoom}
                        className="h-11 bg-gradient-to-r from-primary to-accent text-background font-bold px-6 shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_25px_rgba(0,217,255,0.4)]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Crear Sala
                    </Button>
                </div>
            </div>

            <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nombre o código..." 
                    className="h-12 w-full pl-12 bg-surface/40 border-border/40 focus:border-primary/40 rounded-xl"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    )
}
