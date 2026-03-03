# Endpoints de Rooms - Postman Collection

**Base URL:** `http://localhost:3007/api/v1`

---

## 1. CREATE ROOM (POST)
**URL:** `http://localhost:3007/api/v1/rooms`  
**Method:** POST  
**Content-Type:** application/json

### JSON Body - Opción A: Con roomCode automático (recomendado)
```json
{
  "roomName": "Sala de JavaScript",
  "roomType": "PUBLICA",
  "roomLanguage": "JAVASCRIPT",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 8
}
```

### JSON Body - Opción B: Con roomCode personalizado
```json
{
  "roomCode": "ABC-D1E-2F3",
  "roomName": "Sala Principal",
  "roomType": "PRIVADA",
  "roomLanguage": "PYTHON",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 10
}
```

### Response (201 Created)
```json
{
  "_id": "65f98765432abc12345789ab",
  "roomCode": "XYZ-A4B-5C6",
  "roomName": "Sala de JavaScript",
  "roomType": "PUBLICA",
  "roomLanguage": "JAVASCRIPT",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 8,
  "connectedUsers": [],
  "currentCode": "",
  "createdAt": "2026-03-02T10:30:00.000Z",
  "lastActivity": {
    "date": "2026-03-02T10:30:00.000Z",
    "action": "",
    "performedBy": {
      "userId": null,
      "username": null
    }
  },
  "roomStatus": "ACTIVA"
}
```

---

## 2. GET ALL ROOMS (GET)
**URL:** `http://localhost:3007/api/v1/rooms`  
**Method:** GET  

### Query Parameters (opcionales)
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Ejemplo:** `http://localhost:3007/api/v1/rooms?page=1&limit=10`

### Response (200 OK)
```json
{
  "data": [
    {
      "_id": "65f98765432abc12345789ab",
      "roomCode": "XYZ-A4B-5C6",
      "roomName": "Sala de JavaScript",
      "roomType": "PUBLICA",
      "roomLanguage": "JAVASCRIPT",
      "hostId": "65f1234567890abc12345678",
      "maxUsers": 8,
      "connectedUsers": [],
      "currentCode": "",
      "createdAt": "2026-03-02T10:30:00.000Z",
      "lastActivity": {
        "date": "2026-03-02T10:30:00.000Z",
        "action": "",
        "performedBy": {
          "userId": null,
          "username": null
        }
      },
      "roomStatus": "ACTIVA"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

---

## 3. GET ROOM BY ID (GET)
**URL:** `http://localhost:3007/api/v1/rooms/:id`  
**Method:** GET

**Ejemplo:** `http://localhost:3007/api/v1/rooms/65f98765432abc12345789ab`

### Response (200 OK)
```json
{
  "_id": "65f98765432abc12345789ab",
  "roomCode": "XYZ-A4B-5C6",
  "roomName": "Sala de JavaScript",
  "roomType": "PUBLICA",
  "roomLanguage": "JAVASCRIPT",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 8,
  "connectedUsers": [],
  "currentCode": "",
  "createdAt": "2026-03-02T10:30:00.000Z",
  "lastActivity": {
    "date": "2026-03-02T10:30:00.000Z",
    "action": "",
    "performedBy": {
      "userId": null,
      "username": null
    }
  },
  "roomStatus": "ACTIVA"
}
```

---

## 4. GET ROOM BY CODE (GET)
**URL:** `http://localhost:3007/api/v1/rooms/code/:code`  
**Method:** GET

**Ejemplo:** `http://localhost:3007/api/v1/rooms/code/XYZ-A4B-5C6`

### Response (200 OK)
```json
{
  "_id": "65f98765432abc12345789ab",
  "roomCode": "XYZ-A4B-5C6",
  "roomName": "Sala de JavaScript",
  "roomType": "PUBLICA",
  "roomLanguage": "JAVASCRIPT",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 8,
  "connectedUsers": [],
  "currentCode": "",
  "createdAt": "2026-03-02T10:30:00.000Z",
  "lastActivity": {
    "date": "2026-03-02T10:30:00.000Z",
    "action": "",
    "performedBy": {
      "userId": null,
      "username": null
    }
  },
  "roomStatus": "ACTIVA"
}
```

---

## 5. UPDATE ROOM (PUT)
**URL:** `http://localhost:3007/api/v1/rooms/:id`  
**Method:** PUT  
**Content-Type:** application/json

**Ejemplo:** `http://localhost:3007/api/v1/rooms/65f98765432abc12345789ab`

### JSON Body - Actualizar nombre y estado
```json
{
  "roomName": "Sala de Python Avanzado",
  "roomStatus": "PAUSADA",
  "maxUsers": 12
}
```

### JSON Body - Actualizar código (debe ser único)
```json
{
  "roomCode": "NEW-X1Y-2Z3",
  "roomName": "Sala Actualizada"
}
```

### Response (200 OK)
```json
{
  "_id": "65f98765432abc12345789ab",
  "roomCode": "NEW-X1Y-2Z3",
  "roomName": "Sala Actualizada",
  "roomType": "PUBLICA",
  "roomLanguage": "JAVASCRIPT",
  "hostId": "65f1234567890abc12345678",
  "maxUsers": 12,
  "connectedUsers": [],
  "currentCode": "",
  "createdAt": "2026-03-02T10:30:00.000Z",
  "lastActivity": {
    "date": "2026-03-02T10:30:00.000Z",
    "action": "",
    "performedBy": {
      "userId": null,
      "username": null
    }
  },
  "roomStatus": "PAUSADA"
}
```

---

## 6. DELETE ROOM (DELETE)
**URL:** `http://localhost:3007/api/v1/rooms/:id`  
**Method:** DELETE

**Ejemplo:** `http://localhost:3007/api/v1/rooms/65f98765432abc12345789ab`

### Response (200 OK)
```json
{
  "message": "Sala eliminada",
  "id": "65f98765432abc12345789ab"
}
```

---

## Valores permitidos

### roomType
- `PUBLICA`
- `PRIVADA`

### roomLanguage
- `JAVA`
- `PYTHON`
- `JAVASCRIPT`
- `HTML_CSS`
- `CSHARP`

### roomStatus
- `ACTIVA`
- `PAUSADA`
- `CERRADA`
- `ARCHIVADA`

### roomCode Format
- Formato: `ABC-D1E-2F3` (11 caracteres)
- Primer segmento: 3 LETRAS mayúsculas
- Segundo segmento: 3 LETRAS o NÚMEROS mayúsculos
- Tercer segmento: 3 LETRAS o NÚMEROS mayúsculos

---

## Notas importantes

1. **roomCode automático:** Si no envías `roomCode` al crear, se genera automáticamente uno único
2. **maxUsers:** Debe estar entre 2 y 12
3. **hostId:** Debe ser un ObjectId válido de MongoDB (usuario existente)
4. **Validación:** El servidor valida todos los campos según el modelo
5. **Duplicados:** No permite dos salas con el mismo `roomCode`
