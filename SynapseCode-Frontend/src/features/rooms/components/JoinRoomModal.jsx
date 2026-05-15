import { useEffect, useState } from "react"
import Modal from "../../../shared/components/ui/Modal"
import Button from "../../../shared/components/ui/Button"
import Input from "../../../shared/components/ui/Input"
import { joinRoom, joinRoomByCode } from "../../../shared/api"
import { toast } from "react-hot-toast"

export const JoinRoomModal = ({ isOpen, onClose, onSuccess, room = null }) => {
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [requiresPassword, setRequiresPassword] = useState(false)

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
                        <Input
                            required
                            type="password"
                            placeholder="Contrasena de la sala"
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
