# CodeSessions Page - Documentación

## Descripción General

La página de **CodeSessions** es una interfaz colaborativa de edición de código en tiempo real basada en **WebSocket (Socket.IO)** y **Zustand** para el estado global. Permite a múltiples usuarios editar código simultáneamente en una sala, con características avanzadas como:

- 📝 Editor de código colaborativo (CodeMirror compatible)
- 💬 Chat en tiempo real entre usuarios
- 🤖 Chat con IA (SynapseAI) por archivo
- 👥 Visualización de participantes activos
- 📁 Explorador de archivos (árbol de directorios)
- ⚙️ Herramientas: Versiones, Explicaciones, Ejecuciones, Configuración de Sala
- 🖥️ Consola de ejecución (múltiples pestañas)
- 🎯 Topbar con botones: Guardar, Ejecutar, Compartir, Salir

## Estructura de Carpetas

```
codeSessions-page/
├── CodeSessionsPage.jsx          # Componente principal (contenedor)
├── index.js                       # Exportación principal
├── styles.css                     # Estilos globales de la página
├── components/
│   ├── index.js                  # Exporta todos los componentes
│   ├── CodeEditor.jsx            # Editor de código (textarea)
│   ├── ConsolePanel.jsx          # Panel de consola con múltiples pestañas
│   ├── FileExplorer.jsx          # Árbol de archivos/carpetas
│   ├── IAChat.jsx                # Chat con IA (SynapseAI)
│   ├── ChatPanel.jsx             # Chat entre usuarios
│   ├── Participants.jsx          # Lista de participantes
│   ├── ToolsSidebar.jsx          # Herramientas (Versiones, Explicaciones, etc)
│   └── TopBar.jsx                # Barra superior con botones
├── services/
│   ├── apiService.js             # Llamadas a APIs de microservicios
│   └── socketService.js          # Servicio de WebSocket con Socket.IO
├── store/
│   └── codeSessionStore.js       # Store de Zustand para estado global
└── hooks/
    └── useCodeSessionSocket.js   # Hook para sincronizar Socket.IO con store
```

## Flujo de Datos

### Inicialización

1. Usuario navega a `/code-sessions/:roomId`
2. `CodeSessionsPage` carga la información de la sala
3. Socket.IO se conecta con el servidor
4. Se inicializa el store de Zustand
5. Se cargan los datos: participantes, archivos, versiones

### Edición Colaborativa (Real-time)

```
Usuario escribe en editor
    ↓
updateCode() → Store Zustand
    ↓
emitCodeChange() → Socket.IO
    ↓
Servidor transmite a otros usuarios
    ↓
onCodeChange() → updateCode() en otro usuario
    ↓
Código se actualiza en pantalla
```

### Chat y Mensajería

```
Usuario escribe mensaje
    ↓
addMessage() → Store
    ↓
emitChatMessage() → Socket.IO
    ↓
onChatMessage() → addMessage() en otros usuarios
```

### Chat con IA

- Usuario envía mensaje a IA
- `aiWaitingResponse = true` (bloquea envíos)
- IA procesa y responde
- `aiWaitingResponse = false` (desbloquea)
- Usuario puede enviar nuevo mensaje

## Componentes Principales

### CodeEditor
Editor de código simple usando `<textarea>`. Se puede reemplazar con CodeMirror:

```jsx
import { Controlled as CodeMirror } from 'react-codemirror2'
```

**Propiedades del Store**:
- `code`: Contenido del código actual
- `language`: Lenguaje de programación (JAVASCRIPT, PYTHON, etc)
- `currentFile`: Archivo seleccionado
- `unsavedChanges`: Indicador de cambios sin guardar

### FileExplorer
Árbol de archivos y carpetas con navegación jerárquica.

**Propiedades del Store**:
- `files`: Array de archivos/carpetas
- `currentFile`: Archivo seleccionado
- `fileStructure`: Estructura jerárquica

### Participants
Lista de usuarios conectados en la sala.

**Propiedades del Store**:
- `participants`: Array de usuarios activos
- `currentUser`: Usuario actual

### ChatPanel
Chat entre usuarios en tiempo real.

**Propiedades del Store**:
- `messages`: Historial de mensajes
- `currentUser`: Info del usuario actual

### IAChat (SynapseAI)
Chat con IA con respuestas contextuales.

**Características**:
- Espera a que IA termine antes de permitir nuevo mensaje
- Mensajes de usuario y asistente diferenciados
- Animación de "Pensando..."

**Propiedades del Store**:
- `aiMessages`: Conversación con IA
- `aiWaitingResponse`: Estado de espera

### ToolsSidebar
Herramientas y configuraciones.

**Pestañas**:
- **Versiones**: Historial de cambios guardados
- **Explicación**: Información sobre explicación de código
- **Ejecuciones**: Historial de ejecuciones
- **Sala**: Información y opción de salir

