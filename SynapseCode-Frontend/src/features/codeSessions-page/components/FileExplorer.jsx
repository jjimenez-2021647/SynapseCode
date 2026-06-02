import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, File, Folder, Plus, X, Trash2 } from 'lucide-react'
import { useCodeSessionStore } from '../store/codeSessionStore'
import { filesAPI, foldersAPI } from '../services/apiService'
import { codeTemplates, getAllowedLanguages, getTemplateByLanguage } from '../helpers/codeTemplates'
import { useToast } from './Toast'

// Helper para traducir errores de red a mensajes claros
const getErrorMessage = (error) => {
    // Sin conexión de red
    if (!error.response) {
        if (error.message === 'Network Error') {
            return 'Sin conexión. Verifica tu internet e intenta de nuevo'
        }
        if (error.code === 'ECONNABORTED') {
            return 'La solicitud tardó demasiado. Intenta de nuevo'
        }
        return 'Sin conexión al servidor. Verifica tu internet'
    }

    const status = error.response.status
    const data = error.response.data || {}

    // Errores específicos
    switch (status) {
        case 400:
            return data.message || 'Los datos enviados no son válidos'
        case 401:
            return 'Tu sesión expiró. Por favor recarga la página'
        case 403:
            return 'No tienes permisos para hacer esto'
        case 404:
            return 'La sala no existe o fue eliminada'
        case 409:
            return 'Ya existe con ese nombre. Usa otro'
        case 500:
            return 'Error del servidor. Intenta más tarde'
        case 503:
            return 'El servidor está en mantenimiento. Intenta más tarde'
        default:
            return data.message || 'Algo salió mal. Intenta de nuevo'
    }
}

