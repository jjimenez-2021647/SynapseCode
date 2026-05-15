import { axiosRooms } from "./api"

export const getRooms = async () => {
    return await axiosRooms.get("/rooms")
}

export const createRoom = async (roomData) => {
    return await axiosRooms.post("/rooms", roomData)
}

export const joinRoomByCode = async (code, password) => {
    return await axiosRooms.post("/room-participations", {
        roomCode: code,
        passwordRoom: password || undefined,
    })
}

export const joinRoom = async ({ roomCode, roomName, passwordRoom }) => {
    return await axiosRooms.post("/room-participations", {
        roomCode,
        roomName,
        passwordRoom: passwordRoom || undefined,
    })
}

export const getRoomById = async (id) => {
    return await axiosRooms.get(`/rooms/${id}`)
}

export const deleteRoom = async (id) => {
    return await axiosRooms.delete(`/rooms/${id}`)
}
