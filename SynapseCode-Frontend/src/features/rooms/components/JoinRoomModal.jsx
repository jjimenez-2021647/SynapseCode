import { useState } from "react"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { joinRoomByCode } from "../../../shared/api"
import { toast } from "react-hot-toast"

export const JoinRoomModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [requiresPassword, setRequiresPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await joinRoomByCode(code, password)
            toast.success("Te has unido a la sala")
            onSuccess(data)
            onClose()
        } catch (err) {
            if (err.response?.status === 403 && !requiresPassword) {
                setRequiresPassword(true)
                toast.error("Esta sala es privada. Ingresa la contraseña.")
            } else {
                toast.error(err.response?.data?.message || "Error al unirse a la sala")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Unirse a Sala">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Ingresa el código de la sala (formato ABC-123) para unirte a tus compañeros.
                </p>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Código de Sala</label>
                    <Input 
                        required
                        placeholder="ABC-123"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="bg-surface-light border-border/50 font-mono text-center text-lg tracking-widest"
                    />
                </div>

                {requiresPassword && (
                    <div className="space-y-2 animate-fadeIn">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Contraseña</label>
                        <Input 
                            required
                            type="password"
                            placeholder="Contraseña de la sala"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-surface-light border-border/50"
                        />
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onClose}
                        className="flex-1"
                    >
                        CANCELAR
                    </Button>
                    <Button 
                        type="submit" 
                        loading={loading}
                        className="flex-1"
                    >
                        UNIRSE AHORA
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
