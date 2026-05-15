import { axiosRooms } from './api'

// Traer todos los lenguajes soportados
export const getSupportedLanguages = async () => {
    try {
        const { data } = await axiosRooms.get('/codeExecutions/languages')
        
        if (!data || !data.data) {
            console.warn('No data received from languages endpoint:', data)
            return []
        }
        
        // Si es un array de objetos con id y name, devolverlo
        if (Array.isArray(data.data)) {
            return data.data
        }
        
        console.warn('Unexpected data format:', data.data)
        return []
    } catch (error) {
        console.error('Error fetching languages:', error)
        return []
    }
}
