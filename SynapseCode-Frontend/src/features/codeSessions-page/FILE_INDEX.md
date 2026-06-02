# Índice de Archivos - CodeSessions Page

## 📍 Ubicación Raíz
```
src/features/codeSessions-page/
```

## 📄 Archivos Principales

### 1. **CodeSessionsPage.jsx** (370 líneas)
   - Componente contenedor principal
   - Maneja inicialización de Socket.IO
   - Layout grid con 3 secciones
   - Manejo de errores y loading

### 2. **index.js**
   - Exporta `CodeSessionsPage`

### 3. **styles.css** (400 líneas)
   - Estilos globales completos
   - Grid layout
   - Temas para componentes
   - Responsive design
   - Scrollbars personalizadas

## 📁 Carpeta `/components/` (8 archivos)

### Componentes Principales

1. **CodeEditor.jsx** (50 líneas)
   - Editor de código con textarea
   - Indicador de cambios sin guardar
   - Pronto para integración CodeMirror
   
2. **ConsolePanel.jsx** (80 líneas)
   - Múltiples pestañas de consola
   - Limpiar salida
   - Crear nueva consola
   - Mostrar output

3. **FileExplorer.jsx** (120 líneas)
   - Árbol jerárquico de archivos
   - Expandir/contraer carpetas
   - Botón "Nuevo"
   - Selector visual de archivo activo

4. **IAChat.jsx** (120 líneas)
   - Chat con IA (SynapseAI)
   - Espera de respuesta
   - Mensajes diferenciados
   - Animación de pensamiento

5. **ChatPanel.jsx** (110 líneas)
   - Chat entre usuarios
   - Envío de mensajes
   - Historial visible
   - Botón compartir archivo

6. **Participants.jsx** (60 líneas)
   - Lista de participantes
   - Status online/offline
   - Avatares con colores
   - Contador

7. **ToolsSidebar.jsx** (140 líneas)
   - 4 tabs: Sala, Versiones, Explicación, Ejecuciones
   - Información de sala
   - Botón salir
   - Historial de eventos

8. **TopBar.jsx** (140 líneas)
   - Botones: Guardar, Ejecutar, Compartir, Salir
   - Modal de compartir (código + password)
   - Indicadores de estado
   - Barra superior

### Archivo Índice
- **index.js** - Exporta todos los componentes

## 📁 Carpeta `/services/` (2 archivos)

### 1. **socketService.js** (200 líneas)
   - Inicialización de Socket.IO
   - Emit functions: code, cursor, chat, files, console
   - On listeners: code, cursor, chat, users, files
   - Disconnect handling
   - 20+ eventos implementados

### 2. **apiService.js** (150 líneas)
   - Endpoints CodeSessions
   - Endpoints Chat
   - Endpoints Execution
   - Endpoints Git/Versioning
   - Endpoints IA
   - Endpoints Room
   - Todos con manejo de errores

## 📁 Carpeta `/store/` (1 archivo)

### **codeSessionStore.js** (200 líneas)
   - Store global Zustand
   - 15+ acciones
   - Estado completo de sesión
   - Getters y setters
   - Inicialización limpia

## 📁 Carpeta `/hooks/` (2 archivos)

### 1. **useCodeSessionSocket.js** (120 líneas)
   - Inicializa Socket.IO
   - Escucha eventos
   - Sincroniza con store
   - Limpieza en unmount

### 2. **useCustomHooks.js** (150 líneas)
   - `useSharedState` - Estado compartido
   - `useSystemMessage` - Mensajes sistema
   - `useCollaborativeEdit` - Debounce edición
   - `useConnectionStatus` - Status conexión
   - `useEditPermissions` - Permisos

## 📁 Documentación (5 archivos)

### 1. **README.md** (~400 líneas)
   - Descripción general
   - Estructura de carpetas
   - Flujo de datos
   - Componentes explicados
   - Store de Zustand
   - Socket.IO events
   - APIs de microservicios
   - Mejoras futuras
   - Troubleshooting

### 2. **SETUP.md** (~200 líneas)
   - Guía instalación
   - Dependencias requeridas
   - Variables de ambiente
   - Estructura microservicios
   - Rutas disponibles
   - Testing local
   - Troubleshooting

### 3. **QUICKSTART.md** (~100 líneas)
   - Empezar en 5 minutos
   - Instalación rápida
   - Configuración
   - Flujo de uso
   - Controles básicos
   - Debugging tips
   - Performance tips

### 4. **CODEMIRROR_GUIDE.md** (~150 líneas)
   - Guía integración CodeMirror
   - Código comentado
   - Estilos CSS
   - Yjs CRDT
   - Cursores compartidos
   - Atajos de teclado

### 5. **CHECKLIST.md** (~200 líneas)
   - Checklist pre-deployment
   - Dependencias
   - Configuración
   - Pruebas básicas
   - Optimizaciones
   - Documentación
   - Seguridad
   - Performance

## 📋 Otros Archivos

### **types.ts** (250 líneas)
   - Interfaces completas
   - TypeScript definitions
   - Tipos para componentes
   - Tipos de datos

### **QUICKSTART.md** (Ver documentación)

## 🔍 Estructura Visual

```
codeSessions-page/
│
├── 📄 CodeSessionsPage.jsx
├── 📄 index.js
├── 📄 styles.css
├── 📄 types.ts
│
├── 📁 components/
│   ├── CodeEditor.jsx
│   ├── ConsolePanel.jsx
│   ├── FileExplorer.jsx
│   ├── IAChat.jsx
│   ├── ChatPanel.jsx
│   ├── Participants.jsx
│   ├── ToolsSidebar.jsx
│   ├── TopBar.jsx
│   └── index.js
│
├── 📁 services/
│   ├── socketService.js
│   └── apiService.js
│
├── 📁 store/
│   └── codeSessionStore.js
│
├── 📁 hooks/
│   ├── useCodeSessionSocket.js
│   └── useCustomHooks.js
│
└── 📚 Documentación/
    ├── README.md
    ├── SETUP.md
    ├── QUICKSTART.md
    ├── CODEMIRROR_GUIDE.md
    └── CHECKLIST.md
```

## 📊 Estadísticas

| Tipo | Cantidad | Líneas |
|------|----------|--------|
| Componentes | 8 | ~1500 |
| Servicios | 2 | ~350 |
| Store | 1 | ~200 |
| Hooks | 2 | ~270 |
| Estilos | 1 | ~400 |
| TypeScript | 1 | ~250 |
| Documentación | 5 | ~1200 |
| **Total** | **20** | **~4200** |

## 🚀 Inicio Rápido

1. Abre [QUICKSTART.md](./QUICKSTART.md)
2. Sigue los 4 pasos
3. Accede a `/code-sessions/room-id`

## 📖 Para Entender el Código

1. Lee [README.md](./README.md) primero
2. Examina [types.ts](./types.ts) para entender la estructura
3. Revisa [codeSessionStore.js](./store/codeSessionStore.js)
4. Estudia [socketService.js](./services/socketService.js)
5. Mira componentes individuales

## 🔧 Para Modificar

1. Componentes: en `/components/`
2. Estado: en `/store/codeSessionStore.js`
3. Socket.IO: en `/services/socketService.js`
4. APIs: en `/services/apiService.js`
5. Estilos: en `/styles.css` o componentes

## 📝 Notas Importantes

- Los componentes importan desde store de Zustand
- Socket.IO se inicializa automáticamente
- Los eventos se sincronizan automáticamente
- El store tiene acciones para todo
- Todos los hooks son personalizados

---

**Última actualización**: 1 de junio de 2024
**Versión**: 1.0
