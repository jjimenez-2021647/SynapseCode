import { axiosRooms, axiosExecution } from '../../../shared/api/api.js'

// CodeSessions Service
export const codeSessionsAPI = {
    async createSession(data) {
        const response = await axiosRooms.post(`/code-sessions`, data)
        return response.data
    },

    async updateSession(sessionId, data) {
        const response = await axiosRooms.put(`/code-sessions/${sessionId}`, data)
        return response.data
    },

    async getSessionById(sessionId) {
        const response = await axiosRooms.get(`/code-sessions/${sessionId}`)
        return response.data
    },

    async getSessionsByRoom(roomId) {
        const response = await axiosRooms.get(`/code-sessions/room/${roomId}`)
        return response.data
    },

    async getLatestSession(fileId) {
        const response = await axiosRooms.get(`/code-sessions/file/${fileId}/latest`)
        return response.data
    },

    async getSessionVersion(fileId, version) {
        const response = await axiosRooms.get(`/code-sessions/file/${fileId}/version/${version}`)
        return response.data
    },

    async deleteSession(sessionId) {
        const response = await axiosRooms.delete(`/code-sessions/${sessionId}`)
        return response.data
    },
}

// Code Execution Console
export const codeExecutionConsoleAPI = {
    async createConsole(data) {
        const response = await axiosRooms.post(`/code-execution-console`, data)
        return response.data
    },

    async getConsole(consoleId) {
        const response = await axiosRooms.get(`/code-execution-console/${consoleId}`)
        return response.data
    },

    async updateConsole(consoleId, data) {
        const response = await axiosRooms.put(`/code-execution-console/${consoleId}`, data)
        return response.data
    },

    async addConsoleOutput(consoleId, output) {
        const response = await axiosRooms.post(`/code-execution-console/${consoleId}/output`, {
            output,
        })
        return response.data
    },

    async clearConsole(consoleId) {
        const response = await axiosRooms.delete(`/code-execution-console/${consoleId}/output`)
        return response.data
    },
}

// Room Service
export const roomAPI = {
    async getRoom(roomId) {
        const response = await axiosRooms.get(`/rooms/${roomId}`)
        return response.data
    },

    async getRoomFiles(roomId) {
        const response = await axiosRooms.get(`/rooms/${roomId}/files`)
        return response.data
    },

    async getRoomParticipants(roomId) {
        const response = await axiosRooms.get(`/room-participations/room/${roomId}`)
        return response.data
    },

    async leaveRoom(roomId) {
        const response = await axiosRooms.post(`/rooms/${roomId}/leave`)
        return response.data
    },
}

// Chat Service
export const chatAPI = {
    async sendMessage(data) {
        const response = await axiosRooms.post(`/messages`, data)
        return response.data
    },

    async getRoomMessages(roomId) {
        const response = await axiosRooms.get(`/messages/room/${roomId}`)
        return response.data
    },

    async getFileChat(fileId) {
        const response = await axiosRooms.get(`/messages/file/${fileId}`)
        return response.data
    },
}

// Code Execution Service
export const executionAPI = {
    async executeCode(data) {
        const response = await axiosExecution.post(`/codeExecutions/run`, data)
        return response.data
    },

    async getExecutionHistory(roomId) {
        const response = await axiosExecution.get(`/codeExecutions/room/${roomId}`)
        return response.data
    },
}

// Git Service
export const gitAPI = {
    async commitCode(data) {
        const response = await axiosRooms.post(`/git/commit`, data)
        return response.data
    },

    async getHistory(fileId) {
        const response = await axiosRooms.get(`/git/history/${fileId}`)
        return response.data
    },

    async revertToVersion(sessionId) {
        const response = await axiosRooms.post(`/git/revert/${sessionId}`)
        return response.data
    },
}

// IA Chat Service
export const iaChatAPI = {
    async sendIAMessage(data) {
        const response = await axiosRooms.post(`/chat/ia`, data)
        return response.data
    },

    async getIAChat(fileId) {
        const response = await axiosRooms.get(`/chat/ia/file/${fileId}`)
        return response.data
    },

    async explainCode(data) {
        const response = await axiosRooms.post(`/chat/explain`, data)
        return response.data
    },
}

// Files Service
export const filesAPI = {
    async createFile(data) {
        const response = await axiosRooms.post(`/files`, data)
        return response.data
    },

    async getFilesByRoom(roomId) {
        const response = await axiosRooms.get(`/files/room/${roomId}`)
        return response.data
    },

    async getFileTree(roomId) {
        const response = await axiosRooms.get(`/files/room/${roomId}/tree`)
        return response.data
    },

    async updateFile(fileId, data) {
        const response = await axiosRooms.put(`/files/${fileId}`, data)
        return response.data
    },

    async updateFileContent(fileId, content) {
        const response = await axiosRooms.put(`/files/${fileId}/content`, { currentCode: content })
        return response.data
    },

    async deleteFile(fileId) {
        const response = await axiosRooms.delete(`/files/${fileId}`)
        return response.data
    },

    async renameFile(fileId, newName) {
        const response = await axiosRooms.put(`/files/${fileId}/rename`, {
            fileName: newName,
        })
        return response.data
    },

    async moveFile(fileId, newParentFolderId) {
        const response = await axiosRooms.put(`/files/${fileId}/move`, {
            parentFolderId: newParentFolderId || null,
        })
        return response.data
    },
}

// Folders Service
export const foldersAPI = {
    async createFolder(data) {
        const response = await axiosRooms.post(`/folders`, data)
        return response.data
    },

    async getFoldersByRoom(roomId) {
        const response = await axiosRooms.get(`/folders/room/${roomId}`)
        return response.data
    },

    async getRoomTree(roomId) {
        const response = await axiosRooms.get(`/folders/room/${roomId}/tree`)
        return response.data
    },

    async deleteFolder(folderId) {
        const response = await axiosRooms.delete(`/folders/${folderId}`)
        return response.data
    },

    async renameFolder(folderId, newName) {
        const response = await axiosRooms.put(`/folders/${folderId}/rename`, {
            folderName: newName,
        })
        return response.data
    },

    async moveFolder(folderId, newParentFolderId) {
        const response = await axiosRooms.put(`/folders/${folderId}/move`, {
            parentFolderId: newParentFolderId || null,
        })
        return response.data
    },
}
