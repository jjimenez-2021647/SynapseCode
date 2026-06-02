# CodeSessions - Quick Start Guide

## 🚀 Comenzar en 5 minutos

### 1. Instalar Socket.IO

```bash
cd SynapseCode-Frontend
pnpm add socket.io-client
```

### 2. Configurar Variables de Entorno

Crea `.env.local` en la raíz del frontend:

```env
VITE_SOCKET_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

### 3. Inicia los Servidores

```bash
# Terminal 1: Frontend
pnpm dev

# Terminal 2: Backend/Socket.IO
cd ../SynapseCode-ServiceRoom
pnpm dev
```

### 4. Accede a una Sesión

```
http://localhost:5173/code-sessions/tu-room-id
```

## 📋 Flujo de Uso

```
Usuario logueado
    ↓
Dashboard (ver salas)
    ↓
Hacer click en sala
    ↓
CodeSessionsPage carga
    ↓
Socket.IO se conecta
    ↓
Editor listo para editar
```

## 🎮 Controles Básicos

| Acción | Botón |
|--------|-------|
| Guardar código | Guardar |
| Ejecutar código | Ejecutar |
| Ver código de sala | Compartir |
| Ver versiones | Herramientas → Versiones |
| Hablar con IA | Cambiar a pestañas IA |
| Salir de la sala | Salir |

## 💾 Funcionalidades Listas

- ✅ Edición colaborativa en tiempo real
- ✅ Chat entre usuarios
- ✅ Chat con IA
- ✅ Explorador de archivos
- ✅ Lista de participantes
- ✅ Consola de ejecución
- ✅ Historial de versiones
- ✅ Compartir sala

## 🔧 Debugging

### Ver eventos Socket.IO en consola:

```javascript
// En la consola del navegador
socket.on('*', (event, data) => {
    console.log('Socket event:', event, data)
})
```

### Ver estado de Zustand:

```javascript
// En la consola del navegador
import { useCodeSessionStore } from '...'
const state = useCodeSessionStore.getState()
console.log(state)
```

## 📊 Monitor de Rendimiento

```javascript
// En components/CodeEditor.jsx
useEffect(() => {
    console.time('Code Update')
    updateCode(newCode)
    console.timeEnd('Code Update')
}, [code])
```

## ⚡ Tips de Performance

1. **Debounce en cambios de código**: Evita demasiadas emisiones de Socket.IO
2. **Lazy loading de archivos**: Carga archivos bajo demanda
3. **Virtualización de chat**: Si hay muchos mensajes
4. **Memoizar componentes**: Especialmente ParticipantList

```javascript
import { memo } from 'react'

export const Participants = memo(() => {
    // ...
})
```

## 🐛 Problemas Comunes

| Problema | Solución |
|----------|----------|
| Socket no conecta | Verifica VITE_SOCKET_URL |
| Código no se sincroniza | Revisa Network tab en DevTools |
| IA no responde | Asegúrate de tener el token válido |
| Crash en chat | Revisa props de ChatMessage |

## 📚 Documentación Completa

- [README.md](./README.md) - Documentación completa
- [SETUP.md](./SETUP.md) - Guía de instalación detallada
- [CODEMIRROR_GUIDE.md](./CODEMIRROR_GUIDE.md) - Cómo agregar CodeMirror
- [types.ts](./types.ts) - Interfaces de TypeScript

## 🎯 Próximos Pasos

1. ✅ Agregar CodeMirror para syntax highlighting
2. ✅ Implementar ejecución real de código
3. ✅ Conectar con IA real
4. ✅ Agregar temas de editor
5. ✅ Implementar atajos de teclado

## 💡 Ideas para Extensiones

- Diferencia visual entre cambios remotos y locales
- Notificaciones cuando alguien mencionan tu nombre
- Búsqueda y reemplazo en archivos
- Tema oscuro/claro
- Migraciones de código
- Sugerencias de IA en tiempo real

## 📞 Soporte

Para preguntas o problemas:
1. Revisa los README.md
2. Consulta la documentación de Socket.IO
3. Revisa los logs del servidor

¡Happ Coding! 🎉
