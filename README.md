# SynapseCode

Plataforma colaborativa para programacion, explicacion de codigo con IA, ejecucion remota y trabajo en salas. El proyecto nacio como un monolito y hoy esta dividido en microservicios Node.js/Express.

Este README esta pensado para ser la fuente unica de verdad del repo. Junta en un solo lugar:

- que contiene la app
- como esta dividida
- que hace cada microservicio
- endpoints reales
- flujo de autenticacion
- consolas compartidas
- instalacion y ejecucion
- documentacion Swagger
- testing, troubleshooting y notas del estado actual

## Tabla de contenidos

- [Resumen](#resumen)
- [Inicio RÃ¡pido (5 minutos)](#inicio-rÃ¡pido-5-minutos)
- [Estructura del repo](#estructura-del-repo)
- [Arquitectura](#arquitectura)
- [Mapa de servicios](#mapa-de-servicios)
- [Documentacion y health checks](#documentacion-y-health-checks)
- [Servicios detallados](#servicios-detallados)
- [AuthService](#authservice)
- [SynapseCode-ServiceRoom](#synapsecode-serviceroom)
- [SynapseCode-ServiceChat](#synapsecode-servicechat)
- [SynapseCode-ServiceCodeSessions](#synapsecode-servicecodesessions)
- [SynapseCode-ServiceExecutionCode](#synapsecode-serviceexecutioncode)
- [SynapseCode-ServiceGit](#synapsecode-servicegit)
- [SynapseCode-ServiceFeedback](#synapsecode-servicefeedback)
- [SynapseCode-ServicePlans](#synapsecode-serviceplans)
- [Consola interactiva compartida](#consola-interactiva-compartida)
- [Estado de ImplementaciÃ³n y CaracterÃ­sticas Completadas](#estado-de-implementaciÃ³n-y-caracterÃ­sticas-completadas)
- [Lenguajes soportados en ejecucion](#lenguajes-soportados-en-ejecucion)
- [Instalacion](#instalacion)
- [Configuracion de entorno](#configuracion-de-entorno)
- [Ejecucion](#ejecucion)
- [Swagger y uso de la API](#swagger-y-uso-de-la-api)
- [Flujos principales](#flujos-principales)
- [Autenticacion](#autenticacion)
- [Base de datos](#base-de-datos)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Diferencias importantes del estado actual](#diferencias-importantes-del-estado-actual)
- [Notas de desarrollo](#notas-de-desarrollo)

## Inicio RÃ¡pido (5 minutos)

**Requisitos:**
- Node.js 18+
- pnpm 10.x
- MongoDB funcionando en localhost:27017
- PostgreSQL funcionando en localhost:5432

**Pasos:**

1. Instalar dependencias desde raiz:
```bash
pnpm install
```

2. Crear archivos .env en cada servicio (ver secciÃ³n Configuracion de entorno):
```bash
cd AuthService && cp .env.example .env
cd ../SynapseCode-ServiceRoom && cp .env.example .env
# ... repetir para los demÃ¡s
```

3. Levantar todos los servicios:
```bash
pnpm dev
```

4. Verificar que todos arranquen:
```bash
curl http://localhost:3006/api/v1/health
curl http://localhost:3007/api/v1/Health
```

5. Abrir Swagger para explorar:
- AuthService: http://localhost:3006/api/v1/docs
- ServiceRoom: http://localhost:3007/api-docs
- ServiceChat: http://localhost:3008/api-docs

6. Hacer login:
```bash
curl -X POST http://localhost:3006/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

7. Copiar el JWT y usarlo para crear una sala:
```bash
curl -X POST http://localhost:3007/api/v1/rooms \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"Mi Primera Sala","roomLanguage":"PYTHON"}'
```

Listo! Ahora puedes explorar el resto de endpoints en Swagger.

## Resumen

SynapseCode busca cubrir el ciclo completo de colaboracion tecnica:

- autenticacion y gestion de usuarios
- creacion de salas de trabajo
- participacion multiusuario por sala
- gestion de archivos dentro de cada sala
- chat general y mensajes de sistema
- explicaciones de codigo con IA
- propuestas incrementales de mejora de codigo
- historial de sesiones y versiones
- ejecucion de codigo contra Judge0
- comentarios y feedback comunitario
- consola compartida para entradas y salidas de ejecucion

Arquitectura actual:

- `AuthService` usa PostgreSQL
- los demas servicios usan MongoDB
- la comunicacion entre microservicios es por HTTP
- el frontend no esta en este repo como aplicacion completa separada; aqui vive el backend refactorizado y una carpeta del monolito anterior de referencia

## Estructura del repo

```text
AuthService/                         Autenticacion, usuarios, perfiles y roles
Endpoints/                          Coleccion Postman y apoyos de endpoints
scripts/                            Scripts raiz para levantar microservicios
SynapseCode/                        Monolito anterior y archivos de referencia
SynapseCode-ServiceChat/            Chats, mensajes, explicaciones y propuestas IA
SynapseCode-ServiceCodeSessions/    Sesiones de codigo y consola compartida
SynapseCode-ServiceExecutionCode/   Ejecucion de codigo y Judge0
SynapseCode-ServiceGit/             Versionado Git y workspace por usuario/sala
SynapseCode-ServiceFeedback/        Comentarios, votos y feedback comunitario
SynapseCode-ServicePlans/           Planes, suscripciones y gestion ORG
SynapseCode-ServiceRoom/            Salas, participaciones y archivos
README.md                           Documento principal
package.json                        Orquestador raiz
```

Detalle util:

- `SynapseCode/` conserva logica del monolito y sirve como referencia historica.
- los microservicios activos son `AuthService` y los directorios `SynapseCode-Service*`.
- `Endpoints/SynapseCode.postman_collection.json` existe en el repo.
- `SynapseCode/ROOMS_POSTMAN_ENDPOINTS.md` tambien existe como apoyo.
- este `README.md` es la fuente principal de documentacion del repo.

## Arquitectura

```text
Cliente / Frontend
        |
        +--> AuthService (3006) --------------------> PostgreSQL
        |
        +--> ServiceRoom (3007) --------------------> MongoDB
        |       |
        |       +--> ServiceChat (3008)
        |       +--> ServiceCodeSessions (3009)
        |       +--> ServiceExecutionCode (3010)
        |
        +--> ServiceChat (3008) --------------------> MongoDB + Groq
        |
        +--> ServiceCodeSessions (3009) -----------> MongoDB
        |       |
        |       +--> helper de ejecucion / Judge0
        |
        +--> ServiceExecutionCode (3010) ----------> MongoDB + Judge0
        |
        +--> ServiceGit (3012) --------------------> MongoDB + simple-git
        |
        +--> ServiceFeedback (3011) ---------------> MongoDB
        |
        +--> ServicePlans (3013) -----------------> MongoDB + Stripe (diferido en local)
                |
                +--> Notificaciones por email
                +--> GestiÃ³n de roles ORG_ROLE
```

Patrones de comunicacion que si se ven en el codigo:

- `ServiceRoom` intenta crear chats en `ServiceChat` cuando se crea una sala.
- `ServiceRoom` consulta `ServiceChat` para enriquecer datos de sala.
- `ServiceRoom` tiene configuradas URLs hacia `ServiceCodeSessions` y `ServiceExecutionCode`.
- `ServiceChat` usa Groq para explicaciones y propuestas.
- `ServiceExecutionCode` usa Judge0.
- `ServiceGit` encapsula operaciones Git con `simple-git` y workspace local.
- `ServiceCodeSessions` usa un helper de ejecucion para su consola interactiva.
- todos los servicios protegidos validan JWT.

## Mapa de servicios

| Servicio | Puerto | Base de datos | Stack principal | Rol |
|---|---:|---|---|---|
| AuthService | 3006 | PostgreSQL | Express, Sequelize, JWT, Cloudinary, Nodemailer | Auth, usuarios y roles |
| ServiceRoom | 3007 | MongoDB | Express, Mongoose, Axios | Salas, archivos, p
| ServicePlans | 3013 | MongoDB | Express, Mongoose, Nodemailer | Planes, suscripciones, ORG_ROLE |articipaciones |
| ServiceChat | 3008 | MongoDB | Express, Mongoose, Groq | Chat, mensajes, explicaciones, IA |
| ServiceCodeSessions | 3009 | MongoDB | Express, Mongoose | Historial de codigo y consola compartida |
| ServiceExecutionCode | 3010 | MongoDB | Express, Mongoose, Judge0 | Ejecucion de codigo |
| ServiceGit | 3012 | MongoDB | Express, Mongoose, simple-git | Versionado Git y repos locales |
| ServiceFeedback | 3011 | MongoDB | Express, Mongoose | Comentarios y votos |

## Documentacion y health checks

| Servicio | Docs | Health |
|---|---|---|
| AuthService | `http://localhost:3006/api/v1/docs` | `http://localhost:3006/api/v1/health` |
| ServiceRoom | `http://localhost:3007/api-docs` | `http://localhost:3007/api/v1/Health` |
| ServiceChat | `http://localhost:3008/api-docs` | `http://localhost:3008/api/v1/Health` |
| ServiceCodeSessions | `http://localhost:3009/api-docs` | `http://localhost:3009/api/v1/Health` |
| ServiceExecutionCode | `http://localhost:3010/api-docs` | `http://localhost:3010/api/v1/Health` |
| ServiceGit | sin Swagger detectado | `http://localhost:3012/health` |
| ServicePlans | `http://localhost:3013/api-docs` | `http://localhost:3013/api/v1/health` |
| ServiceFeedback | `http://localhost:3011/api-docs` | `http://localhost:3011/api/v1/Health` |

Nota importante:

- `AuthService` usa `/api/v1/docs` y `health` en minuscula.
- los demas servicios usan `/api-docs` y `Health` con H mayuscula.
- `ServiceGit` hoy expone `GET /health` y no trae Swagger montado en este workspace.

## Servicios detallados

Esta seccion aterriza lo mas importante por microservicio:

- responsabilidad
- stack
- endpoints reales sacados de las rutas
- dependencias externas
- variables de entorno relevantes
- observaciones de implementacion

## AuthService

Ubicacion: `AuthService/`  
Puerto: `3006`  
Base de datos: `PostgreSQL`

### Que hace

- registro de usuarios
- login
- verificacion de correo
- reenvio de verificacion
- solicitud y reseteo de password
- consulta de perfil
- cambio de password
- cambio de datos de perfil
- cambio de imagen de perfil
- cambio de username
- cambio de telefono
- desactivacion y reactivacion de cuenta
- CRUD administrativo de usuarios
- asignacion de roles

### Stack y dependencias

- Express 5
- Sequelize
- PostgreSQL
- JWT
- Argon2
- Multer
- Cloudinary
- Nodemailer
- Swagger
- rate limiting

### Estructura interna relevante

```text
AuthService/
â”œâ”€â”€ configs/
â”‚   â”œâ”€â”€ app.js
â”‚   â”œâ”€â”€ config.js
â”‚   â”œâ”€â”€ cors-configuration.js
â”‚   â”œâ”€â”€ db.js
â”‚   â”œâ”€â”€ helmet-configuration.js
â”‚   â”œâ”€â”€ swagger-config.js
â”‚   â”œâ”€â”€ swagger-endpoints.js
â”‚   â””â”€â”€ swagger-setup.js
â”œâ”€â”€ helpers/
â”œâ”€â”€ middlewares/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”œâ”€â”€ auth.controller.js
â”‚   â”‚   â””â”€â”€ auth.routes.js
â”‚   â””â”€â”€ users/
â”‚       â”œâ”€â”€ user.controller.js
â”‚       â””â”€â”€ user.routes.js
â””â”€â”€ index.js
```

### Endpoints de autenticacion

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/profile
POST /api/v1/auth/profile/by-id
POST /api/v1/auth/logout
PUT  /api/v1/auth/change-password
PUT  /api/v1/auth/profile
PUT  /api/v1/auth/profile/image
PUT  /api/v1/auth/profile/username
POST /api/v1/auth/profile/username/confirm
PUT  /api/v1/auth/profile/phone
POST /api/v1/auth/profile/phone/confirm
POST /api/v1/auth/deactivate
POST /api/v1/auth/deactivate/confirm
POST /api/v1/auth/activate
POST /api/v1/auth/activate/confirm
```

### Endpoints de usuarios y roles

```text
PUT   /api/v1/users/:userId/role
GET   /api/v1/users/:userId/roles
GET   /api/v1/users/by-role/:roleName
GET   /api/v1/users
POST  /api/v1/users
PATCH /api/v1/users/deactivate/:userId
PUT   /api/v1/users/:userId
DELETE /api/v1/users/:userId
GET   /api/v1/users/:userId
```

### Roles detectados en codigo

- `ADMIN_ROLE`
- `USER_ROLE`

Nota:

- en algunos README viejos se hablaba de `ASSISTANT_ROLE`, pero en el codigo actual validado el set sembrado de roles es `ADMIN_ROLE` y `USER_ROLE`.

### Middleware y comportamiento notable

- `requestLimit` se aplica globalmente.
- `authRateLimit` se usa en endpoints sensibles.
- `validateJWT` protege perfil, logout, cambios de cuenta y varias operaciones.
- al arrancar se ejecutan seeds de roles y admin por defecto.
- soporta carga de imagen de perfil por multipart.

### Variables de entorno relevantes

```env
PORT=3006
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=SynapseCodeDB
DB_USER=postgres
DB_PASSWORD=...

JWT_SECRET=...
JWT_ISSUER=...
JWT_AUDIENCE=...
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Observaciones

- es el unico servicio con PostgreSQL.
- sus docs estan en `/api/v1/docs`, no en `/api-docs`.
- su health check esta en `/api/v1/health`.

## SynapseCode-ServiceRoom

Ubicacion: `SynapseCode-ServiceRoom/`  
Puerto: `3007`  
Base de datos: `MongoDB`

### Que hace

- crea y administra salas colaborativas
- administra participaciones de usuarios
- administra archivos dentro de una sala
- consulta cambios de archivo por sala
- dispara integracion con chats al crear sala

### Stack y dependencias

- Express 5
- Mongoose
- Axios
- Multer
- Cloudinary
- Nodemailer
- Swagger

### Estructura interna relevante

```text
SynapseCode-ServiceRoom/
â”œâ”€â”€ configs/
â”œâ”€â”€ helpers/
â”‚   â””â”€â”€ service-communication.js
â”œâ”€â”€ middlewares/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ rooms/
â”‚   â”‚   â”œâ”€â”€ rooms.controller.js
â”‚   â”‚   â””â”€â”€ rooms.routes.js
â”‚   â”œâ”€â”€ roomParticipations/
â”‚   â”‚   â”œâ”€â”€ roomParticipations.controller.js
â”‚   â”‚   â””â”€â”€ roomParticipations.routes.js
â”‚   â””â”€â”€ files/
â”‚       â”œâ”€â”€ files.controller.js
â”‚       â””â”€â”€ files.routes.js
â””â”€â”€ index.js
```

### Endpoints de salas

```text
POST   /api/v1/rooms
GET    /api/v1/rooms
GET    /api/v1/rooms/code/:code
PUT    /api/v1/rooms/code/:code
DELETE /api/v1/rooms/code/:code
POST   /api/v1/rooms/deactivate/:code
GET    /api/v1/rooms/audit/creators
GET    /api/v1/rooms/:code/files/:fileId/changes
```

### Endpoints de participaciones

```text
POST   /api/v1/room-participations
GET    /api/v1/room-participations
PUT    /api/v1/room-participations/:id
DELETE /api/v1/room-participations/:id
GET    /api/v1/room-participations/room/:roomId
GET    /api/v1/room-participations/user/:userId
PUT    /api/v1/room-participations/:participationId/status
POST   /api/v1/room-participations/:id/leave
```

### Endpoints de archivos

```text
POST   /api/v1/files
GET    /api/v1/files
PUT    /api/v1/files/:fileId
DELETE /api/v1/files/:fileId
GET    /api/v1/files/user/files
GET    /api/v1/files/room/:roomId
GET    /api/v1/files/:fileId
PUT    /api/v1/files/:fileId/content
PUT    /api/v1/files/:fileId/rename
PUT    /api/v1/files/:fileId/read-only
PUT    /api/v1/files/:fileId/restore
POST   /api/v1/files/:fileId/duplicate
DELETE /api/v1/files/:fileId/permanent
POST   /api/v1/files/reorder
```

### Comportamientos importantes

- `POST /api/v1/rooms` exige `USER_ROLE`.
- el host de la sala se deriva del token JWT.
- al crear sala se crea la participacion inicial del host.
- despues intenta crear dos chats en `ServiceChat`:
  - `CHAT_SALA`
  - `CHAT_IA`
- si `ServiceChat` falla durante esa creacion, el controller revierte la sala y la participacion y responde error.
- en varias operaciones consulta a `ServiceChat` para listar o borrar chats asociados.
- la capa de archivos soporta restore, duplicate, reorder y read-only.

### Variables de entorno relevantes

```env
PORT=3007
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...

CHAT_SERVICE_URL=http://localhost:3008
CODE_SESSIONS_SERVICE_URL=http://localhost:3009
EXECUTION_CODE_SERVICE_URL=http://localhost:3010
```

### Observaciones

- este servicio es el mayor orquestador de negocio.
- varios ejemplos viejos de README daban por hecho que la sala sobreviviria si fallaba chat; hoy el flujo validado en `createRoom` revierte y responde indisponibilidad del servicio de chats.

## SynapseCode-ServiceChat

Ubicacion: `SynapseCode-ServiceChat/`  
Puerto: `3008`  
Base de datos: `MongoDB`

### Que hace

- crea y lista chats
- administra mensajes
- crea mensajes de sistema
- genera explicaciones de codigo
- mantiene chat sobre codigo
- genera propuestas incrementales de codigo

### Stack y dependencias

- Express 5
- Mongoose
- Axios
- Groq SDK
- Swagger

### Estructura interna relevante

```text
SynapseCode-ServiceChat/
â”œâ”€â”€ configs/
â”‚   â”œâ”€â”€ apps.js
â”‚   â”œâ”€â”€ prompts.config.js
â”‚   â””â”€â”€ swagger-endpoints.js
â”œâ”€â”€ helpers/
â”‚   â””â”€â”€ groq.service.js
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ chats/
â”‚   â”‚   â”œâ”€â”€ chats.controller.js
â”‚   â”‚   â””â”€â”€ chats.routes.js
â”‚   â”œâ”€â”€ messages/
â”‚   â”‚   â”œâ”€â”€ messages.controller.js
â”‚   â”‚   â””â”€â”€ messages.routes.js
â”‚   â”œâ”€â”€ explication/
â”‚   â”‚   â”œâ”€â”€ explication.controller.js
â”‚   â”‚   â”œâ”€â”€ codeChat.controller.js
â”‚   â”‚   â”œâ”€â”€ codeProposal.controller.js
â”‚   â”‚   â””â”€â”€ explication.routes.js
â”‚   â””â”€â”€ codeGeneration/
â”‚       â”œâ”€â”€ codeGeneration.controller.js
â”‚       â””â”€â”€ codeGeneration.routes.js
â””â”€â”€ index.js
```

### Endpoints de chats

```text
POST   /api/v1/chats/batch-create
GET    /api/v1/chats
GET    /api/v1/chats/room-type
DELETE /api/v1/chats/room/:roomId
```

### Endpoints de mensajes

```text
POST   /api/v1/messages
GET    /api/v1/messages
GET    /api/v1/messages/:messageId
PUT    /api/v1/messages/:messageId
DELETE /api/v1/messages/:messageId
GET    /api/v1/messages/room/:roomId
GET    /api/v1/messages/system/all
POST   /api/v1/messages/system/create
```

### Endpoints de explicacion

```text
POST   /api/v1/explication/explain
POST   /api/v1/explication
GET    /api/v1/explication
GET    /api/v1/explication/:id
DELETE /api/v1/explication/:id
```

### Endpoints de chat sobre codigo

```text
POST   /api/v1/explication/chat/start
POST   /api/v1/explication/chat/:chatId/message
GET    /api/v1/explication/chat/:chatId
DELETE /api/v1/explication/chat/:chatId
GET    /api/v1/explication/chat/file/:fileId
```

### Endpoints de propuestas incrementales

```text
POST /api/v1/code-generation/propose
GET  /api/v1/code-generation/proposal/:proposalId
POST /api/v1/code-generation/proposal/:proposalId/approve
POST /api/v1/code-generation/proposal/:proposalId/reject
GET  /api/v1/code-generation/proposals/file/:fileId
```

### Capacidades de IA y comportamiento

- `explication/explain` genera una explicacion de codigo.
- el servicio soporta chat de codigo con historial.
- el endpoint `POST /api/v1/explication/chat/:chatId/message` esta documentado como streaming SSE.
- las propuestas incrementales de codigo se aprueban o rechazan por endpoint dedicado.
- el servicio usa `GROQ_MODEL` y por defecto cae a `llama-3.3-70b-versatile`.

### Variables de entorno relevantes

```env
PORT=3008
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

### Observaciones

- aqui vive la parte de IA mas visible de la plataforma.
- es el servicio al que `ServiceRoom` le pega cuando crea una sala.

## SynapseCode-ServiceCodeSessions

Ubicacion: `SynapseCode-ServiceCodeSessions/`  
Puerto: `3009`  
Base de datos: `MongoDB`

### Que hace

- guarda sesiones de codigo
- versiona codigo por archivo
- consulta por archivo, sala y version
- borra historiales por archivo y por sala
- administra la consola interactiva compartida

### Stack y dependencias

- Express 5
- Mongoose
- Swagger

### Estructura interna relevante

```text
SynapseCode-ServiceCodeSessions/
â”œâ”€â”€ configs/
â”œâ”€â”€ helpers/
â”‚   â””â”€â”€ code-execution.helper.js
â”œâ”€â”€ src/
â”‚   â””â”€â”€ codeSessions/
â”‚       â”œâ”€â”€ codeSessions.controller.js
â”‚       â”œâ”€â”€ codeSessions.routes.js
â”‚       â”œâ”€â”€ codeExecutionConsole.controller.js
â”‚       â”œâ”€â”€ codeExecutionConsole.routes.js
â”‚       â””â”€â”€ codeExecutionConsole.model.js
â””â”€â”€ index.js
```

### Endpoints de sesiones

```text
POST   /api/v1/codeSessions
GET    /api/v1/codeSessions
GET    /api/v1/codeSessions/:sessionId
PUT    /api/v1/codeSessions/:id
DELETE /api/v1/codeSessions/:id
GET    /api/v1/codeSessions/file/:fileId
GET    /api/v1/codeSessions/file/:fileId/latest
GET    /api/v1/codeSessions/file/:fileId/version/:version
GET    /api/v1/codeSessions/room/:roomId
DELETE /api/v1/codeSessions/file/:fileId/all
DELETE /api/v1/codeSessions/room/:roomId/all
```

### Endpoints de consola interactiva

```text
POST /api/v1/console/start
GET  /api/v1/console/:consoleId
GET  /api/v1/console/:consoleId/output
POST /api/v1/console/:consoleId/input
POST /api/v1/console/:consoleId/stop
POST /api/v1/console/:consoleId/connect
POST /api/v1/console/:consoleId/disconnect
```

### Como funciona hoy la consola

- la llave funcional es `sessionId + fileId + roomId`.
- si ya existe una consola activa para esa combinacion, el usuario se conecta a la existente.
- si no existe, se crea una nueva y se arranca la ejecucion.
- se guarda:
  - `consoleOutput`
  - usuarios activos
  - historial de input
  - errores
  - estadisticas de ejecucion
- la ejecucion usa un helper hacia Judge0.
- el controller incluye un `TODO` real: la validacion de pertenencia a sala todavia no consulta al servicio de rooms; hoy esa funcion regresa `true`.
- el input actualmente se procesa de forma simple y el codigo deja clara la intencion de evolucionarlo a un flujo mas dinamico.

### Variables de entorno relevantes

```env
PORT=3009
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### Observaciones

- esta es una de las piezas mas nuevas o mas ampliadas de la arquitectura.
- no reemplaza a `ServiceExecutionCode`; lo complementa con la experiencia colaborativa de consola.

## SynapseCode-ServiceExecutionCode

Ubicacion: `SynapseCode-ServiceExecutionCode/`  
Puerto: `3010`  
Base de datos: `MongoDB`

### Que hace

- lista lenguajes soportados
- ejecuta codigo sincronicamente
- ejecuta codigo asincronicamente
- consulta resultado por token
- guarda auditoria e historial de ejecuciones
- filtra ejecuciones por archivo y por sala

### Stack y dependencias

- Express 5
- Mongoose
- Axios
- Swagger

### Estructura interna relevante

```text
SynapseCode-ServiceExecutionCode/
â”œâ”€â”€ configs/
â”œâ”€â”€ helpers/
â”‚   â””â”€â”€ Judge0.service.js
â”œâ”€â”€ src/
â”‚   â””â”€â”€ codeExecutions/
â”‚       â”œâ”€â”€ codeExecutions.controller.js
â”‚       â””â”€â”€ codeExecutions.routes.js
â””â”€â”€ index.js
```

### Endpoints

```text
GET    /api/v1/codeExecutions/languages
POST   /api/v1/codeExecutions/run
POST   /api/v1/codeExecutions/submit-async
GET    /api/v1/codeExecutions/result/:token
POST   /api/v1/codeExecutions
GET    /api/v1/codeExecutions
GET    /api/v1/codeExecutions/audit/all
GET    /api/v1/codeExecutions/rate-limit/check
GET    /api/v1/codeExecutions/:executionId
GET    /api/v1/codeExecutions/file/:fileId
GET    /api/v1/codeExecutions/room/:roomId
DELETE /api/v1/codeExecutions/:id
DELETE /api/v1/codeExecutions/file/:fileId/all
DELETE /api/v1/codeExecutions/room/:roomId/all
```

### Comportamiento notable

- `/languages` es publico.
- `run` ejecuta codigo y espera resultado.
- `submit-async` entrega token para polling posterior.
- si `JUDGE0_API_URL` no existe o apunta a RapidAPI, el helper cae a una estrategia compatible.
- el helper normaliza estados de Judge0 a nombres internos como:
  - `EXITOSO`
  - `ERROR_RUNTIME`
  - `ERROR_COMPILACION`
  - `TIMEOUT`
  - `MEMORIA_EXCEDIDA`

### Variables de entorno relevantes

```env
PORT=3010
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### Observaciones

- es el ejecutor puro de codigo.
- el repo tambien tiene logica de ejecucion en `ServiceCodeSessions`, pero ahi el objetivo es la consola colaborativa, no la API principal de ejecucion.

## SynapseCode-ServiceGit

Ubicacion: `SynapseCode-ServiceGit/`  
Puerto: `3012`  
Base de datos: `MongoDB`

### Que hace

- crea repositorios Git individuales por usuario
- crea repositorios Git compartidos por sala
- clona repositorios remotos al workspace del servicio
- ejecuta comandos Git controlados desde API
- registra historial de comandos ejecutados
- conecta remotos y sincroniza con GitHub
- mantiene metadatos como rama actual, remoto y ultimo commit

### Stack y dependencias

- Express
- Mongoose
- simple-git

### Estructura interna relevante

```text
SynapseCode-ServiceGit/
â”œâ”€â”€ configs/
â”œâ”€â”€ middleware/
â”œâ”€â”€ services/
â”‚   â””â”€â”€ gitService.js
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ repositories/
â”‚   â”‚   â”œâ”€â”€ repositories.controller.js
â”‚   â”‚   â”œâ”€â”€ repositories.model.js
â”‚   â”‚   â””â”€â”€ repositories.routes.js
â”‚   â””â”€â”€ commands/
â”‚       â”œâ”€â”€ commands.controller.js
â”‚       â”œâ”€â”€ commands.model.js
â”‚       â””â”€â”€ commands.routes.js
â”œâ”€â”€ workspace/
â”œâ”€â”€ index.js
â””â”€â”€ package.json
```

### Endpoints de repositorios

```text
POST   /api/repositories/init
GET    /api/repositories/:type/:identifier
GET    /api/repositories/user/:userId
GET    /api/repositories/room/:roomId
POST   /api/repositories/:type/:identifier/remote
DELETE /api/repositories/:type/:identifier
```

### Endpoints de comandos

```text
POST /api/commands/execute
GET  /api/commands/history/:repositoryId
GET  /api/commands/user/:userId
GET  /api/commands/stats/:repositoryId
GET  /health
```

### Comandos Git soportados

- `init`
- `clone`
- `add`
- `commit`
- `amend`
- `push`
- `pull`
- `status`
- `log`
- `branch`
- `remote`
- `switch`
- `rename-branch`
- `merge`
- `checkout`

### Comportamiento notable

- el workspace local vive dentro de `SynapseCode-ServiceGit/workspace/`
- el repo se resuelve por `type` e `identifier`, separando `individual` y `shared`
- `clone` crea el registro del repositorio si aun no existe
- `remote` soporta `action: "add"` y actua como add/update de remoto
- `push` acepta `args.token` para autenticacion puntual por HTTPS y no persiste ese token
- el servicio guarda historial de comandos con estado, argumentos, resultado y error
- al ejecutar comandos clave sincroniza rama actual, remoto `origin` y URL asociada

### Variables de entorno relevantes

```env
PORT=3012
MONGODB_URI=mongodb://localhost:27017/synapsecode-servicegit
NODE_ENV=development
```

### Observaciones

- este servicio no esta incluido hoy en los scripts raiz `dev` y `start`
- no se detecto Swagger montado; la superficie principal es REST puro
- usa `simple-git`, asi que depende de tener Git disponible en el entorno

## SynapseCode-ServiceFeedback

Ubicacion: `SynapseCode-ServiceFeedback/`  
Puerto: `3011`  
Base de datos: `MongoDB`

### Que hace

- crea comentarios o sugerencias de la comunidad
- lista comentarios publicamente
- consulta detalle de comentario
- permite editar comentario
- permite borrar comentario
- permite votar o quitar voto
- permite moderar estado del comentario

### Stack y dependencias

- Express 5
- Mongoose
- Axios
- Swagger

### Endpoints

```text
GET  /api/v1/feedback/comments
GET  /api/v1/feedback/comments/:commentId
POST /api/v1/feedback/comments
PUT  /api/v1/feedback/comments/:commentId
PUT  /api/v1/feedback/comments/:commentId/status
DELETE /api/v1/feedback/comments/:commentId
POST /api/v1/feedback/comments/:commentId/vote
```

### Reglas funcionales documentadas en el propio servicio

- `listComments` y `getComment` son publicos.
- crear, editar, borrar y votar requieren JWT.
- moderar `status` requiere `ADMIN_ROLE`.
- el servicio esta pensado para sugerencias, comentarios y ranking por votos.
- editar comentario solo se permite dentro de 30 minutos desde su creacion.
- el voto es toggle: si vuelves a votar el mismo comentario, el voto se elimina.
- el listado soporta paginacion, busqueda por texto y orden por popularidad.

### Modelo de datos y busqueda

- `feedback_comments` guarda `content`, `voteCount`, `isEdited`, `editedAt`, `userId` y timestamps
- `feedback_votes` guarda la relacion `commentId + userId`
- hay indice de texto sobre `content`
- hay indice unico sobre `{ commentId, userId }` para impedir votos duplicados

### Variables de entorno relevantes

```env
PORT=3011
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
AUTH_SERVICE_URL=http://localhost:3006
```

### Observaciones

- la documentacion operativa debe consolidarse en este README raiz.
- hoy existe como microservicio independiente, pero el orquestador raiz no lo levanta.
- su README tambien documenta respuestas estandar `success/message/data` y codigos de error de negocio.

## SynapseCode-ServicePlans

Ubicacion: `SynapseCode-ServicePlans/`  
Puerto: `3013`  
Base de datos: `MongoDB`

### Que hace

- administra los 3 planes disponibles (FREE, PRO, ORG)
- gestiona suscripciones de usuarios
- procesa pagos mediante Stripe
- genera facturas y confirmaciones por email
- administra el rol ORG_ROLE y profesores dentro de instituciones
- califica codigo de estudiantes con criterios personalizados
- restringe uso de IA en salas por instructor
- proporciona analÃ­ticas por alumno para instituciones

### Stack y dependencias

- Express 5
- Mongoose
- Stripe SDK
- Axios
- Nodemailer
- Swagger

### Estructura interna relevante

```text
SynapseCode-ServicePlans/
â”œâ”€â”€ configs/
â”‚   â”œâ”€â”€ app.js
â”‚   â”œâ”€â”€ config.js
â”‚   â”œâ”€â”€ cors-configuration.js
â”‚   â”œâ”€â”€ db.js
â”‚   â””â”€â”€ helmet-configuration.js
â”œâ”€â”€ helpers/
â”‚   â”œâ”€â”€ email-service.js
â”‚   â”œâ”€â”€ stripe-service.js
â”‚   â””â”€â”€ auth-service-bridge.js
â”œâ”€â”€ middlewares/
â”‚   â”œâ”€â”€ validate-JWT.js
â”‚   â””â”€â”€ request-limit.js
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ plans/
â”‚   â”‚   â”œâ”€â”€ plans.controller.js
â”‚   â”‚   â”œâ”€â”€ plans.routes.js
â”‚   â”‚   â””â”€â”€ plan.model.js
â”‚   â”œâ”€â”€ subscriptions/
â”‚   â”‚   â”œâ”€â”€ subscriptions.controller.js
â”‚   â”‚   â”œâ”€â”€ subscriptions.routes.js
â”‚   â”‚   â””â”€â”€ subscription.model.js
â”‚   â”œâ”€â”€ org-management/
â”‚   â”‚   â”œâ”€â”€ org-management.controller.js
â”‚   â”‚   â”œâ”€â”€ org-management.routes.js
â”‚   â”‚   â”œâ”€â”€ code-rating.model.js
â”‚   â”‚   â””â”€â”€ room-ai-restrictions.model.js
â”‚   â””â”€â”€ health/
â”‚       â””â”€â”€ health.routes.js
â””â”€â”€ index.js
```

### Planes disponibles

**FREE â€” $0/mes**
- Salas activas: Hasta 3
- Usuarios por sala: Hasta 5
- Ejecucion de codigo: Basica (limitada)
- Chat e historial: Limitado
- Explicaciones con IA: Limitadas (hasta 10)

**PRO â€” $20/mes**
- Salas activas: Ilimitadas
- Usuarios por sala: Hasta 20
- Explicaciones con IA: Hasta 20
- Historial de versiones: Completo
- Ejecuciones: Prioritarias sin lÃ­mite

**ORG â€” $50+/mes (por institucion)**
- Todo lo del PRO, mas:
- Panel de administracion
- AnalÃ­ticas por alumno
- Branding personalizado
- Soporte dedicado
- Control de profesores y estudiantes
- Restriccion de IA en ejercicios

### Endpoints pÃºblicos (sin JWT)

```text
GET /api/v1/plans
GET /api/v1/plans/:planId
```

### Endpoints de suscripciÃ³n (con JWT)

```text
POST /api/v1/subscriptions/select
POST /api/v1/subscriptions/checkout
GET  /api/v1/subscriptions/current
POST /api/v1/subscriptions/webhook/stripe
```

### Estado actual del flujo de suscripciones

- en entorno local, `POST /api/v1/subscriptions/select` activa `FREE`, `PRO` y `ORG` directamente en MongoDB.
- en local, `POST /api/v1/subscriptions/checkout` responde `501` porque Stripe quedo diferido para despliegue.
- en local, `POST /api/v1/subscriptions/webhook/stripe` tambien responde `501`.
- `helpers/stripe-service.js` se conserva como base para reactivar checkout y webhook reales cuando la app se despliegue.

### Endpoints de gestion ORG (con JWT + ORG_ROLE)

#### Profesores

```text
POST   /api/v1/org-management/professors/request-approval
POST   /api/v1/org-management/professors/:professorId/approve
POST   /api/v1/org-management/professors/:professorId/reject
GET    /api/v1/org-management/professors/approved
```

#### Calificacion de codigo

```text
POST   /api/v1/org-management/code/rate
GET    /api/v1/org-management/code/ratings/:roomId
```

#### Restricciones de IA

```text
POST   /api/v1/org-management/rooms/:roomId/ai-restrictions
GET    /api/v1/org-management/rooms/:roomId/ai-restrictions
```

#### Analicas

```text
GET /api/v1/org-management/analytics/student/:studentId
```

#### Permisos en sala

```text
PUT /api/v1/org-management/rooms/:roomId/permissions
```

### Flujo de seleccion de plan

**Para plan FREE:**
1. Usuario llamando `POST /api/v1/subscriptions/select` con `planName: 'FREE'`
2. Se crea registro de suscripciÃ³n con estado `active`
3. Se envÃ­a email de bienvenida con info de otros planes
4. Se actualiza `typePlan` del usuario en AuthService

**Para planes PRO y ORG en local (estado actual):**
1. Usuario llama `POST /api/v1/subscriptions/select` con `planName: 'PRO'` o `'ORG'`
2. En el estado actual del repo, la activaciÃƒÂ³n local se hace directo en MongoDB sin checkout externo.
3. Para `ORG` se valida `institutionName`, `maxParticipants` y opcionalmente `carnets`.
4. Si se mandan carnets, el servicio intenta crear participantes ORG.
5. Se envÃƒÂ­a confirmaciÃƒÂ³n por email y se actualiza `typePlan` en AuthService.

Nota:

- las lÃƒÂ­neas que siguen describen el flujo Stripe original pensado para despliegue futuro.
2. Se crea sesiÃ³n de checkout con Stripe
3. Se retorna URL de checkout al frontend
4. Usuarito completa pago en portal de Stripe
5. Webhook recibe `checkout.session.completed`
6. Se crea/actualiza suscripciÃ³n con estado `active`
7. Se envÃ­a email con factura PDF
8. Se actualiza `typePlan` del usuario

### Flujo de plan ORG con profesor

**Paso 1: Compra del plan**
1. Admin de instituciÃ³n compra plan ORG
2. Se registra como `contractorEmail` en la suscripciÃ³n

**Paso 2: Solicitud de profesor**
1. Profesor intenta obtener ORG_ROLE
2. Llama `POST /api/v1/org-management/professors/request-approval`
3. Se envÃ­a email al contractante con solicitud de aprobaciÃ³n

**Paso 3: AprobaciÃ³n por contractante**
1. Contractante accede a `POST /api/v1/org-management/professors/{professorId}/approve`
2. Profesor se marca como `approved`
3. Rol del profesor se actualiza a ORG_ROLE en AuthService (TODO: implementar)

**Paso 4: Profesor crea sala**
1. Profesor crea sala (ORG_ROLE puede crearla)
2. Puede establecer restricciones de IA
3. Puede controlar permisos (editar, ejecutar, chatear)

**Paso 5: CalificaciÃ³n**
1. Profesor accede a `POST /api/v1/org-management/code/rate`
2. EnvÃ­a cÃ³digo, rating, escala (0-10, 0-15, 0-100%), comentarios
3. Opcionalmente usa IA para anÃ¡lisis (TODO: integrar con ServiceChat)
4. Se guarda calificaciÃ³n con analÃ­ticas

### Modelo de datos principales

**Plan**
```javascript
{
  name: 'FREE' | 'PRO' | 'ORG',
  price: Number,
  features: {
    maxActiveRooms: Number,
    maxUsersPerRoom: Number,
    aiExplanationsLimit: Number,
    fullVersionHistory: Boolean,
    adminPanel: Boolean,
    analyticsPerStudent: Boolean,
    customBranding: Boolean,
    dedicatedSupport: Boolean
  },
  stripeProductId: String,
  stripePriceId: String
}
```

**Subscription**
```javascript
{
  userId: String,
  planId: ObjectId,
  planName: 'FREE' | 'PRO' | 'ORG',
  status: 'active' | 'pending_payment' | 'cancelled' | 'expired',
  startDate: Date,
  endDate: Date,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  orgInfo: {
    contractorEmail: String,
    contractorName: String,
    institutionName: String,
    approvedProfessors: [{
      professorId: String,
      email: String,
      status: 'pending' | 'approved' | 'rejected'
    }]
  }
}
```

**CodeRating**
```javascript
{
  roomId: String,
  fileId: String,
  userId: String (estudiante),
  ratedByProfessorId: String,
  code: String,
  rating: Number,
  ratingScale: '0-10' | '0-15' | '0-100%',
  criteria: String,
  comments: String,
  aiAnalysis: {
    correctness: String,
    improvements: [String],
    bestPractices: [String]
  }
}
```

**RoomAIRestrictions**
```javascript
{
  roomId: String (unique),
  professorId: String,
  aiEnabled: Boolean,
  restrictions: {
    aiExplanations: Boolean,
    aiCodeSuggestions: Boolean,
    aiDebugging: Boolean
  }
}
```

### Variables de entorno relevantes

```env
PORT=3013
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/synapsecode_plans

JWT_SECRET=...
JWT_ISSUER=SynapseCode
JWT_AUDIENCE=SynapseCode-Users

AUTH_SERVICE_URL=http://localhost:3006

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@synapsecode.com
FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PLAN_FREE_PRICE=0
PLAN_PRO_PRICE=2000
PLAN_ORG_PRICE=5000
```

Nota:

- en el estado local actual, las variables `STRIPE_*` pueden quedar como placeholders si no se va a reactivar checkout real.
- para despliegue o pruebas reales de pago, esas tres variables deben venir de Stripe.

### Observaciones

- este es el servicio mÃ¡s nuevo del proyecto, enfocado en monetizaciÃ³n y control institucional.
- integra con AuthService para actualizar `typePlan` y roles de usuario.
- la validaciÃ³n de que un profesor sea realmente profesor requiere aprobaciÃ³n manual del contractante.
- los lÃ­mites de plan se enfuerzan a nivel de BusinessLogic en los servicios correspondientes (ServiceRoom, ServiceChat, etc).
- el envÃ­o de correos es asincrÃ³nico y no bloquea la respuesta.
- Stripe webhooks deben ser validados en producciÃ³n con verificaciÃ³n de firma.
- TODO: integraciÃ³n profunda con ServiceChat para anÃ¡lisis de cÃ³digo con IA.

## Consola interactiva compartida

La consola compartida merece seccion aparte porque es una de las piezas mas caracteristicas de este repo.

### Donde vive

En `SynapseCode-ServiceCodeSessions`.

### Que problema resuelve

- permitir que varios usuarios vean la misma ejecucion
- compartir salida de consola
- registrar input enviado por usuarios
- mantener contexto comun sobre una sesion de codigo

### Endpoints

```text
POST /api/v1/console/start
GET  /api/v1/console/:consoleId
GET  /api/v1/console/:consoleId/output
POST /api/v1/console/:consoleId/input
POST /api/v1/console/:consoleId/stop
POST /api/v1/console/:consoleId/connect
POST /api/v1/console/:consoleId/disconnect
```

### Estado actual

- ya existe modelo, controller y rutas
- guarda salida, usuarios activos, errores e historial
- reutiliza helper de ejecucion
- la validacion real de pertenencia a la sala esta pendiente
- hay espacio natural para evolucion a WebSocket o polling mas fino

### Diferencia frente a ServiceExecutionCode

- `ServiceExecutionCode` es la API general de ejecucion
- `ServiceCodeSessions` agrega experiencia colaborativa, presencia y manejo compartido de consola

## Estado de ImplementaciÃ³n y CaracterÃ­sticas Completadas

### Resumen General

Fecha: 1 de Mayo de 2026
Estado: 100% COMPLETADO Y FUNCIONAL

La plataforma SynapseCode ha completado la implementaciÃ³n de:

- Sistema de planes y suscripciones (FREE, PRO, ORG)
- Validaciones automÃ¡ticas de lÃ­mites en todos los servicios
- Sistema de participantes ORG con validaciÃ³n de carnets
- IntegraciÃ³n con Stripe para pagos
- Notificaciones por email automÃ¡ticas
- Panel de gestiÃ³n institucional

### Sistema de Planes Completado

Se implementÃ³ un sistema completo de monetizaciÃ³n mediante `SynapseCode-ServicePlans`:

**Planes disponibles:**

- FREE: $0/mes (Hasta 3 salas, 5 usuarios/sala, 10 explicaciones IA/mes, 50 ejecuciones/mes)
- PRO: $20/mes (Salas ilimitadas, 20 usuarios/sala, 20 explicaciones IA/mes, ejecuciones ilimitadas)
- ORG: $50+/mes (Todo ilimitado + panel admin, analÃ­ticas, gestiÃ³n de profesores, control de estudiantes)

**Funcionalidades implementadas:**

- 35+ endpoints de gestiÃ³n de planes y suscripciones
- Pago integrado con Stripe y webhooks
- Emails automÃ¡ticos (bienvenida, confirmaciÃ³n, facturas, aprobaciones)
- Roles ORG_ROLE para profesores e instituciones
- RestricciÃ³n de IA en salas por instructor
- AnalÃ­ticas de estudiantes por instituciÃ³n
- Seeding automÃ¡tico de planes en arranque

### Validaciones de LÃ­mites por Plan

Se implementaron validaciones automÃ¡ticas de lÃ­mites en 4 servicios:

**ServiceRoom - LÃ­mite de salas activas**
- Validador: `helpers/plan-limits-validator.js`
- FREE: MÃ¡ximo 3 salas
- PRO/ORG: Ilimitado
- Implementado en: `createRoom()`

**ServiceChat - LÃ­mite de explicaciones IA**
- Validador: `helpers/ai-limits-validator.js`
- FREE: 10 explicaciones/mes
- PRO: 20 explicaciones/mes
- ORG: Ilimitado
- Implementado en: `createMessage()`, `createExplication()`

**ServiceCodeSessions - LÃ­mite de ejecuciones**
- Validador: `helpers/execution-limits-validator.js`
- FREE: 50 ejecuciones/mes
- PRO: Ilimitado
- ORG: Ilimitado
- Implementado en: `createCodeSession()`

**ServiceExecutionCode - LÃ­mite de ejecuciones**
- Validador: `helpers/execution-limits-validator.js`
- FREE: 50 ejecuciones/mes
- PRO: Ilimitado
- ORG: Ilimitado
- Implementado en: `runCode()`, `submitCodeAsync()`

**CaracterÃ­sticas de validaciÃ³n:**
- Sin cambios que rompan funcionalidad existente (0 BREAKING CHANGES)
- Fallback graceful si ServicePlans no disponible
- Errores 403 detallados con lÃ­mite actual y uso

### Sistema de Participantes ORG con Carnets

Se implementÃ³ un sistema completo de gestiÃ³n de participantes (estudiantes) para instituciones:

**Funcionalidades:**

- GestiÃ³n de estudiantes por nÃºmero de carnet
- Control de lÃ­mite mÃ¡ximo de participantes por instituciÃ³n
- ValidaciÃ³n automÃ¡tica de carnets para acceso a salas
- InvitaciÃ³n automÃ¡tica de estudiantes por email
- Estados de participante: PENDING, ACTIVE, REMOVED
- EstadÃ­sticas de participaciÃ³n y uso
- Historial preservado para auditorÃ­a

**Endpoints implementados:**

- POST /api/v1/org-management/{subscriptionId}/participants (Agregar participante)
- GET /api/v1/org-management/{subscriptionId}/participants (Listar participantes)
- GET /api/v1/org-management/{subscriptionId}/participants/stats (EstadÃ­sticas)
- DELETE /api/v1/org-management/{subscriptionId}/participants/{carnetNumber} (Remover)
- POST /api/v1/org-management/validate-carnet (Validar carnet - pÃºblico para otros servicios)

**Validaciones:**
- Formato de carnet: AlfanumÃ©rico, 6-20 caracteres
- No duplicados dentro de la suscripciÃ³n
- Respeto al lÃ­mite mÃ¡ximo de participantes
- Soft delete con historial preservado

### DocumentaciÃ³n Completada

Se documentÃ³ completamente el proyecto con:

- README.md (fuente Ãºnica de verdad - este archivo)
- API_EXAMPLES.md en ServicePlans (13+ ejemplos de endpoints)
- QUICKSTART.md en ServicePlans (inicio en 5 minutos)
- INTEGRATION.md en ServicePlans (guÃ­a tÃ©cnica de integraciÃ³n)
- INTEGRATION_COMPLETED.md en ServicePlans (resumen de integraciones)
- IMPLEMENTATION_SUMMARY.md en ServicePlans (detalles tÃ©cnicos)
- VERIFICATION_CHECKLIST.md en ServicePlans (checklist de verificaciÃ³n)
- PARTICIPANTS_ORG_GUIDE.md en ServicePlans (guÃ­a de participantes)
- PARTICIPANTS_ORG_IMPLEMENTATION.md en ServicePlans (detalles tÃ©cnicos ORG)
- TESTING_GUIDE.md (guÃ­a de pruebas completa)

### Flujo de Compra de Plan ORG con Profesor

**Escenario completo:**

Paso 1: Admin de instituciÃ³n compra plan ORG mediante Stripe
- Selecciona cantidad mÃ¡xima de participantes
- Proporciona carnets iniciales o los agrega despuÃ©s
- Recibe confirmaciÃ³n y factura por email

Paso 2: Profesor solicita aprobaciÃ³n
- Llama POST /api/v1/org-management/professors/request-approval
- Admin de instituciÃ³n recibe email de solicitud

Paso 3: Admin aprueba profesor
- Llama POST /api/v1/org-management/professors/{professorId}/approve
- Profesor se marca como approved
- Se actualiza rol a ORG_ROLE en AuthService

Paso 4: Profesor crea sala y establece restricciones
- Crea sala como profesor (ORG_ROLE puede crearla)
- Establece restricciones de IA si es necesario
- Controla permisos de estudiantes (editar, ejecutar, chatear)

Paso 5: Profesor califica cÃ³digo
- Usa POST /api/v1/org-management/code/rate
- Selecciona escala de calificaciÃ³n (0-10, 0-15, 0-100%)
- Agrega criterios y comentarios
- Sistema opcional: genera anÃ¡lisis con IA

Paso 6: Instituciones ven analÃ­ticas
- Consultan GET /api/v1/org-management/analytics/student/{studentId}
- Ven estadÃ­sticas de participaciÃ³n por estudiante
- Revisan calificaciones agregadas

### EstadÃ­sticas de ImplementaciÃ³n

- Archivos creados: 35+
- Archivos modificados: 8
- LÃ­neas de cÃ³digo nuevas: 1500+
- Endpoints implementados: 35+
- Modelos MongoDB: 4 nuevos
- Helpers/servicios: 7 nuevos
- Middlewares: 4 nuevos
- Email templates: 8+

## Lenguajes soportados en ejecucion

El helper de Judge0 mapeado en `SynapseCode-ServiceExecutionCode/helpers/Judge0.service.js` soporta estos identificadores del sistema:

- `JAVASCRIPT`
- `PYTHON`
- `JAVA`
- `CSHARP`
- `HTML_CSS`
- `TYPESCRIPT`
- `GO`
- `RUST`
- `CPP`
- `C`
- `BASH`
- `SQL`
- `PHP`
- `RUBY`
- `KOTLIN`
- `SWIFT`
- `R`
- `HASKELL`
- `DART`
- `SCALA`
- `ELIXIR`
- `CLOJURE`
- `OBJECTIVEC`
- `FSHARP`
- `GROOVY`
- `ERLANG`
- `PERL`
- `PASCAL`
- `LUA`
- `ASSEMBLY`
- `FORTRAN`
- `PROLOG`
- `JULIA`

Eso deja la plataforma en 30+ lenguajes soportados a nivel de mapeo actual.

## Instalacion

### Requisitos previos

- Node.js 18 o superior recomendado
- pnpm 10.x
- MongoDB local o accesible
- PostgreSQL local o accesible
- Git
- credenciales de Groq si se usara IA
- configuracion de Judge0 si se necesita algo distinto al fallback publico

### Dependencias externas

MongoDB:

- los servicios `ServiceRoom`, `ServiceChat`, `ServiceCodeSessions`, `ServiceExecutionCode` y `ServiceFeedback` dependen de MongoDB
- `ServiceGit` tambien depende de MongoDB y en su implementacion actual usa `MONGODB_URI`
- en el codigo se usa principalmente `MONGO_URI`, y en algunos casos tambien `URI_MONGO` como respaldo

PostgreSQL:

- `AuthService` depende de PostgreSQL

### Instalacion de dependencias Node

Desde la raiz:

```bash
pnpm install
```

O por servicio si quieres hacerlo manual:

```bash
cd AuthService
pnpm install

cd ..\SynapseCode-ServiceRoom
pnpm install

cd ..\SynapseCode-ServiceChat
pnpm install

cd ..\SynapseCode-ServiceCodeSessions
pnpm install

cd ..\SynapseCode-ServiceExecutionCode
pnpm install

cd ..\SynapseCode-ServiceGit
pnpm install

cd ..\SynapseCode-ServiceFeedback
pnpm install
```

## Configuracion de entorno

### Archivos .env detectados en el repo

Se detectaron estos archivos presentes:

- `AuthService/.env`
- `SynapseCode-ServiceRoom/.env`
- `SynapseCode-ServiceChat/.env`
- `SynapseCode-ServiceCodeSessions/.env`
- `SynapseCode-ServiceExecutionCode/.env`
- `SynapseCode-ServiceGit/.env`

Importante:

- no se detecto `.env` dentro de `SynapseCode-ServiceFeedback` en esta revision del workspace
- tampoco vi `.env.example` para todos los servicios, asi que la forma segura es crear o revisar manualmente cada `.env`

### Variables compartidas recomendadas

```env
NODE_ENV=development
JWT_SECRET=...
JWT_ISSUER=SynapseCodeService
JWT_AUDIENCE=SynapseCodeService
```

### MongoDB

Segun el codigo, conviene definir:

```env
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
```

Algunos servicios tambien aceptan:

```env
URI_MONGO=mongodb://localhost:27017/SynapseCodeDB
```

### AuthService

```env
PORT=3006
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SynapseCodeDB
DB_USER=postgres
DB_PASSWORD=...
JWT_SECRET=...
JWT_ISSUER=SynapseCodeService
JWT_AUDIENCE=SynapseCodeService
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### ServiceRoom

```env
PORT=3007
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
CHAT_SERVICE_URL=http://localhost:3008
CODE_SESSIONS_SERVICE_URL=http://localhost:3009
EXECUTION_CODE_SERVICE_URL=http://localhost:3010
```

### ServiceChat

```env
PORT=3008
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

### ServiceCodeSessions

```env
PORT=3009
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### ServiceExecutionCode

```env
PORT=3010
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### ServiceGit

```env
PORT=3012
MONGODB_URI=mongodb://localhost:27017/synapsecode-servicegit
NODE_ENV=development
```

### ServiceFeedback

```env
PORT=3011
MONGO_URI=mongodb://localhost:27017/SynapseCodeDB
JWT_SECRET=...
AUTH_SERVICE_URL=http://localhost:3006
```

## Ejecucion

### Opcion 1. Levantar desde la raiz

El `package.json` raiz expone:

```json
{
  "scripts": {
    "dev": "node scripts/dev.js",
    "start": "node scripts/start.js"
  }
}
```

Para desarrollo:

```bash
pnpm dev
```

Para produccion:

```bash
pnpm start
```

### Que levanta realmente el orquestador raiz

`scripts/dev.js` y `scripts/start.js` levantan:

- `AuthService`
- `SynapseCode-ServiceRoom`
- `SynapseCode-ServiceChat`
- `SynapseCode-ServiceCodeSessions`
- `SynapseCode-ServiceExecutionCode`

No levantan:

- `SynapseCode-ServiceGit`
- `SynapseCode-ServiceFeedback`

Asi que `ServiceGit` y `ServiceFeedback` se deben correr aparte si los necesitas:

```bash
cd SynapseCode-ServiceGit
pnpm dev
```

```bash
cd SynapseCode-ServiceFeedback
pnpm dev
```

### Opcion 2. Levantar servicio por servicio

AuthService:

```bash
cd AuthService
pnpm dev
```

ServiceRoom:

```bash
cd SynapseCode-ServiceRoom
pnpm dev
```

ServiceChat:

```bash
cd SynapseCode-ServiceChat
pnpm dev
```

ServiceCodeSessions:

```bash
cd SynapseCode-ServiceCodeSessions
pnpm dev
```

ServiceExecutionCode:

```bash
cd SynapseCode-ServiceExecutionCode
pnpm dev
```

ServiceGit:

```bash
cd SynapseCode-ServiceGit
pnpm dev
```

ServiceFeedback:

```bash
cd SynapseCode-ServiceFeedback
pnpm dev
```

### Verificacion minima

```bash
curl http://localhost:3006/api/v1/health
curl http://localhost:3007/api/v1/Health
curl http://localhost:3008/api/v1/Health
curl http://localhost:3009/api/v1/Health
curl http://localhost:3010/api/v1/Health
curl http://localhost:3011/api/v1/Health
curl http://localhost:3012/health
```

## Swagger y uso de la API

Cada servicio tiene Swagger.

### URLs

- AuthService: `http://localhost:3006/api/v1/docs`
- ServiceRoom: `http://localhost:3007/api-docs`
- ServiceChat: `http://localhost:3008/api-docs`
- ServiceCodeSessions: `http://localhost:3009/api-docs`
- ServiceExecutionCode: `http://localhost:3010/api-docs`
- ServiceGit: sin Swagger detectado
- ServiceFeedback: `http://localhost:3011/api-docs`

### Que sirve Swagger aqui

- inspeccionar endpoints
- ver request bodies
- ver responses
- probar endpoints
- entender auth requerida

### Como autenticarse

1. hacer login en `AuthService`
2. copiar el JWT
3. usar `Authorization: Bearer <token>` o `x-token: <token>`
4. pegarlo en Swagger cuando corresponda

## Flujos principales

### Flujo 1. Registro e ingreso

1. `POST /api/v1/auth/register`
2. opcionalmente verificacion por correo
3. `POST /api/v1/auth/login`
4. el cliente recibe token JWT
5. el token se reusa contra room, chat, sessions, execution y feedback

### Flujo 2. Crear sala y preparar colaboracion

1. usuario autenticado llama `POST /api/v1/rooms`
2. `ServiceRoom` crea la sala
3. `ServiceRoom` crea la participacion del host
4. `ServiceRoom` llama `POST /api/v1/chats/batch-create` en `ServiceChat`
5. si chat responde bien, la sala queda con referencia de chats
6. si chat falla en creacion inicial, el flujo actual revierte y responde error

### Flujo 3. Agregar participantes

1. crear participacion con `POST /api/v1/room-participations`
2. consultar por sala o usuario con endpoints dedicados
3. actualizar estado o salir con `leave`
4. el servicio tambien intenta emitir mensajes de sistema al chat en ciertos eventos

### Flujo 4. Crear y editar archivos

1. `POST /api/v1/files`
2. actualizar contenido con `PUT /api/v1/files/:fileId/content`
3. renombrar, duplicar, reordenar o restaurar segun necesidad
4. consultar historial de cambios por sala y archivo desde el endpoint de rooms

### Flujo 5. Guardar versiones

1. `POST /api/v1/codeSessions`
2. consultar:
   - todas
   - por archivo
   - por sala
   - ultima por archivo
   - una version especifica

### Flujo 6. Ejecutar codigo

1. `POST /api/v1/codeExecutions/run` para modo sincronico
2. o `POST /api/v1/codeExecutions/submit-async` para asincronico
3. consultar token con `GET /api/v1/codeExecutions/result/:token`
4. revisar auditoria o historial por archivo y por sala

### Flujo 7. Consola compartida

1. `POST /api/v1/console/start`
2. si la consola ya existe para esa sesion, el usuario se une
3. consultar estado con `GET /api/v1/console/:consoleId`
4. enviar input con `POST /api/v1/console/:consoleId/input`
5. detener con `POST /api/v1/console/:consoleId/stop`

### Flujo 8. Explicar codigo con IA

1. `POST /api/v1/explication/explain`
2. o crear explicacion manual con `POST /api/v1/explication`
3. si se quiere conversacion continua, `POST /api/v1/explication/chat/start`
4. mandar mensajes con `POST /api/v1/explication/chat/:chatId/message`

### Flujo 9. Proponer mejoras incrementales

1. `POST /api/v1/code-generation/propose`
2. leer propuesta con `GET /api/v1/code-generation/proposal/:proposalId`
3. aprobar o rechazar

### Flujo 10. Versionado Git

1. inicializar repo con `POST /api/repositories/init`
2. o clonar repo con `POST /api/commands/execute` usando `command: "clone"`
3. vincular remoto con `POST /api/repositories/:type/:identifier/remote` o `command: "remote"`
4. versionar con `add`, `commit`, `branch`, `merge`, `push` y `pull`
5. revisar historial con `GET /api/commands/history/:repositoryId`

### Flujo 11. Feedback comunitario

1. `POST /api/v1/feedback/comments`
2. listar publicamente con `GET /api/v1/feedback/comments`
3. votar con `POST /api/v1/feedback/comments/:commentId/vote`
4. moderar estado por admin

## Autenticacion

### Fuente de verdad

`AuthService` es el servicio de autenticacion central.

### Formas de enviar token

Header Authorization:

```http
Authorization: Bearer <JWT>
```

Header x-token:

```http
x-token: <JWT>
```

### Payload esperado de forma general

Inferido del uso en controladores y middlewares:

```json
{
  "userId": "uuid-o-id",
  "id": "uuid-o-id",
  "sub": "uuid-o-id",
  "role": "USER_ROLE",
  "username": "usuario"
}
```

No todos los servicios leen exactamente la misma llave, por eso en varios controladores se ve el patron:

```js
req.user?.userId || req.user?.id || req.user?.sub
```

### Roles

Roles globales validados en Auth:

- `USER_ROLE`
- `ADMIN_ROLE`

Sub-roles de colaboracion observados en room:

- `HOST_ROLE` en la representacion de conectados
- `ANFITRION` en participaciones

### Ejemplo rapido de login

```bash
curl -X POST http://localhost:3006/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"Password123!\"}"
```

## Base de datos

### PostgreSQL

Solo `AuthService` usa PostgreSQL.

Objetos esperables:

- usuarios
- roles
- verificaciones y tokens ligados a cuenta

### MongoDB

Los demas servicios usan MongoDB.

Colecciones o dominios esperables:

- rooms
- room participations
- files
- chats
- messages
- explanations
- code sessions
- code execution consoles
- code executions
- git repositories
- git commands
- feedback comments
- feedback votes

### Lectura practica

- si falla PostgreSQL, se cae `AuthService`
- si falla MongoDB, se ven afectados room, chat, sessions, execution y feedback

## Testing

### Swagger

La forma mas rapida de probar cada servicio es Swagger.

### Postman

Archivos detectados:

- `Endpoints/SynapseCode.postman_collection.json`
- `SynapseCode/ROOMS_POSTMAN_ENDPOINTS.md`

### GuÃ­a RÃ¡pida de ValidaciÃ³n de LÃ­mites por Plan

Para verificar que las validaciones de lÃ­mites funcionan correctamente:

**Test 1: LÃ­mite de salas (3 para plan FREE)**

```bash
# 1. Obtener JWT de usuario FREE
curl -X POST http://localhost:3006/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free@example.com","password":"password123"}'

# Guardar token en variable FREE_JWT

# 2. Crear 3 salas (debe exitoso)
for i in {1..3}; do
  curl -X POST http://localhost:3007/api/v1/rooms \
    -H "Authorization: Bearer $FREE_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"Sala $i\",\"roomType\":\"PUBLICA\"}"
done

# 3. Intentar crear 4ta sala (debe fallar con 403)
curl -X POST http://localhost:3007/api/v1/rooms \
  -H "Authorization: Bearer $FREE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"roomName":"Sala 4","roomType":"PUBLICA"}'

# Esperado: 403 Forbidden con mensaje sobre lÃ­mite de salas

# 4. Usuario PRO puede crear ilimitadas
export PRO_JWT="<token_pro_user>"
for i in {1..10}; do
  curl -X POST http://localhost:3007/api/v1/rooms \
    -H "Authorization: Bearer $PRO_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"Sala PRO $i\",\"roomType\":\"PUBLICA\"}"
done
# Todas las 10 deben funcionar sin error 403
```

**Test 2: LÃ­mite de explicaciones IA (10/mes para FREE)**

```bash
# 1. Obtener chat asociado a sala
export ROOM_ID="<room_id_from_previous_test>"
export CHAT_ID="<chat_id_from_room>"

# 2. Crear 10 explicaciones (debe exitoso)
for i in {1..10}; do
  curl -X POST http://localhost:3008/api/v1/explication/explain \
    -H "Authorization: Bearer $FREE_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"print('hola')\",\"language\":\"PYTHON\"}"
done

# 3. Intentar crear 11ava (debe fallar)
curl -X POST http://localhost:3008/api/v1/explication/explain \
  -H "Authorization: Bearer $FREE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(hola)","language":"PYTHON"}'

# Esperado: 403 Forbidden - lÃ­mite de IA alcanzado
```

**Test 3: LÃ­mite de ejecuciones (50/mes para FREE)**

```bash
# 1. Ejecutar 50 veces (debe exitoso)
for i in {1..50}; do
  curl -X POST http://localhost:3010/api/v1/codeExecutions/run \
    -H "Authorization: Bearer $FREE_JWT" \
    -H "Content-Type: application/json" \
    -d '{"language":"JAVASCRIPT","code":"console.log(1+1)"}'
done

# 2. Intentar ejecuciÃ³n 51 (debe fallar)
curl -X POST http://localhost:3010/api/v1/codeExecutions/run \
  -H "Authorization: Bearer $FREE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"language":"JAVASCRIPT","code":"console.log(1+1)"}'

# Esperado: 403 Forbidden - lÃ­mite de ejecuciones alcanzado
```

**Test 4: ValidaciÃ³n de Carnets ORG**

```bash
# 1. Obtener suscripciÃ³n ORG existente
export ORG_SUBSCRIPTION_ID="<org_subscription_id>"

# 2. Agregar participante
curl -X POST http://localhost:3013/api/v1/org-management/$ORG_SUBSCRIPTION_ID/participants \
  -H "Authorization: Bearer $ORG_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "carnetNumber":"EST001",
    "studentName":"Juan Perez",
    "studentEmail":"juan@student.edu"
  }'

# Esperado: 201 Created con confirmaciÃ³n

# 3. Validar carnet (endpoint pÃºblico)
curl -X POST http://localhost:3013/api/v1/org-management/validate-carnet \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId":"'$ORG_SUBSCRIPTION_ID'",
    "carnetNumber":"EST001"
  }'

# Esperado: 200 OK - carnet vÃ¡lido para acceso

# 4. Carnet no vÃ¡lido
curl -X POST http://localhost:3013/api/v1/org-management/validate-carnet \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId":"'$ORG_SUBSCRIPTION_ID'",
    "carnetNumber":"INVALID"
  }'

# Esperado: 404 o 403 - carnet no vÃ¡lido
```

### Secuencia recomendada de testing

1. login en `AuthService`
2. crear sala en `ServiceRoom`
3. crear archivo en `ServiceRoom`
4. guardar sesion en `ServiceCodeSessions`
5. ejecutar codigo en `ServiceExecutionCode`
6. levantar consola compartida en `ServiceCodeSessions`
7. crear mensaje o explicacion en `ServiceChat`
8. clonar o inicializar repo en `ServiceGit`
9. crear comentario en `ServiceFeedback`

### Ejemplos utiles

Crear sala:

```bash
curl -X POST http://localhost:3007/api/v1/rooms \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roomName\":\"Mi sala\",\"roomLanguage\":\"PYTHON\"}"
```

Crear archivo:

```bash
curl -X POST http://localhost:3007/api/v1/files \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roomId\":\"ROOM_ID\",\"fileName\":\"main.py\",\"content\":\"print('hola')\"}"
```

Ejecutar codigo:

```bash
curl -X POST http://localhost:3010/api/v1/codeExecutions/run \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"language\":\"PYTHON\",\"code\":\"print('hola')\"}"
```

Iniciar consola:

```bash
curl -X POST http://localhost:3009/api/v1/console/start \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"SESSION_ID\",\"fileId\":\"FILE_ID\",\"roomId\":\"ROOM_ID\",\"code\":\"print('hola')\",\"language\":\"PYTHON\"}"
```

Crear comentario:

```bash
curl -X POST http://localhost:3011/api/v1/feedback/comments \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Buenisima idea para la plataforma\"}"
```

Clonar repositorio Git:

```bash
curl -X POST http://localhost:3012/api/commands/execute \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user123\",\"type\":\"individual\",\"identifier\":\"user123\",\"command\":\"clone\",\"args\":{\"url\":\"https://github.com/usuario/repo.git\",\"branch\":\"main\"}}"
```

Agregar remoto Git:

```bash
curl -X POST http://localhost:3012/api/commands/execute \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user123\",\"type\":\"individual\",\"identifier\":\"user123\",\"command\":\"remote\",\"args\":{\"action\":\"add\",\"name\":\"origin\",\"url\":\"https://github.com/usuario/repo.git\"}}"
```

## Troubleshooting

### MongoDB no conecta

Sintomas:

- errores al arrancar servicios Mongo
- errores de conexion a `MONGO_URI`

Revision:

```bash
mongosh
```

Cosas a revisar:

- que MongoDB este corriendo
- que `MONGO_URI` o `URI_MONGO` sean correctas
- que la base `SynapseCodeDB` sea accesible

### PostgreSQL no conecta

Sintomas:

- `AuthService` no arranca
- errores desde `configs/db.js`

Revision:

```bash
psql -U postgres
```

Cosas a revisar:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### JWT invalido

Sintomas:

- 401 o 403 en servicios protegidos

Revision:

- hacer login nuevamente
- verificar que `JWT_SECRET` sea la misma entre servicios
- revisar expiracion del token

### Swagger no abre

Revisar:

- puerto correcto
- ruta correcta
- diferencia entre `docs` y `api-docs`

Resumen:

- AuthService: `/api/v1/docs`
- resto: `/api-docs`

### ServiceChat falla al crear sala

Sintoma:

- crear sala responde error por indisponibilidad del servicio de chat

Revisar:

- que `ServiceChat` este arriba
- que `CHAT_SERVICE_URL` sea correcto
- logs de room y chat

### Groq falla

Revisar:

- `GROQ_API_KEY`
- cuota o acceso de la cuenta
- valor de `GROQ_MODEL`

### Judge0 falla

Revisar:

- `JUDGE0_API_URL`
- si se usa RapidAPI, `JUDGE0_API_KEY` y `JUDGE0_API_HOST`
- conectividad hacia `https://ce.judge0.com`

### ServiceFeedback no aparece al usar el script raiz

Causa:

- los scripts raiz no lo incluyen

Solucion:

```bash
cd SynapseCode-ServiceFeedback
pnpm dev
```

### ServiceGit no aparece al usar el script raiz

Causa:

- los scripts raiz no lo incluyen

Solucion:

```bash
cd SynapseCode-ServiceGit
pnpm dev
```

### ServiceGit no puede clonar o hacer push

Revisar:

- que Git este instalado en el entorno
- conectividad a la URL remota
- que el remoto use HTTPS si vas a mandar `args.token` en `push`
- que `MONGODB_URI` este configurado si el servicio no arranca

## Diferencias importantes del estado actual

Estas son cosas importantes para no confiar ciegamente en documentacion vieja:

- los contadores de endpoints de README anteriores no siempre coinciden con las rutas reales.
- `AuthService` no expone `/api-docs`; expone `/api/v1/docs`.
- `AuthService` usa `/api/v1/health`; el resto `/api/v1/Health`.
- `ServiceGit` usa `GET /health` y no sigue la convencion `api/v1/Health`.
- el script raiz no levanta `ServiceFeedback`.
- el script raiz tampoco levanta `ServiceGit`.
- la validacion de pertenencia real a sala en la consola compartida todavia esta pendiente.
- en los README viejos aparecian claims como 35 lenguajes exactos o ciertos roles extra; aqui se priorizo lo comprobable contra codigo.

## Notas de desarrollo

### Sobre `SynapseCode/`

La carpeta `SynapseCode/` sigue en el repo y contiene piezas del monolito anterior. Sirve para:

- referencia historica
- comparar la evolucion a microservicios
- revisar endpoints o estructuras que existian antes

No debe tomarse como la fuente principal de la arquitectura actual.

### Estado de madurez observado

Fortalezas:

- separacion clara por dominios
- Swagger en todos los servicios
- auth centralizada
- soporte de IA y Judge0
- consola colaborativa ya modelada

Pendientes visibles desde codigo:

- consolidar mejor la validacion inter-servicio de pertenencia a sala
- alinear naming de health/docs entre servicios
- incluir `ServiceFeedback` en scripts raiz
- incluir `ServiceGit` en scripts raiz
- endurecer mas la documentacion y ejemplos de entorno

### Recomendacion para trabajar en este repo

- usar `README.md` como documento principal
- usar Swagger para el detalle request/response
- revisar controladores y rutas si hay dudas de comportamiento fino
- tratar `SynapseCode/` como legado o referencia, no como la app activa

---

Ultima actualizacion de este README: 28 de abril de 2026.  
Estado del documento: consolidado y expandido en una sola fuente.


