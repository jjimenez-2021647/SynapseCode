# SynapseCode - Arquitectura de Microservicios

> **Plataforma colaborativa de ejecución y explicación de código** refactorizada de un monolito a una arquitectura moderna de microservicios independientes.

**Status:** PRODUCCIÓN | **Última actualización:** 6 de abril de 2026

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Documentación API (Swagger)](#documentación-api-swagger)
- [Flujos Principales](#flujos-principales)
- [Autenticación](#autenticación)
- [Base de Datos](#base-de-datos)
- [Configuración de Entorno](#configuración-de-entorno)
- [Testing con Postman](#testing-con-postman)
- [Troubleshooting](#troubleshooting)

---

## Visión General

**SynapseCode** es una plataforma integral para:
- **Colaboración en tiempo real** - Salas, participantes, chats
- **Edición de código** - Múltiples archivos con control de versiones
- **Ejecución de código** - Soporte para 20+ lenguajes via Judge0
- **Explicaciones con IA** - Análisis de código con Groq
- **Gestión de usuarios** - Autenticación y autorización JWT
- **Feedback comunitario** - Comentarios y sugerencias de usuarios

### De Monolito a Microservicios
- **Original:** Un único servidor Node.js (3005)
- **Actual:** 6 servicios independientes comunicados vía HTTP
- **Beneficios:** Escalabilidad, independencia de deployment, resiliencia
- **Total Endpoints:** 113 endpoints distribuidos

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cliente / Frontend                         │
└──────────┬──────────────┬──────────────┬────────────┬───────────┘
           │              │              │            │
    ┌──────▼──────┐  ┌───▼───────┐  ┌──▼──────────┐ ┌─▼──────────┐
    │AuthService  │  │ServiceRoom │  │ServiceChat  │ │ServiceFB   │
    │(Porto 3006) │  │(Porto 3007)│  │(Porto 3008) │ │(Porto 3011)│
    │             │  │            │  │             │ │            │
    │- Auth       │  │- Rooms     │  │- Chats      │ │- Comments  │
    │- Users      │  │- Files     │  │- Messages   │ │- Votes     │
    │- Roles      │  │- Particip. │  │- Explications│ │- Feedback  │
    └─────────────┘  └──────┬─────┘  └─────────────┘ └────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
     ┌──────────▼──────────┐  ┌──────────▼──────────┐
     │CodeSessions Service │  │ExecutionCode Service│
     │(Porto 3009)         │  │(Porto 3010)         │
     │                     │  │                     │
     │- Code Versions      │  │- Code Executions   │
     │- Session History    │  │- Judge0 Integration│
     └─────────────────────┘  └────────────────────┘

     ┌──────────────────────────────────────────────┐
     │       Base de Datos - MongoDB                │
     │     SynapseCodeDB (Compartida)               │
     └──────────────────────────────────────────────┘
```

### Comunicación Inter-Servicios
- **ServiceRoom ↔ ServiceChat:** Creación automática de chats
- **ServiceRoom ↔ ServiceCodeSessions:** Obtención de historial
- **ServiceExecutionCode ↔ Judge0:** Ejecución de código
- **ServiceChat ↔ Groq:** Explicaciones con IA
- **Todos ↔ AuthService:** Validación de JWT

---

## Servicios

| Servicio | Puerto | BD | Responsabilidad | Endpoints |
|----------|--------|----|-----------------|-----------| 
| **AuthService** | 3006 | PostgreSQL | Autenticación, usuarios, roles | 28 |
| **ServiceRoom** | 3007 | MongoDB | Salas, archivos, participantes | 31 |
| **ServiceChat** | 3008 | MongoDB | Chats, mensajes, explicaciones | 17 |
| **ServiceCodeSessions** | 3009 | MongoDB | Versiones de código | 11 |
| **ServiceExecutionCode** | 3010 | MongoDB | Ejecución de código | 15 |
| **ServiceFeedback** | 3011 | MongoDB | Comentarios y votos comunitarios | 11 |
| **TOTAL** | | | | **113** |

### AuthService (Puerto 3006)
```
Autenticación:
  POST   /api/v1/auth/register       - Registrar usuario
  POST   /api/v1/auth/login          - Login y obtener JWT
  POST   /api/v1/auth/refresh        - Refrescar token
  POST   /api/v1/auth/logout         - Logout
  [+ 16 endpoints más]

Usuarios:
  GET    /api/v1/users               - Listar usuarios
  POST   /api/v1/users               - Crear usuario
  GET    /api/v1/users/:id           - Obtener usuario
  PUT    /api/v1/users/:id           - Actualizar usuario
  DELETE /api/v1/users/:id           - Eliminar usuario
  [+ 3 endpoints más]
```

### ServiceRoom (Puerto 3007)
```
Salas (8 endpoints):
  POST   /api/v1/rooms               - Crear sala
  GET    /api/v1/rooms               - Listar salas
  GET    /api/v1/rooms/code/:code    - Obtener por código
  PUT    /api/v1/rooms/code/:code    - Actualizar sala
  DELETE /api/v1/rooms/code/:code    - Eliminar sala
  [+ 3 endpoints más]

Participantes (8 endpoints):
  POST   /api/v1/room-participations - Unirse a sala
  GET    /api/v1/room-participations - Listar participaciones
  GET    /api/v1/room-participations/room/:roomId - Por sala
  PUT    /api/v1/room-participations/:id - Actualizar
  [+ 4 endpoints más]

Archivos (15 endpoints):
  POST   /api/v1/files               - Crear archivo
  GET    /api/v1/files               - Listar archivos
  GET    /api/v1/files/:fileId       - Obtener archivo
  PUT    /api/v1/files/:fileId       - Actualizar contenido
  PUT    /api/v1/files/:fileId/rename - Renombrar
  DELETE /api/v1/files/:fileId       - Eliminar archivo
  [+ 9 endpoints más]
```

### ServiceChat (Puerto 3008)
```
Chats (4 endpoints):
  POST   /api/v1/chats               - Crear chat
  POST   /api/v1/chats/batch-create  - Crear múltiples (usado internamente)
  GET    /api/v1/chats               - Listar chats
  DELETE /api/v1/chats/room/:roomId  - Eliminar chats de sala

Mensajes (8 endpoints):
  POST   /api/v1/messages            - Crear mensaje
  GET    /api/v1/messages            - Listar mensajes
  GET    /api/v1/messages/:messageId - Obtener mensaje
  PUT    /api/v1/messages/:messageId - Editar mensaje
  DELETE /api/v1/messages/:messageId - Eliminar mensaje
  [+ 3 endpoints más]

Explicaciones IA (5 endpoints):
  GET    /api/v1/explication/file/:idFile  - Listar explicaciones
  POST   /api/v1/explication/file/:idFile  - Crear (Groq IA)
  GET    /api/v1/explication/:id           - Obtener explicación
  DELETE /api/v1/explication/:id           - Eliminar
  [+ 1 endpoint más]
```

### ServiceCodeSessions (Puerto 3009)
```
11 endpoints para:
  POST   /api/v1/codeSessions              - Guardar versión
  GET    /api/v1/codeSessions              - Listar sesiones
  GET    /api/v1/codeSessions/:sessionId   - Obtener sesión
  GET    /api/v1/codeSessions/file/:fileId - Por archivo
  GET    /api/v1/codeSessions/file/:fileId/latest - Última versión
  [+ 6 endpoints más]
```

### ServiceExecutionCode (Puerto 3010)
```
15 endpoints para:
  GET    /api/v1/codeExecutions/languages        - Lenguajes soportados
  POST   /api/v1/codeExecutions/run              - Ejecutar código (síncrono)
  POST   /api/v1/codeExecutions/submit           - Ejecución asincrónica
  GET    /api/v1/codeExecutions/result/:token    - Obtener resultado
  POST   /api/v1/codeExecutions                  - Crear ejecución
  GET    /api/v1/codeExecutions/:executionId     - Obtener ejecución
  [+ 9 endpoints más]
```

### ServiceFeedback (Puerto 3011)
```
11 endpoints para:
  GET    /api/v1/feedback/comments              - Listar comentarios (público)
  GET    /api/v1/feedback/comments/:commentId   - Obtener comentario (público)
  POST   /api/v1/feedback/comments              - Crear comentario
  PUT    /api/v1/feedback/comments/:commentId   - Editar comentario (solo autor, < 30 min)
  DELETE /api/v1/feedback/comments/:commentId   - Eliminar comentario (autor/admin)
  POST   /api/v1/feedback/comments/:commentId/vote - Votar/desvotar (toggle)
  
  Características:
  - Sistema de comentarios y sugerencias de la comunidad
  - Búsqueda de texto en comentarios
  - Votos positivos (un voto por usuario/comentario)
  - Paginación en listados
  - Ordenamiento por popularidad (voteCount)
  [+ 5 endpoints relacionados]
```

---

## Instalación

### Requisitos Previos
```
- Node.js >= 16
- MongoDB corriendo (puerto 27017)
- PostgreSQL corriendo (puerto 5432 o 5436)
- pnpm >= 10.29.2
- Git
```

### Paso 1: Instalar MongoDB
```bash
# En Windows (con Chocolatey):
choco install mongodb

# En Linux:
sudo apt-get install mongodb

# En Mac:
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB:
mongod
```

### Paso 2: Instalar PostgreSQL (para AuthService)
```bash
# En Windows:
# Descargar desde https://www.postgresql.org/download/windows/

# En Linux:
sudo apt-get install postgresql postgresql-contrib

# En Mac:
brew install postgresql
```

### Paso 3: Clonar/Navegar al Repositorio
```bash
cd c:\SynapseCode
```

### Paso 4: Instalar Dependencias
```bash
# Instalar dependencias de todos los servicios
pnpm install
```

### Paso 5: Configurar Variables de Entorno

Cada servicio tiene un archivo `.env.example`. Copiar y configurar:

```bash
# AuthService
cp AuthService/.env.example AuthService/.env

# ServiceRoom
cp SynapseCode-ServiceRoom/.env.example SynapseCode-ServiceRoom/.env

# ServiceChat
cp SynapseCode-ServiceChat/.env.example SynapseCode-ServiceChat/.env

# ServiceCodeSessions
cp SynapseCode-ServiceCodeSessions/.env.example SynapseCode-ServiceCodeSessions/.env

# ServiceExecutionCode
cp SynapseCode-ServiceExecutionCode/.env.example SynapseCode-ServiceExecutionCode/.env

# ServiceFeedback
cp SynapseCode-ServiceFeedback/.env.example SynapseCode-ServiceFeedback/.env
```

**Variables Críticas:**
```env
# Compartidas en todos los servicios
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=AuthServiceSynapseCodeSecureJWTKeyWith256Bits!!!
JWT_ISSUER=SynapseCodeService
JWT_AUDIENCE=SynapseCodeService

# AuthService (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SynapseCodeDB
DB_USER=postgres
DB_PASSWORD=your_password

# ServiceChat (IA)
GROQ_API_KEY=your_groq_api_key

# ServiceExecutionCode (Código)
JUDGE0_API_KEY=your_judge0_api_key
```

---

## Ejecución

### Opción 1: Ejecutar Todos (Recomendado)
```bash
cd c:\SynapseCode
pnpm run dev
```

**Output esperado:**
```
Levantando todos los microservicios SynapseCode...

[AuthService] iniciando en puerto 3006...
[ServiceRoom] iniciando en puerto 3007...
[ServiceChat] iniciando en puerto 3008...
[ServiceCodeSessions] iniciando en puerto 3009...
[ServiceExecutionCode] iniciando en puerto 3010...
[ServiceFeedback] iniciando en puerto 3011...

Todos los servicios listos:
   ● AuthService: http://localhost:3006/api-docs
   ● ServiceRoom: http://localhost:3007/api-docs
   ● ServiceChat: http://localhost:3008/api-docs
   ● ServiceCodeSessions: http://localhost:3009/api-docs
   ● ServiceExecutionCode: http://localhost:3010/api-docs
   ● ServiceFeedback: http://localhost:3011/api-docs

CTRL+C para detener todos
```

### Opción 2: Ejecutar Individualmente (Terminal Separadas)

**Terminal 1 - AuthService:**
```bash
cd AuthService
pnpm dev
```

**Terminal 2 - ServiceRoom:**
```bash
cd SynapseCode-ServiceRoom
pnpm dev
```

**Terminal 3 - ServiceChat:**
```bash
cd SynapseCode-ServiceChat
pnpm dev
```

**Terminal 4 - ServiceCodeSessions:**
```bash
cd SynapseCode-ServiceCodeSessions
pnpm dev
```

**Terminal 5 - ServiceExecutionCode:**
```bash
cd SynapseCode-ServiceExecutionCode
pnpm dev
```

### Verificar que Todo Funciona
```bash
# En otra terminal:
curl http://localhost:3006/api-docs    # AuthService
curl http://localhost:3007/api-docs    # ServiceRoom
curl http://localhost:3008/api-docs    # ServiceChat
curl http://localhost:3009/api-docs    # ServiceCodeSessions
curl http://localhost:3010/api-docs    # ServiceExecutionCode
```

---

## Documentación API (Swagger)

Cada servicio tiene documentación completa en **Swagger/OpenAPI**.

### Acceder a Swagger
- **AuthService:** http://localhost:3006/api/v1/docs
- **ServiceRoom:** http://localhost:3007/api-docs
- **ServiceChat:** http://localhost:3008/api-docs
- **ServiceCodeSessions:** http://localhost:3009/api-docs
- **ServiceExecutionCode:** http://localhost:3010/api-docs
- **ServiceFeedback:** http://localhost:3011/api-docs

### Funciones Principales en Swagger
- Ver todos los endpoints
- Probar endpoints directamente (Try it out)
- Ver esquemas de request/response
- Descargar OpenAPI JSON

### Autenticar en Swagger
1. En cualquier servicio, hacer un login en **AuthService**
2. Copiar el token JWT obtenido
3. Hacer click en el botón **Authorize** (arriba a la derecha)
4. Pegar: `Bearer YOUR_TOKEN_HERE`
5. Probar endpoints protegidos

---

## Flujos Principales

### 1. Crear una Sala (ServiceRoom → ServiceChat)

```
Cliente
  │
  ├─ POST /api/v1/auth/login (AuthService)
  │   └─ Obtiene JWT token
  │
  └─ POST /api/v1/rooms (ServiceRoom)
      ├─ Crea documento Room en MongoDB
      ├─ Crea RoomParticipation del host
      │
      └─ HTTP POST → ServiceChat
          └─ /api/v1/chats/batch-create
             ├─ Crea 2 chats (CHAT_SALA, CHAT_IA)
             └─ Retorna chats creados
      
      └─ Response al cliente
         {
           "_id": "ObjectId",
           "roomCode": "ABC-A1B-22C",
           "roomName": "Mi Sala",
           "chatsCreated": true,
           "chats": [...]
         }
```

**Si ServiceChat está caído:**
- La sala se crea igual (degradación graciosa)
- Se retorna `chatsCreated: false`
- Cliente informado del estado

### 2. Enviar Mensaje (ServiceChat)

```
Cliente
  │
  └─ POST /api/v1/messages (ServiceChat)
      ├─ Crea documento Message en MongoDB
      ├─ Obtiene información del Chat asociado
      │
      └─ Response al cliente
         {
           "_id": "ObjectId",
           "content": "Hola a todos",
           "senderUserId": "usr_xxx",
           "chartId": "cht_xxx",
           "chat": { chatId, numberChat, chatType },
           "createdAt": "2026-04-06T10:30:00Z"
         }
```

### 3. Ejecutar Código (ServiceExecutionCode → Judge0)

```
Cliente
  │
  └─ POST /api/v1/codeExecutions/run (ServiceExecutionCode)
      ├─ HTTP POST → Judge0 API
      │   └─ `https://judge0-api.com/submissions`
      │
      ├─ Registra ejecución en MongoDB
      │
      └─ Response al cliente
         {
           "executionId": "exec_xxx",
           "language": "python",
           "output": "Hello World",
           "stderr": null,
           "executionTime": 125,
           "statusId": 3 // Completed
         }
```

### 4. Guardar Versión de Código (ServiceCodeSessions)

```
Cliente
  │
  └─ POST /api/v1/codeSessions (ServiceCodeSessions)
      ├─ Crea documento CodeSession en MongoDB
      ├─ Incrementa version counter
      │
      └─ Response al cliente
         {
           "_id": "ObjectId",
           "fileId": "file_xxx",
           "version": 5,
           "code": "print('Hello')",
           "language": "python",
           "savedByUserId": "usr_xxx",
           "savedAt": "2026-04-06T10:30:00Z"
         }
```

---

## Autenticación

### Flujo de JWT

```javascript
// 1. Cliente obtiene token
POST /api/v1/auth/login (AuthService)
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "usr_abc123",
    "username": "john_doe",
    "email": "user@example.com",
    "role": "USER_ROLE"
  }
}
```

```javascript
// 2. Cliente incluye token en cada request
GET /api/v1/rooms (ServiceRoom)
Headers:
  x-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  // O
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
// 3. Servicio valida JWT
validateJWT middleware:
  ├─ Verifica firma del token
  ├─ Valida issuer y audience
  ├─ Extrae datos del usuario → req.user
  └─ next()
```

### Roles y Permisos

```javascript
// USER_ROLE - Usuario regular
- Crear salas
- Crear archivos
- Enviar mensajes
- Ejecutar código
- Ver salas propias

// ADMIN_ROLE - Administrador
- Todas las acciones de USER_ROLE
- Eliminar cualquier sala/archivo
- Ver y auditar usuarios
- Ver auditoría de ejecuciones

// HOST_ROLE (sub-rol en sala)
- Editar sala
- Eliminar sala
- Gestionar participantes
- Finalizar sala
```

---

## Base de Datos

### MongoDB - SynapseCodeDB (Compartida)

Todas las colecciones en **un solo MongoDB**:

```
SynapseCodeDB/
├── rooms              (ServiceRoom)
├── roomparticipations (ServiceRoom)
├── files              (ServiceRoom)
├── chats              (ServiceChat)
├── messages           (ServiceChat)
├── explanations       (ServiceChat)
├── codesessions       (ServiceCodeSessions)
├── codeexecutions     (ServiceExecutionCode)
└── sessions           (Sesiones)
```

**Ventajas:**
- Transacciones ACID entre servicios
- Único source of truth
- Sin duplicación de datos
- Relaciones directas sin join lógico

### PostgreSQL - AuthService
```
Database: SynapseCodeDB
Tables:
  ├── users
  ├── roles
  ├── permissions
  └── sessions
```

---

## Configuración de Entorno

### Variables Globales (todos los servicios)

```env
# Entorno
NODE_ENV=development

# Base de datos MongoDB
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB

# JWT
JWT_SECRET=AuthServiceSynapseCodeSecureJWTKeyWith256Bits!!!
JWT_ISSUER=SynapseCodeService
JWT_AUDIENCE=SynapseCodeService
JWT_EXPIRES_IN=24h

# URLs de servicios (para comunicación HTTP)
AUTH_SERVICE_URL=http://localhost:3006
CHAT_SERVICE_URL=http://localhost:3008
```

### AuthService (.env)

```env
PORT=3006
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SynapseCodeDB
DB_USER=postgres
DB_PASSWORD=your_password
JWT_REFRESH_EXPIRES_IN=7d
```

### ServiceChat (.env)

```env
PORT=3008
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

### ServiceExecutionCode (.env)

```env
PORT=3010
JUDGE0_API_KEY=your_judge0_key_here
JUDGE0_BASE_URL=https://judge0-api.com
JUDGE0_TIMEOUT=30000
```

---

## Testing con Postman

### Importar Colección

1. Descargar colección:
   ```
   Endpoints/SynapseCode.postman_collection.json
   ```

2. En Postman:
   - `File` → `Import` → Seleccionar archivo
   - Se crearán carpetas por servicio

### Configurar Environment

En Postman, crear environment con:
```json
{
  "base_url_auth": "http://localhost:3006",
  "base_url_room": "http://localhost:3007",
  "base_url_chat": "http://localhost:3008",
  "base_url_sessions": "http://localhost:3009",
  "base_url_execution": "http://localhost:3010",
  "token": ""
}
```

### Flujo de Testing Recomendado

1. **AuthService:**
   - POST /api/v1/auth/login (Obtener token)
   - Guardar token en variable de environment

2. **ServiceRoom:**
   - POST /api/v1/rooms (Crear sala)
   - Guardar roomId y roomCode
   - GET /api/v1/rooms (Listar salas)
   - GET /api/v1/rooms/code/:code (Obtener por código)

3. **ServiceChat:**
   - GET /api/v1/chats?roomId=... (Ver chats de sala)
   - POST /api/v1/messages (Enviar mensaje)
   - GET /api/v1/messages?roomId=... (Ver mensajes)

4. **ServiceCodeSessions:**
   - POST /api/v1/codeSessions (Guardar versión)
   - GET /api/v1/codeSessions/file/:fileId (Ver historial)

5. **ServiceExecutionCode:**
   - POST /api/v1/codeExecutions/run (Ejecutar código)
   - GET /api/v1/codeExecutions/:executionId (Ver resultado)

---

## Troubleshooting

### Error: "ECONNREFUSED" en puerto 3007/3008/etc.

**Causa:** Servicios no están levantados

**Solución:**
```bash
# Opción 1: Levantar todos
pnpm run dev

# Opción 2: Verificar que estén levantados
curl http://localhost:3006/api-docs
curl http://localhost:3007/api-docs
```

### Error: "MongoDB connection failed"

**Causa:** MongoDB no está corriendo

**Solución:**
```bash
# Iniciar MongoDB
mongod

# Verificar conexión
mongo --eval "db.version()"
```

### Error: "JWT validation failed"

**Causa:** Token expirado o JWT_SECRET incorrecto

**Solución:**
1. Obtener nuevo token: `POST /api/v1/auth/login`
2. Verificar `JWT_SECRET` en `.env`
3. Asegurar que sea igual en todos los servicios

### Error: "Service unavailable" en ServiceChat

**Causa:** ServiceChat no responde (pero room se crea igual)

**Solución:**
1. Reiniciar ServiceChat
2. Verificar `CHAT_SERVICE_URL` en `.env`
3. Logs: `console.debug('Chat service error:', err?.message)`

### Error: "CORS error"

**Causa:** Headers no configurados correctamente

**Solución:**
- Swagger UI maneja CORS automáticamente
- Si es desde Frontend, configurar CORS en nginx/proxy

---

## Monitoreo

### Verificar Servicios

```bash
# Health check de cada servicio
curl http://localhost:3006/api-docs
curl http://localhost:3007/api-docs
curl http://localhost:3008/api-docs
curl http://localhost:3009/api-docs
curl http://localhost:3010/api-docs

# Todos deberían retornar HTML (Swagger)
```

### Logs

Cada servicio imprime logs en consola:
- INFO - Operaciones normales
- WARN - Advertencias (ej: ServiceChat caído)
- ERROR - Errores críticos

---

## Notas de Desarrollo

### Cambios Respecto al Monolito Original

| Feature | Monolito | Microservicios | Cambio |
|---------|----------|----------------|--------|
| Arquitectura | Único servidor | 6 servicios | Mejor escalabilidad |
| Chats en rooms | No incluidos | Incluidos | Mejor UX |
| Resiliencia | N/A | Fallback si ServiceChat cae | Más robusto |
| Swagger | Local | Uno por servicio | Mejor documentación |
| JWT | Centralizado | Validación en c/servicio | Más secure |
| BD | Monolito | Compartida | Mismo modelo |

### Planes Futuros

- [ ] API Gateway (Kong/Nginx)
- [ ] Circuit Breaker (Resilience4j)
- [ ] Rate Limiting por servicio
- [ ] Caché distribuido (Redis)
- [ ] Event-driven (RabbitMQ/Kafka)
- [ ] Docker + Kubernetes
- [ ] Observabilidad (ELK Stack)

---

## Soporte

Para reportar problemas o sugerencias:
1. Revisar esta documentación
2. Consultar `Swagger` de cada servicio
3. Verificar `.env` y conexiones de BD
4. Revisar logs en consola

---

**Última actualización:** 6 de abril de 2026  
**Status:** Completado y validado  
**Versión:** 1.0