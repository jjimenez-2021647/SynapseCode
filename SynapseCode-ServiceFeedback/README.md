# SynapseCode-ServiceFeedback

Microservicio de comentarios y sugerencias de la comunidad para la plataforma SynapseCode.

## Descripcion

Sistema de feedback de la comunidad que permite a los usuarios:
- Crear comentarios/sugerencias
- Editar sus propios comentarios (dentro de 30 minutos)
- Eliminar comentarios (autor o admin)
- Votar comentarios (toggle, un voto por usuario)
- Buscar comentarios por texto
- Ver comentarios ordenados por popularidad

## Arquitectura

- **Framework:** Express.js (Node.js)
- **Base de Datos:** MongoDB con Mongoose
- **Puerto:** 3011
- **Autenticación:** JWT (via middleware)
- **Documentación:** Swagger/OpenAPI

## Instalacion

```bash
# Instalar dependencias
pnpm install

# O si usas npm
npm install
```

## Configuracion de Entorno

Crear archivo `.env` con las siguientes variables:

```env
# Server
PORT=3011
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/SynapseCodeDB

# JWT
JWT_SECRET=tu_clave_secreta_jwt
JWT_ISSUER=SynapseCode
JWT_AUDIENCE=SynapseCode-Services

# Services
AUTH_SERVICE_URL=http://localhost:3006
```

## Ejecucion

### Desarrollo (con hot-reload)
```bash
pnpm dev
```

### Producción
```bash
pnpm start
```

## Documentacion API

La documentación interactiva está disponible en:
```
http://localhost:3011/api-docs
```

### Endpoints Principales

#### Comentarios
- `GET /api/v1/feedback/comments` - Listar comentarios (público)
- `GET /api/v1/feedback/comments/:commentId` - Obtener un comentario (público)
- `POST /api/v1/feedback/comments` - Crear comentario (requiere auth)
- `PUT /api/v1/feedback/comments/:commentId` - Editar comentario (solo autor, < 30 min)
- `DELETE /api/v1/feedback/comments/:commentId` - Eliminar comentario (autor o admin)

#### Votos
- `POST /api/v1/feedback/comments/:commentId/vote` - Votar/Desvotar (toggle)

## Base de Datos

### Colecciones

#### `feedback_comments`
```javascript
{
    _id: ObjectId,
    userId: String,              // ID del usuario que crea
    content: String,             // 3-1000 caracteres
    voteCount: Number,           // Contador de votos (default: 0)
    isEdited: Boolean,           // Flag de edición
    editedAt: Date,              // Fecha de última edición
    createdAt: Timestamp,        // Timestamp de creación
    updatedAt: Timestamp         // Timestamp de actualización
}
```

Índices:
- `content: 'text'` - Búsqueda de texto
- `voteCount: -1` - Ordenamiento por votos
- `userId: 1` - Búsqueda por autor

#### `feedback_votes`
```javascript
{
    _id: ObjectId,
    commentId: ObjectId,         // Referencia a comentario
    userId: String,              // ID del usuario que vota
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

Índices:
- `{ commentId: 1, userId: 1 }` - **UNIQUE** - Garantiza un voto por usuario/comentario

## Autenticacion

El servicio valida JWT mediante el middleware `validateJWT`:

```javascript
// Token en header
x-token: jwt_token_aqui

// O en Authorization
Authorization: Bearer jwt_token_aqui
```

El payload del token debe contener:
```javascript
{
    userId: String,
    role: 'USER_ROLE' | 'ADMIN_ROLE',
    ...
}
```

## Reglas de Negocio

### Comentarios
- Cualquier usuario autenticado puede crear comentarios
- Solo el autor puede editar su comentario
- La edicion solo es posible dentro de **30 minutos** de la creacion
- El autor o un ADMIN_ROLE pueden eliminar
- Despues de eliminar, se eliminan todos sus votos asociados

### Votos
- Solo un voto positivo por usuario/comentario
- Si el usuario vota de nuevo, se quita el voto (toggle)
- El contador de votos se actualiza automaticamente

### Listado
- Publico para todos los roles
- Ordenado por `voteCount` descendente (mas populares primero)
- Soporta busqueda por texto (full-text search)
- Soporta paginacion

## Testing con Ejemplos

### Crear comentario
```bash
curl -X POST http://localhost:3011/api/v1/feedback/comments \
  -H "Content-Type: application/json" \
  -H "x-token: tu_jwt_token" \
  -d '{
    "content": "Excelente plataforma para aprender programación"
  }'
```

### Listar comentarios con búsqueda
```bash
curl "http://localhost:3011/api/v1/feedback/comments?search=excelente&page=1&limit=20"
```

### Votar un comentario
```bash
curl -X POST http://localhost:3011/api/v1/feedback/comments/[COMMENT_ID]/vote \
  -H "x-token: tu_jwt_token"
```

### Editar comentario (dentro de 30 minutos)
```bash
curl -X PUT http://localhost:3011/api/v1/feedback/comments/[COMMENT_ID] \
  -H "Content-Type: application/json" \
  -H "x-token: tu_jwt_token" \
  -d '{
    "content": "Contenido actualizado"
  }'
```

## Respuestas

### Éxito
```json
{
    "success": true,
    "message": "Operación exitosa",
    "data": { /* datos */ }
}
```

### Error
```json
{
    "success": false,
    "message": "Descripción del error",
    "error": "ERROR_CODE"
}
```

## Troubleshooting

### MongoDB no conecta
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solución:** Verifica que MongoDB está corriendo en tu máquina o actualiza `MONGODB_URI` en `.env`

### Token inválido
```
Error: INVALID_TOKEN
```
**Solución:** Verifica que el JWT en el header coincide con la `JWT_SECRET` configurada

### Tiempo de edición expirado
```
Error: EDIT_TIME_EXPIRED
```
**Solución:** Solo puedes editar comentarios dentro de 30 minutos de su creación

## Integracion con la Arquitectura

Este servicio se comunica con:
- **AuthService (3006)** - Validación de JWT
- **MongoDB SynapseCodeDB** - Almacenamiento compartido

## Notas

- Los comentarios eliminados también eliminan sus votos asociados
- La búsqueda de texto es case-insensitive
- Los timestamps se generan automáticamente en MongoDB
- El voteCount nunca puede ser negativo

## Variables de Entorno

| Variable | Descripción | Defecto |
|----------|-------------|---------|
| PORT | Puerto del servicio | 3011 |
| NODE_ENV | Entorno (development/production) | development |
| MONGODB_URI | URI de conexión MongoDB | mongodb://localhost:27017/SynapseCodeDB |
| JWT_SECRET | Clave secreta para validar JWT | - |
| JWT_ISSUER | Emisor del JWT | SynapseCode |
| JWT_AUDIENCE | Audiencia del JWT | SynapseCode-Services |

## Licencia

MIT

---

**Última actualización:** Abril 2026
