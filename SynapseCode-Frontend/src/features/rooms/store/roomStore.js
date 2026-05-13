import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getRooms as getRoomsRequest } from "../../../shared/api"

export const useRoomStore = create(
    persist(
        (set, get) => ({
            rooms: [],
            favorites: [],
            loading: false,
            error: null,

            fetchRooms: async () => {
                set({ loading: true, error: null })
                try {
                    const { data } = await getRoomsRequest()
                    set({ rooms: data || [], loading: false })
                } catch (err) {
                    set({ error: err.message, loading: false })
                }
            },

            toggleFavorite: (roomId) => {
                const favorites = get().favorites
                if (favorites.includes(roomId)) {
                    set({ favorites: favorites.filter(id => id !== roomId) })
                } else {
                    set({ favorites: [...favorites, roomId] })
                }
            },

            isFavorite: (roomId) => get().favorites.includes(roomId)
        }),
        {
            name: 'room-storage',
            partialize: (state) => ({ favorites: state.favorites })
        }
    )
)
