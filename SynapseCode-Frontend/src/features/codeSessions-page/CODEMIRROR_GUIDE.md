/**
 * CodeMirror Integration Guide
 *
 * Para agregar CodeMirror al editor de código, sigue estos pasos:
 *
 * 1. Instala las dependencias:
 *    pnpm add codemirror @codemirror/lang-javascript @codemirror/lang-python
 *    pnpm add @codemirror/lang-java @codemirror/lang-cpp @codemirror/lang-css
 *
 * 2. Reemplaza el contenido de CodeEditor.jsx con el siguiente código:
 */

/*
import { useEffect, useRef, useState } from 'react'
import { EditorState, EditorView } from '@codemirror/state'
import { EditorView as CM } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { css } from '@codemirror/lang-css'
import { useCodeSessionStore } from '../../store/codeSessionStore'
import { emitCodeChange } from '../../services/socketService'

const languageMap = {
    'javascript': javascript,
    'python': python,
    'java': java,
    'cpp': cpp,
    'css': css,
}

export const CodeEditor = () => {
    const editorRef = useRef(null)
    const viewRef = useRef(null)
    const [isInitialized, setIsInitialized] = useState(false)

    const code = useCodeSessionStore((state) => state.code)
    const language = useCodeSessionStore((state) => state.language)
    const updateCode = useCodeSessionStore((state) => state.updateCode)
    const currentFile = useCodeSessionStore((state) => state.currentFile)
    const unsavedChanges = useCodeSessionStore((state) => state.unsavedChanges)

    // Inicializar CodeMirror
    useEffect(() => {
        if (!editorRef.current || isInitialized) return

        const lang = languageMap[language.toLowerCase()] || javascript

        const state = EditorState.create({
            doc: code,
            extensions: [basicSetup, lang(), EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    const newCode = update.state.doc.toString()
                    updateCode(newCode)
                    emitCodeChange(currentFile?.id, newCode)
                }
            })],
        })

        const view = new EditorView({
            state,
            parent: editorRef.current,
        })

        viewRef.current = view
        setIsInitialized(true)

        return () => {
            view.destroy()
        }
    }, [isInitialized])

    // Actualizar código externo
    useEffect(() => {
        if (viewRef.current && code !== viewRef.current.state.doc.toString()) {
            const selection = viewRef.current.state.selection
            const update = viewRef.current.state.update({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: code,
                },
                selection,
            })
            viewRef.current.dispatch(update)
        }
    }, [code])

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {currentFile?.name || 'Sin archivo'}
                    </p>
                    <p className="text-xs text-slate-500">{language}</p>
                </div>
                {unsavedChanges && (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-error animate-pulse" />
                        <p className="text-xs text-slate-400">Sin guardar</p>
                    </div>
                )}
            </div>
            <div ref={editorRef} className="flex-1 overflow-hidden" />
        </div>
    )
}

export default CodeEditor
*/

/**
 * Estilos CSS para CodeMirror
 *
 * Agrega esto a styles.css para un tema personalizado:
 */

/*
.cm-editor {
    height: 100%;
    font-family: 'Fira Code', 'Courier New', monospace;
}

.cm-gutters {
    background-color: rgb(2, 6, 23);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    color: #64748b;
}

.cm-linenumber {
    color: #64748b;
}

.cm-cursor {
    border-left-color: #00d9ff;
}

.cm-selectionBackground {
    background-color: rgba(0, 217, 255, 0.2);
}

.cm-content {
    background-color: rgb(15, 23, 42);
    color: #e2e8f0;
}

.cm-activeLineGutter {
    background-color: rgba(0, 217, 255, 0.1);
}

.cm-activeLine {
    background-color: rgba(0, 217, 255, 0.05);
}

.cm-keyword {
    color: #d946ef;
}

.cm-string {
    color: #10b981;
}

.cm-number {
    color: #f59e0b;
}

.cm-comment {
    color: #6b7280;
}

.cm-variable {
    color: #00d9ff;
}

.cm-function {
    color: #60a5fa;
}

.cm-bracketMatching {
    background-color: rgba(0, 217, 255, 0.3);
}
*/

/**
 * Integración con Yjs para Colaboración CRDT
 *
 * 1. Instala: pnpm add yjs y-codemirror
 *
 * 2. En useCodeSessionSocket.js, agrega:
 */

/*
import * as Y from 'yjs'
import { yCollab } from 'y-codemirror'
import { WebsocketProvider } from 'y-websocket'

const yDoc = new Y.Doc()
const yText = yDoc.getText('shared-code')
const provider = new WebsocketProvider(
    'ws://localhost:1234',
    'codesession-room',
    yDoc
)

// En CodeEditor.jsx:
const binding = yCollab(yText, viewRef.current.state.selection, [provider.awareness])
*/

/**
 * Cursores Compartidos
 *
 * Para mostrar cursores de otros usuarios en tiempo real:
 */

/*
// En services/socketService.js
export const onRemoteCursor = (callback) => {
    if (socket) {
        socket.on('cursor:moved', callback)
    }
}

// En components/CodeEditor.jsx
useEffect(() => {
    const handleRemoteCursor = (data) => {
        // Renderizar cursor en posición data.position
        // con color data.color y nombre data.userName
    }
    onRemoteCursor(handleRemoteCursor)
}, [])
*/

/**
 * Atajos de Teclado
 *
 * Agrega esto a CodeEditor.jsx para atajos personalizados:
 */

/*
const keyMap = {
    'Ctrl-S': handleSave,
    'Ctrl-Enter': handleExecute,
    'Ctrl-Shift-F': formatCode,
    'Ctrl-/': toggleComment,
    'Tab': insertTab,
}

const handleKeyDown = (e) => {
    const key = `${e.ctrlKey ? 'Ctrl-' : ''}${e.key}`
    if (keyMap[key]) {
        e.preventDefault()
        keyMap[key]()
    }
}
*/

export default CodeEditor
