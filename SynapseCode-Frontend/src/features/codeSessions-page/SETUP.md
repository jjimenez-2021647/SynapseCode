# Setup CodeSessions - Guía de Instalación

## Dependencias Requeridas

Para que la página de CodeSessions funcione correctamente, necesitas instalar:

```bash
pnpm add socket.io-client
# o si usas npm
npm install socket.io-client
```

También se recomienda para mejor experiencia:

```bash
# Para syntax highlighting avanzado (opcional)
pnpm add codemirror @codemirror/lang-javascript @codemirror/lang-python

# Para sincronización colaborativa (opcional)
pnpm add yjs y-socket.io
```

## Verificación

Después de instalar, verifica que los siguientes módulos estén disponibles:

```bash
# En el navegador console
> import { io } from 'socket.io-client'
> import { create } from 'zustand'
```

## Configuración de Ambiente

Crea un archivo `.env.local` en la raíz del proyecto frontend:

```env
# Socket.IO URL
VITE_SOCKET_URL=http://localhost:3001

# API Base URL
VITE_API_URL=http://localhost:3001

# Backend Services URLs (opcional)
VITE_CODE_SESSIONS_URL=http://localhost:3002
VITE_CHAT_URL=http://localhost:3003
VITE_EXECUTION_URL=http://localhost:3004
VITE_GIT_URL=http://localhost:3005
```

## Estructura de Microservicios

Los siguientes microservicios deben estar corriendo:

```
SynapseCode-ServiceCodeSessions
  └─ Puerto: 3002 (por defecto)
  
SynapseCode-ServiceChat
  └─ Puerto: 3003 (por defecto)
  
SynapseCode-ServiceRoom
  └─ Puerto: 3000 (por defecto)
  
SynapseCode-ServiceExecutionCode
  └─ Puerto: 3004 (por defecto)
  
SynapseCode-ServiceGit
  └─ Puerto: 3005 (por defecto)
```

## Rutas de la Página

La página está disponible en:

```
/code-sessions/:roomId
```

Ejemplo:
```
/code-sessions/abc123def456
```

## Conexión con Backend

Para habilitar la conexión con los microservicios:

1. **CodeSessions**: Ya integrado en `services/apiService.js`
2. **Socket.IO**: Configurado en `services/socketService.js`
3. **Eventos de Sala**: Se sincronizan automáticamente vía Socket.IO

## Testing

Para probar localmente:

```bash
# Terminal 1: Inicia el frontend
pnpm dev

# Terminal 2: Inicia el backend/socket server
cd SynapseCode-ServiceRoom
pnpm dev

# Luego abre dos ventanas en diferente navegador/incognito
# y accede a la misma sala para ver la sincronización
```

## Troubleshooting

### Socket.IO no conecta

**Problema**: La consola muestra errores de conexión Socket.IO

**Solución**:
1. Verifica que el servidor Socket.IO esté corriendo
2. Revisa que `VITE_SOCKET_URL` sea correcto
3. Abre DevTools → Network → WS y verifica que se establezca la conexión

### Código no se sincroniza

**Problema**: Los cambios de código no aparecen en otros clientes

**Solución**:
1. Verifica que el evento `code:change` llegue en Network
2. Revisa los logs del servidor Socket.IO
3. Asegúrate que todos los usuarios estén en la misma sala

### Chat o IA no funciona

**Problema**: Los mensajes no llegan o la IA no responde

**Solución**:
1. Verifica los endpoints en `services/apiService.js`
2. Revisa que los microservicios correspondientes estén corriendo
3. Comprueba el token de autenticación en los headers

## Desarrollo

Para agregar nuevas características:

### 1. Nuevo evento Socket.IO

En `services/socketService.js`:

```javascript
export const emitCustomEvent = (data) => {
    if (socket?.connected) {
        socket.emit('custom:event', data)
    }
}

export const onCustomEvent = (callback) => {
    if (socket) {
        socket.on('custom:event', callback)
    }
}
```

### 2. Actualizar el Store

En `store/codeSessionStore.js`:

```javascript
// Agregar estado
miNuevoEstado: null,

// Agregar acción
setMiNuevoEstado: (valor) => set({ miNuevoEstado: valor })
```

### 3. Escuchar en el Hook

En `hooks/useCodeSessionSocket.js`:

```javascript
useEffect(() => {
    const handleCustomEvent = (data) => {
        setMiNuevoEstado(data)
    }

    onCustomEvent(handleCustomEvent)
}, [setMiNuevoEstado])
```

## Próximos Pasos

- [ ] Integrar CodeMirror para syntax highlighting
- [ ] Agregar Yjs para CRDT colaborativo
- [ ] Implementar cursores compartidos
- [ ] Agregar temas de editor
- [ ] Crear atajos de teclado
- [ ] Implementar diff viewer
- [ ] Agregar biblioteca de snippets

## Soporte

Para más información:
- Ver README.md en la carpeta actual
- Consultar documentación de Socket.IO: https://socket.io/docs/
- Documentación de Zustand: https://github.com/pmndrs/zustand

