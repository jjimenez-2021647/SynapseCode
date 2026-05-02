# API Examples - ServicePlans

## Endpoints Públicos

### 1. Listar todos los planes

```bash
curl -X GET http://localhost:3013/api/v1/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "FREE",
      "price": 0,
      "description": "Plan gratuito para comenzar",
      "features": {
        "maxActiveRooms": 3,
        "maxUsersPerRoom": 5,
        "aiExplanationsLimit": 10
      }
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "PRO",
      "price": 2000,
      "description": "Plan profesional con características avanzadas"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "ORG",
      "price": 5000,
      "description": "Plan empresarial para instituciones"
    }
  ]
}
```

### 2. Obtener un plan específico

```bash
curl -X GET http://localhost:3013/api/v1/plans/507f1f77bcf86cd799439011
```

---

## Endpoints de Suscripción (Requieren JWT)

### 3. Obtener suscripción actual

```bash
curl -X GET http://localhost:3013/api/v1/subscriptions/current \
  -H "Authorization: Bearer <TOKEN_JWT>"
```

**Response (con suscripción):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "user123",
    "planId": "507f1f77bcf86cd799439011",
    "planName": "FREE",
    "status": "active",
    "startDate": "2024-05-01T00:00:00.000Z",
    "createdAt": "2024-05-01T10:30:00.000Z"
  }
}
```

**Response (sin suscripción):**
```json
{
  "success": true,
  "data": null,
  "message": "Sin suscripción activa"
}
```

### 4. Seleccionar plan FREE

```bash
curl -X POST http://localhost:3013/api/v1/subscriptions/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "planName": "FREE",
    "email": "user@example.com",
    "name": "Juan Pérez"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Plan FREE seleccionado",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "user123",
    "planName": "FREE",
    "status": "active",
    "startDate": "2024-05-01T10:35:00.000Z"
  }
}
```

**Email enviado:** Bienvenida a SynapseCode con info de otros planes

### 5. Seleccionar plan PRO (genera URL de pago)

```bash
curl -X POST http://localhost:3013/api/v1/subscriptions/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "planName": "PRO",
    "email": "user@example.com",
    "name": "Juan Pérez"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión de checkout creada",
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
    "sessionId": "cs_test_a1b2c3d4e5f6"
  }
}
```

El usuario debe ir a `checkoutUrl` para completar el pago.

---

## Endpoints de Gestión ORG (Requieren JWT + rol ORG_ROLE)

### 6. Solicitar aprobación como profesor

**Escenario:** Un profesor quiere obtener el rol ORG_ROLE dentro de una institución

```bash
curl -X POST http://localhost:3013/api/v1/org-management/professors/request-approval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "email": "profesor@example.com",
    "name": "Dr. García"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Solicitud enviada al administrador ORG"
}
```

**Email enviado:** Al contractante de la institución con solicitud de aprobación

### 7. Aprobar profesor (Solo contractante ORG)

**Escenario:** El que pagó el plan ORG aprueba un profesor

```bash
curl -X POST http://localhost:3013/api/v1/org-management/professors/507f1f77bcf86cd799439030/approve \
  -H "Authorization: Bearer <TOKEN_JWT_CONTRACTOR>"
