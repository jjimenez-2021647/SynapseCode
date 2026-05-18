import { useEffect, useState } from "react"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { joinRoom, joinRoomByCode } from "../../../shared/api"
import { toast } from "react-hot-toast"
import { Eye, EyeOff } from "lucide-react"

export const JoinRoomModal = ({ isOpen, onClose, onSuccess, room = null }) => {
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [requiresPassword, setRequiresPassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        setCode(room?.roomCode || "")
        setPassword("")
        setRequiresPassword(Boolean(room && room.roomType === "PRIVADA"))
    }, [isOpen, room])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = room
                ? await joinRoom({
                    roomCode: room.roomCode,
                    roomName: room.roomName,
                    passwordRoom: password,
                })
                : await joinRoomByCode(code, password)

            const joinedRoom = response?.data?.data?.room || room || {
                _id: response?.data?.data?.participation?.roomId || response?.data?.data?.roomId,
            }
            toast.success("Te has unido a la sala")
            onSuccess(joinedRoom)
            onClose()
        } catch (err) {
            const errorCode = err.response?.data?.error

            if (errorCode === "PASSWORD_REQUIRED" && !requiresPassword) {
                setRequiresPassword(true)
                toast.error("Esta sala es privada. Ingresa la contrasena.")
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
                    Ingresa el codigo de la sala para unirte a tus companeros.
                </p>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Codigo de Sala</label>
                    <Input
                        required
                        placeholder="ABC-123"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="bg-surface-light border-border/50 font-mono text-center text-lg tracking-widest"
                        disabled={Boolean(room)}
                    />
                </div>

                {requiresPassword && (
                    <div className="space-y-2 animate-fadeIn">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Contrasena</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="Contrasena de la sala"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-surface-light border border-border/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
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