### ConsolePanel
Salida de consola durante ejecución.

**Características**:
- Múltiples pestañas de consola
- Limpiar salida
- Crear nueva consola
- Tipos de mensaje: log, error, warning

### TopBar
Barra superior con acciones principales.

**Botones**:
- **Guardar**: Guarda el código actual
- **Ejecutar**: Ejecuta el código
- **Compartir**: Muestra código de sala y contraseña
- **Salir**: Abandona la sesión

## Store de Zustand (codeSessionStore)

### Estado

```javascript
{
  // Room/Session info
  roomId: string,
  sessionId: string,
  roomName: string,
  isPrivate: boolean,
  roomPassword: string,
  maxParticipants: number,

  // User
  currentUser: object,
  participants: array,

  // Code
  currentFile: object,
  files: array,
  code: string,
  language: string,
  unsavedChanges: boolean,

  // UI
  activePanel: string, // 'files', 'participants', 'chat', 'ia-chat', 'tools'
  activeToolTab: string, // 'sala', 'versiones', 'explicacion', 'ejecuciones'

  // Chat
  messages: array,
  aiMessages: array,
  aiWaitingResponse: boolean,

  // Console
  consoles: array[{ id, output }],
  activeConsole: number,

  // Versions
  versions: array,
  selectedVersion: object,

  // Loading
  isLoading: boolean,
  isSaving: boolean,
}
```

### Acciones Principales

- `updateCode(newCode)`: Actualiza código
- `addMessage(message)`: Agrega mensaje al chat
- `addParticipant(participant)`: Agrega participante
- `removeParticipant(participantId)`: Elimina participante
- `setActivePanel(panel)`: Cambia panel izquierdo
- `addConsoleOutput(consoleId, output)`: Agrega salida a consola
- `setAIWaitingResponse(boolean)`: Controla estado de IA

## Socket.IO Events

### Code Collaboration
- `code:change`: Cambio de código en tiempo real
- `cursor:move`: Movimiento de cursor (para futuros cursores compartidos)

### Chat
- `chat:message`: Mensaje en chat normal
- `ai:message`: Mensaje para IA
- `ai:response`: Respuesta de IA

### User Presence
- `user:join`: Usuario se une
- `user:leave`: Usuario se va

### Files
- `file:create`: Nuevo archivo
- `file:update`: Actualización de archivo
- `file:delete`: Eliminación de archivo

### Console
- `console:output`: Salida de consola

## APIs de Microservicios

Todas las llamadas están en `services/apiService.js`:

### CodeSessions Service
- `POST /api/codeSessions` - Crear sesión
- `GET /api/codeSessions/:sessionId` - Obtener sesión
- `PUT /api/codeSessions/:sessionId` - Actualizar
- `GET /api/codeSessions/file/:fileId/latest` - Última versión
- `DELETE /api/codeSessions/:sessionId` - Eliminar

### Chat Service
- `POST /api/messages` - Enviar mensaje
- `GET /api/messages/room/:roomId` - Obtener mensajes
- `GET /api/messages/file/:fileId` - Chat por archivo

### Execution Service
- `POST /api/execution/run` - Ejecutar código
- `GET /api/execution/history/:roomId` - Historial

### IA Chat Service
- `POST /api/chat/ia` - Enviar a IA
- `POST /api/chat/explain` - Explicar código
- `GET /api/chat/ia/file/:fileId` - Obtener chat IA

## Instalación de Dependencias

```bash
npm install socket.io-client zustand axios
```

## Variables de Entorno

Agregar a `.env`:

```
VITE_SOCKET_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

## Mejoras Futuras

1. **CodeMirror Integration**: Reemplazar textarea con CodeMirror para syntax highlighting
2. **Yjs Binding**: Integración con Yjs para sincronización CRDT
3. **Cursores Compartidos**: Mostrar cursores de otros usuarios
4. **Line Numbers**: Números de línea
5. **Syntax Highlighting**: Coloreado de código
6. **Minimap**: Minimapa lateral
7. **Diff Viewer**: Vista de diferencias entre versiones
8. **Code Snippets**: Biblioteca de fragmentos
9. **Keyboard Shortcuts**: Atajos de teclado
10. **Dark/Light Theme**: Temas alternos

## Solución de Problemas

### Socket.IO no conecta
- Verificar URL de servidor: `VITE_SOCKET_URL`
- Verificar que el servidor esté corriendo
- Revisar CORS en servidor

### Código no se sincroniza
- Revisar conexión Socket.IO en console
- Revisar eventos en Network tab
- Verificar que el token sea válido

### Mensajes de IA no llegan
- Verificar que `aiWaitingResponse` se libere
- Revisar endpoint de IA en backend
- Comprobar logs del servidor

## Licencia

SynapseCode © 2024
