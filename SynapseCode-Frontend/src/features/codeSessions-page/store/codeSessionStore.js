import { create } from 'zustand'

export const useCodeSessionStore = create((set, get) => ({
    // Room/Session info
    roomId: null,
    sessionId: null,
    roomName: '',
    roomPassword: '',
    isPrivate: false,
    maxParticipants: 5,
    roomLanguage: null, // 'JAVASCRIPT', 'PYTHON', 'MULTI', etc.
    allowedLanguages: ['JAVASCRIPT', 'PYTHON', 'JAVA', 'CSHARP', 'HTML_CSS'], // Lenguajes permitidos

    // User info
    currentUser: null,
    participants: [],
    connectedUsers: {}, // { userId: { id, name, role, online } } - usuarios activos en tiempo real

    // Code state
    currentFile: null,
    files: [],
    fileStructure: [],
    code: '',
    language: 'javascript',
    unsavedChanges: false,

    // UI state
    activePanel: 'files', // 'files', 'participants', 'chat', 'ia-chat', 'tools'
    activeToolTab: 'sala', // 'versiones', 'explicacion', 'ejecuciones', 'sala'
    consoles: [],
    activeConsole: 0,

    // Chat state
    messages: [],
    aiMessages: [],
    aiWaitingResponse: false,

    // Version/History
    versions: [],
    selectedVersion: null,

    // Collaborative editing - User cursors
    activeCursors: {}, // { userId: { position, name, color } }
    activeUsers: {}, // { userId: { name, id, lastSeen } }

    // Loading states
    isLoading: false,
    isSaving: false,

    // Actions
    setRoomInfo: (roomInfo) =>
        set((state) => ({
            ...state,
            ...roomInfo,
        })),

    setCurrentUser: (user) => set({ currentUser: user }),

    addParticipant: (participant) =>
        set((state) => ({
            participants: [...state.participants.filter((p) => p.id !== participant.id), participant],
        })),

    removeParticipant: (participantId) =>
        set((state) => ({
            participants: state.participants.filter((p) => p.id !== participantId),
        })),

    updateCode: (newCode) =>
        set({
            code: newCode,
            unsavedChanges: true,
        }),

    setCurrentFile: (file) =>
        set({
            currentFile: file,
            code: file?.code || '',
            language: file?.language || 'javascript',
        }),

    addFile: (file) =>
        set((state) => ({
            files: [...state.files, file],
        })),

    addFolder: (folder) =>
        set((state) => ({
            files: [...state.files, folder],
        })),

    updateFile: (fileId, updates) =>
        set((state) => ({
            files: state.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
        })),

    deleteFile: (fileId) =>
        set((state) => ({
            files: state.files.filter((f) => f.id !== fileId),
        })),

    setFiles: (files) => set({ files }),

    setFileStructure: (structure) => set({ fileStructure: structure }),

    setActivePanel: (panel) => set({ activePanel: panel }),

    setActiveToolTab: (tab) => set({ activeToolTab: tab }),

    addMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, message],
        })),

    addAIMessage: (message) =>
        set((state) => ({
            aiMessages: [...state.aiMessages, message],
        })),

    setAIWaitingResponse: (waiting) => set({ aiWaitingResponse: waiting }),

    addConsole: (consoleId, fileId = null) =>
        set((state) => ({
            consoles: [...state.consoles, { id: consoleId, fileId, output: [] }],
        })),

    addConsoleOutput: (consoleId, output) =>
        set((state) => ({
            consoles: state.consoles.map((c) =>
                c.id === consoleId ? { ...c, output: [...c.output, output] } : c
            ),
        })),

    clearConsoleOutput: (consoleId) =>
        set((state) => ({
            consoles: state.consoles.map((c) => (c.id === consoleId ? { ...c, output: [] } : c)),
        })),

    getConsoleByFileId: (fileId) => {
        const state = useCodeSessionStore.getState()
        return state.consoles.find((c) => c.fileId === fileId)
    },

    setActiveConsole: (consoleId) => set({ activeConsole: consoleId }),

    addVersion: (version) =>
        set((state) => ({
            versions: [...state.versions, version].sort((a, b) => b.version - a.version),
        })),

    setVersions: (versions) => set({ versions }),

    selectVersion: (version) => set({ selectedVersion: version }),

    setSaving: (saving) => set({ isSaving: saving }),

    setUnsavedChanges: (unsaved) => set({ unsavedChanges: unsaved }),

    updateUserCursor: (userId, position, userName, color) =>
        set((state) => ({
            activeCursors: {
                ...state.activeCursors,
                [userId]: { position, userName, color }
            },
            activeUsers: {
                ...state.activeUsers,
                [userId]: { name: userName, id: userId, lastSeen: Date.now() }
            }
        })),

    removeUserCursor: (userId) =>
        set((state) => {
            const newCursors = { ...state.activeCursors }
            const newUsers = { ...state.activeUsers }
            delete newCursors[userId]
            delete newUsers[userId]
            return {
                activeCursors: newCursors,
                activeUsers: newUsers,
            }
        }),

    // Actualizar usuarios conectados en tiempo real
    setConnectedUser: (userId, userData) =>
        set((state) => ({
            connectedUsers: {
                ...state.connectedUsers,
                [userId]: { ...userData, online: true }
            }
        })),

    removeConnectedUser: (userId) =>
        set((state) => {
            const newUsers = { ...state.connectedUsers }
            delete newUsers[userId]
            return { connectedUsers: newUsers }
        }),

    setConnectedUsers: (users) =>
        set({ connectedUsers: users }),

    clearSession: () =>
        set({
            roomId: null,
            sessionId: null,
            currentUser: null,
            participants: [],
            files: [],
            code: '',
            messages: [],
            aiMessages: [],
            versions: [],
            activeCursors: {},
            activeUsers: {},
            connectedUsers: {},
        }),
}))