export const FileExplorer = () => {
    const [expandedFolders, setExpandedFolders] = useState(new Set())
    const [showNewMenu, setShowNewMenu] = useState(false)
    const [showModal, setShowModal] = useState(null) // 'file' | 'folder' | null
    const [inputValue, setInputValue] = useState('')
    const [selectedLanguage, setSelectedLanguage] = useState('JAVASCRIPT')
    const [selectedParentFolder, setSelectedParentFolder] = useState(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [draggedItem, setDraggedItem] = useState(null)
    const [dragOverFolder, setDragOverFolder] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const { showError, showSuccess, ToastComponent } = useToast()

    const files = useCodeSessionStore((state) => state.files)
    const currentFile = useCodeSessionStore((state) => state.currentFile)
    const setCurrentFile = useCodeSessionStore((state) => state.setCurrentFile)
    const roomId = useCodeSessionStore((state) => state.roomId)
    const roomLanguage = useCodeSessionStore((state) => state.roomLanguage)
    const allowedLanguages = useCodeSessionStore((state) => state.allowedLanguages)
    const addFile = useCodeSessionStore((state) => state.addFile)
    const addFolder = useCodeSessionStore((state) => state.addFolder)
    const deleteFile = useCodeSessionStore((state) => state.deleteFile)
    const updateFile = useCodeSessionStore((state) => state.updateFile)
    const setFiles = useCodeSessionStore((state) => state.setFiles)

    // Obtener lenguajes permitidos
    const permittedLanguages = getAllowedLanguages(roomLanguage, allowedLanguages)

    // Helper para reorganizar el árbol de archivos en estructura jerárquica
    const reorganizeFileTree = (items) => {
        const itemsById = {}
        const rootItems = []

        // Crear mapa de items por ID y separar raíz
        items.forEach((item) => {
            itemsById[item.id] = { ...item, children: [] }
            if (!item.parentFolderId) {
                rootItems.push(itemsById[item.id])
            }
        })

        // Agregar items hijos a sus carpetas padres
        items.forEach((item) => {
            if (item.parentFolderId && itemsById[item.parentFolderId]) {
                itemsById[item.parentFolderId].children.push(itemsById[item.id])
            }
        })

        return rootItems
    }

    // Agregar item con actualización automática de estructura
    const addFileWithReorg = (newFile) => {
        addFile(newFile)
        // Reorganizar después de agregar
        const updatedFiles = reorganizeFileTree([...files, newFile])
        setFiles(updatedFiles)
    }

    const addFolderWithReorg = (newFolder) => {
        addFolder(newFolder)
        // Reorganizar después de agregar
        const updatedFiles = reorganizeFileTree([...files, newFolder])
        setFiles(updatedFiles)
    }

    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId)
        } else {
            newExpanded.add(folderId)
        }
        setExpandedFolders(newExpanded)
    }

    const handleCreateFile = async () => {
        if (!inputValue.trim()) {
            showError('Ingresa un nombre para el archivo')
            return
        }

        if (!roomId) {
            showError('No pudimos acceder a tu sala. Intenta recargar la página')
            return
        }

        setIsCreating(true)
        try {
            const template = getTemplateByLanguage(selectedLanguage)
            const payload = {
                roomId,
                fileName: inputValue.trim(),
                fileExtension: template.extension,
                language: selectedLanguage,
                currentCode: template.template, // Enviar el código template
                parentFolderId: selectedParentFolder || null,
            }

            const response = await filesAPI.createFile(payload)

            if (response.success && response.data) {
                const newFile = {
                    id: response.data._id || response.data.id,
                    name: `${response.data.fileName}.${response.data.fileExtension}`,
                    isFolder: false,
                    path: response.data.fileName,
                    language: response.data.language,
                    code: response.data.currentCode || '',
                    parentFolderId: selectedParentFolder || null,
                }
                addFileWithReorg(newFile)
                // Abrir el archivo automáticamente en el editor
                setCurrentFile(newFile)
                // Expandir la carpeta padre si existe
                if (selectedParentFolder) {
                    setExpandedFolders(prev => new Set([...prev, selectedParentFolder]))
                }
                showSuccess(`✓ ${newFile.name} creado y abierto`)
                setInputValue('')
                setShowModal(null)
                setSelectedParentFolder(null)
                setSelectedLanguage('JAVASCRIPT')
            } else {
                const msg = response.message || 'No se pudo crear el archivo'
                showError(msg)
            }
        } catch (error) {
            const userMsg = getErrorMessage(error)
            showError(userMsg)
        } finally {
            setIsCreating(false)
        }
    }

    const handleCreateFolder = async () => {
        if (!inputValue.trim()) {
            showError('Ingresa un nombre para la carpeta')
            return
        }

        if (!roomId) {
            showError('No pudimos acceder a tu sala. Intenta recargar la página')
            return
        }

        setIsCreating(true)
        try {
            const payload = {
                roomId,
                folderName: inputValue.trim(),
                parentFolderId: selectedParentFolder || null,
            }

            const response = await foldersAPI.createFolder(payload)

            if (response.success && response.data) {
                const newFolder = {
                    id: response.data._id || response.data.id,
                    name: response.data.folderName,
                    isFolder: true,
                    children: [],
                    parentFolderId: selectedParentFolder || null,
                }
                addFolderWithReorg(newFolder)
                showSuccess(`✓ ${newFolder.name} creada`)
                // Expandir la carpeta padre si existe
                if (selectedParentFolder) {
                    setExpandedFolders(prev => new Set([...prev, selectedParentFolder]))
                }
                setInputValue('')
                setShowModal(null)
                setSelectedParentFolder(null)
            } else {
                const msg = response.message || 'No se pudo crear la carpeta'
                showError(`No se pudo crear la carpeta: ${msg}`)
            }
        } catch (error) {
            const userMsg = getErrorMessage(error)
            showError(userMsg)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteItem = async (item) => {
        if (!window.confirm(`¿Eliminar ${item.isFolder ? 'carpeta' : 'archivo'} "${item.name}"?`)) {
            return
        }

        setIsDeleting(true)
        try {
            if (item.isFolder) {
                await foldersAPI.deleteFolder(item.id)
            } else {
                await filesAPI.deleteFile(item.id)
            }
            deleteFile(item.id)
            // Reorganizar después de eliminar
            const updatedFiles = reorganizeFileTree(files.filter(f => f.id !== item.id))
            setFiles(updatedFiles)
            showSuccess(`✓ ${item.name} eliminado`)
        } catch (error) {
            const userMsg = getErrorMessage(error)
            showError(userMsg)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleMoveItem = async (item, targetFolderId) => {
        setIsDeleting(true)
        try {
            if (item.isFolder) {
                await foldersAPI.moveFolder(item.id, targetFolderId)
            } else {
                await filesAPI.moveFile(item.id, targetFolderId)
            }
            // Actualizar parentFolderId
            const updatedItem = { ...item, parentFolderId: targetFolderId || null }
            updateFile(item.id, { parentFolderId: targetFolderId || null })
            // Reorganizar después de mover
            const filesWithUpdate = files.map(f => f.id === item.id ? updatedItem : f)
            const updatedFiles = reorganizeFileTree(filesWithUpdate)
            setFiles(updatedFiles)
            showSuccess(`✓ ${item.name} movido`)
        } catch (error) {
            const userMsg = getErrorMessage(error)
            showError(userMsg)
        } finally {
            setIsDeleting(false)
            setDraggedItem(null)
            setDragOverFolder(null)
        }
    }

    const handleOpenNewFile = () => {
        if (!roomId) {
            showError('No pudimos acceder a tu sala. Intenta recargar la página')
            console.warn('[FileExplorer] roomId vacío al abrir modal')
            return
        }
        setShowModal('file')
        setInputValue('')
        setSelectedLanguage(permittedLanguages[0] || 'JAVASCRIPT')
        setShowNewMenu(false)
    }

    const handleOpenNewFolder = () => {
        if (!roomId) {
            showError('No pudimos acceder a tu sala. Intenta recargar la página')
            console.warn('[FileExplorer] roomId vacío al abrir modal carpeta')
            return
        }
        setShowModal('folder')
        setInputValue('')
        setShowNewMenu(false)
    }

    const renderFileTree = (items, level = 0) => {
        return items?.map((item) => (
            <div key={item.id}>
                {item.isFolder ? (
                    <>
                        <div
                            draggable
                            onDragStart={(e) => {
                                setDraggedItem(item)
                                setIsDragging(true)
                                e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => {
                                setIsDragging(false)
                                setDragOverFolder(null)
                            }}
                            onDragOver={(e) => {
                                e.preventDefault()
                                e.dataTransfer.dropEffect = 'move'
                                setDragOverFolder(item.id)
                            }}
                            onDragLeave={() => {
                                if (dragOverFolder === item.id) {
                                    setDragOverFolder(null)
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                if (draggedItem && draggedItem.id !== item.id) {
                                    handleMoveItem(draggedItem, item.id)
                                }
                            }}
                            className={`group w-full flex items-center justify-between gap-1 px-2 py-1.5 hover:bg-primary/10 rounded-md transition-colors text-sm ${
                                dragOverFolder === item.id
                                    ? 'bg-primary/20 border-l-2 border-primary'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                            style={{ paddingLeft: `${level * 16 + 8}px` }}
                        >
                            <button
                                onClick={() => toggleFolder(item.id)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                            >
                                {expandedFolders.has(item.id) ? (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                )}
                                <Folder className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </button>
                            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setSelectedParentFolder(item.id)
                                        setExpandedFolders(prev => new Set([...prev, item.id]))
                                        setShowModal('file')
                                    }}
                                    className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/40 rounded transition-colors"
                                    title="Crear archivo aquí"
                                >
                                    +📄
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedParentFolder(item.id)
                                        setExpandedFolders(prev => new Set([...prev, item.id]))
                                        setShowModal('folder')
                                    }}
                                    className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/40 rounded transition-colors"
                                    title="Crear carpeta aquí"
                                >
                                    +📁
                                </button>
                                <button
                                    onClick={() => handleDeleteItem(item)}
                                    disabled={isDeleting}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                </button>
                            </div>
                        </div>
                        {expandedFolders.has(item.id) && item.children && (
                            <div className="group">
                                {item.children.length > 0 ? (
                                    renderFileTree(item.children, level + 1)
                                ) : (
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.dataTransfer.dropEffect = 'move'
                                            setDragOverFolder(item.id)
                                        }}
                                        onDragLeave={() => {
                                            if (dragOverFolder === item.id) {
                                                setDragOverFolder(null)
                                            }
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            if (draggedItem && draggedItem.id !== item.id) {
                                                handleMoveItem(draggedItem, item.id)
                                            }
                                        }}
                                        className={`text-xs text-slate-500 italic px-2 py-2 transition-colors ${
                                            dragOverFolder === item.id
                                                ? 'bg-primary/10 text-primary/70'
                                                : ''
                                        }`}
                                        style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                                    >
                                        Suelta aquí para mover
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div
                        draggable
                        onDragStart={(e) => {
                            setDraggedItem(item)
                            setIsDragging(true)
                            e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={() => {
                            setIsDragging(false)
                            setDragOverFolder(null)
                        }}
                        className={`group w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors text-sm ${
                            currentFile?.id === item.id
                                ? 'bg-primary/20 text-primary border-l-2 border-primary'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-primary/10'
                        }`}
                        style={{ paddingLeft: `${level * 16 + 8}px` }}
                    >
                        <button
                            onClick={() => setCurrentFile(item)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                        >
                            <File className="h-4 w-4 text-cyan-300 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                        </button>
                        <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={isDeleting}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Eliminar"
                        >
                            <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                    </div>
                )}
            </div>
        ))
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40">
            {ToastComponent}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Archivos</h3>
                <div className="relative">
                    <button
                        onClick={() => setShowNewMenu(!showNewMenu)}
                        className="p-1 hover:bg-primary/20 rounded transition-colors"
                        title="Nuevo archivo/carpeta"
                        disabled={!roomId}
                    >
                        <Plus className={`h-4 w-4 ${roomId ? 'text-primary' : 'text-slate-600'}`} />
                    </button>
                    {showNewMenu && (
                        <div className="absolute right-0 mt-1 w-40 bg-slate-900 border border-primary/30 rounded-lg shadow-lg z-50">
                            <button
                                onClick={handleOpenNewFile}
                                className="w-full text-left px-3 py-2 hover:bg-primary/20 text-sm text-slate-300 transition-colors"
                            >
                                Nuevo Archivo
                            </button>
                            <button
                                onClick={handleOpenNewFolder}
                                className="w-full text-left px-3 py-2 hover:bg-primary/20 text-sm text-slate-300 border-t border-white/10 transition-colors"
                            >
                                Nueva Carpeta
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {files.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                        <p>No hay archivos</p>
                    </div>
                ) : (
                    renderFileTree(files)
                )}
            </div>

            {/* Modal de Crear Archivo */}
            {showModal === 'file' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-primary/30 rounded-lg p-6 w-96 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-100">Nuevo Archivo</h3>
                            <button
                                onClick={() => {
                                    setShowModal(null)
                                    setInputValue('')
                                    setSelectedParentFolder(null)
                                }}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Selector de Lenguaje */}
                            <div>
                                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                                    Lenguaje
                                </label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm text-slate-100 focus:outline-none focus:border-primary/50"
                                >
                                    {permittedLanguages.map((lang) => (
                                        <option key={lang} value={lang}>
                                            {lang}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Carpeta Seleccionada */}
                            {selectedParentFolder && (
                                <div className="p-2 bg-slate-950 border border-primary/30 rounded text-xs text-slate-300">
                                    <p className="text-slate-400">Se creará en:</p>
                                    <p className="text-primary font-semibold truncate">
                                        {files.find(f => f.id === selectedParentFolder)?.name || 'Carpeta'}
                                    </p>
                                    <button
                                        onClick={() => setSelectedParentFolder(null)}
                                        className="text-slate-500 hover:text-slate-300 mt-1 text-xs"
                                    >
                                        Cambiar carpeta
                                    </button>
                                </div>
                            )}

                            {/* Input de Nombre */}
                            <div>
                                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                                    Nombre del archivo
                                </label>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateFile()
                                        } else if (e.key === 'Escape') {
                                            setShowModal(null)
                                            setInputValue('')
                                            setSelectedParentFolder(null)
                                        }
                                    }}
                                    placeholder="nombre (sin extensión)"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary/50"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Se creará como: {inputValue || 'archivo'}.
                                    {getTemplateByLanguage(selectedLanguage).extension}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(null)
                                    setInputValue('')
                                    setSelectedParentFolder(null)
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateFile}
                                disabled={!inputValue.trim() || isCreating}
                                className="px-3 py-1.5 text-xs font-semibold rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Crear Carpeta */}
            {showModal === 'folder' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-primary/30 rounded-lg p-6 w-96 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-100">Nueva Carpeta</h3>
                            <button
                                onClick={() => {
                                    setShowModal(null)
                                    setInputValue('')
                                    setSelectedParentFolder(null)
                                }}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Carpeta Seleccionada */}
                            {selectedParentFolder && (
                                <div className="p-2 bg-slate-950 border border-primary/30 rounded text-xs text-slate-300">
                                    <p className="text-slate-400">Se creará en:</p>
                                    <p className="text-primary font-semibold truncate">
                                        {files.find(f => f.id === selectedParentFolder)?.name || 'Carpeta'}
                                    </p>
                                    <button
                                        onClick={() => setSelectedParentFolder(null)}
                                        className="text-slate-500 hover:text-slate-300 mt-1 text-xs"
                                    >
                                        Cambiar carpeta
                                    </button>
                                </div>
                            )}

                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateFolder()
                                    } else if (e.key === 'Escape') {
                                        setShowModal(null)
                                        setInputValue('')
                                        setSelectedParentFolder(null)
                                    }
                                }}
                                placeholder="nombre de la carpeta"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary/50"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(null)
                                    setInputValue('')
                                    setSelectedParentFolder(null)
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!inputValue.trim() || isCreating}
                                className="px-3 py-1.5 text-xs font-semibold rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