```

**Response:**
```json
{
  "success": true,
  "message": "Profesor aprobado",
  "data": {
    "professorId": "507f1f77bcf86cd799439030",
    "email": "profesor@example.com",
    "name": "Dr. García",
    "status": "approved",
    "approvedAt": "2024-05-01T11:00:00.000Z"
  }
}
```

### 8. Listar profesores aprobados

```bash
curl -X GET http://localhost:3013/api/v1/org-management/professors/approved \
  -H "Authorization: Bearer <TOKEN_JWT_CONTRACTOR>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "professorId": "507f1f77bcf86cd799439030",
      "email": "profesor1@example.com",
      "name": "Dr. García",
      "status": "approved",
      "approvedAt": "2024-05-01T11:00:00.000Z"
    },
    {
      "professorId": "507f1f77bcf86cd799439031",
      "email": "profesor2@example.com",
      "name": "Ing. López",
      "status": "approved",
      "approvedAt": "2024-05-01T12:30:00.000Z"
    }
  ]
}
```

---

## Endpoints de Calificación de Código (Profesor ORG)

### 9. Calificar código de estudiante

```bash
curl -X POST http://localhost:3013/api/v1/org-management/code/rate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT_PROFESOR>" \
  -d '{
    "roomId": "room123",
    "fileId": "file456",
    "userId": "student789",
    "code": "function hello() { console.log(\"Hello\"); }",
    "language": "javascript",
    "rating": 8,
    "ratingScale": "0-10",
    "criteria": "Limpieza de código, uso de buenas prácticas",
    "comments": "Buen trabajo, considera usar const en lugar de var",
    "useAIForAnalysis": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Código calificado exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "roomId": "room123",
    "fileId": "file456",
    "userId": "student789",
    "ratedByProfessorId": "professor123",
    "rating": 8,
    "ratingScale": "0-10",
    "comments": "Buen trabajo, considera usar const en lugar de var",
    "aiAnalysis": {
      "correctness": "El código es correcto sintácticamente",
      "improvements": ["Usar const en lugar de var", "Agregar JSDoc"],
      "bestPractices": ["Seguir estándar JavaScript", "Usar nombres descriptivos"]
    },
    "createdAt": "2024-05-01T11:15:00.000Z"
  }
}
```

### 10. Obtener calificaciones de una sala

```bash
curl -X GET http://localhost:3013/api/v1/org-management/code/ratings/room123 \
  -H "Authorization: Bearer <TOKEN_JWT_PROFESOR>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "fileId": "file456",
      "userId": "student789",
      "rating": 8,
      "ratingScale": "0-10",
      "comments": "Buen trabajo",
      "createdAt": "2024-05-01T11:15:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439041",
      "fileId": "file457",
      "userId": "student790",
      "rating": 9,
      "ratingScale": "0-10",
      "comments": "Excelente implementación",
      "createdAt": "2024-05-01T11:20:00.000Z"
    }
  ]
}
```

---

## Endpoints de Restricción de IA (Profesor ORG)

### 11. Establecer restricciones de IA en una sala

**Escenario:** El profesor quiere que los estudiantes NO usen IA en este ejercicio

```bash
curl -X POST http://localhost:3013/api/v1/org-management/rooms/room123/ai-restrictions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT_PROFESOR>" \
  -d '{
    "aiEnabled": false,
    "reason": "Este es un ejercicio para evaluar lógica sin asistencia de IA",
    "restrictions": {
      "aiExplanations": true,
      "aiCodeSuggestions": true,
      "aiDebugging": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Restricciones de IA establecidas",
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "roomId": "room123",
    "professorId": "profesor123",
    "aiEnabled": false,
    "reason": "Este es un ejercicio para evaluar lógica sin asistencia de IA",
    "restrictions": {
      "aiExplanations": true,
      "aiCodeSuggestions": true,
      "aiDebugging": true
    },
    "updatedAt": "2024-05-01T11:30:00.000Z"
  }
}
```

### 12. Obtener restricciones de IA de una sala

```bash
curl -X GET http://localhost:3013/api/v1/org-management/rooms/room123/ai-restrictions \
  -H "Authorization: Bearer <TOKEN_JWT>"
```

**Response (si hay restricciones):**
```json
{
  "success": true,
  "data": {
    "aiEnabled": false,
    "reason": "Este es un ejercicio para evaluar lógica sin asistencia de IA",
    "restrictions": {
      "aiExplanations": true,
      "aiCodeSuggestions": true,
      "aiDebugging": true
    }
  }
}
```

**Response (sin restricciones - defaults):**
```json
{
  "success": true,
  "data": {
    "aiEnabled": true,
    "restrictions": {
      "aiExplanations": true,
      "aiCodeSuggestions": true,
      "aiDebugging": true
    }
  }
}
```

---

## Endpoints de Analíticas

### 13. Obtener analíticas de un estudiante

```bash
curl -X GET http://localhost:3013/api/v1/org-management/analytics/student/student789 \
  -H "Authorization: Bearer <TOKEN_JWT_PROFESOR>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "student789",
    "totalCodeSubmissions": 5,
    "averageRating": 8.2,
    "ratings": [
      {
        "date": "2024-05-01T11:15:00.000Z",
        "rating": 8,
        "scale": "0-10",
        "comments": "Buen trabajo"
      },
      {
        "date": "2024-04-30T14:45:00.000Z",
        "rating": 8.5,
        "scale": "0-10",
        "comments": "Mejoró bastante"
      }
    ]
  }
}
```

---

## Health Check

```bash
curl http://localhost:3013/api/v1/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "SynapseCode-ServicePlans",
  "timestamp": "2024-05-01T12:00:00.000Z"
}
```

---

## Respuestas de Error

### Error de validación

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "planName",
      "message": "Plan debe ser FREE, PRO u ORG"
    }
  ]
}
```

### Error de autenticación

```json
{
  "success": false,
  "message": "Token expirado"
}
```

### Error de autorización (No es ORG_ROLE)

```json
{
  "success": false,
  "message": "Acceso denegado: Se requiere rol ORG_ROLE"
}
```

---

## Notas

- Reemplazar `<TOKEN_JWT>` con un JWT válido obtenido de AuthService
- Todos los precios están en centavos USD (2000 = $20.00)
- Las fechas están en formato ISO 8601
- Los IDs de MongoDB son ObjectId en formato string
