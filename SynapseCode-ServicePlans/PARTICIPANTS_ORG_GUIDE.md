# Sistema de Participantes ORG - Guía de Prueba y Uso

## 🎯 Resumen del Sistema

El sistema ParticipantsORG permite que los contractantes de planes ORG:
1. Crear un plan ORG con límite de participantes (estudiantes)
2. Proporcionar números de carnet durante la contratación o después
3. Los estudiantes ingresan usando su número de carnet (no email/password)
4. Sistema valida carnets y controla límites de participantes

---

## 📋 Endpoints Implementados

### 1. **Seleccionar Plan ORG con Carnets** (Subscription)
```http
POST /api/v1/subscriptions/select-plan
Content-Type: application/json
Authorization: Bearer {token}

{
  "planName": "ORG",
  "email": "profesor@institution.edu",
  "name": "Dr. Carlos López",
  "institutionName": "Universidad XYZ",
  "maxParticipants": 30,
  "carnets": ["EST001", "EST002", "EST003"]  // Opcional
}
```

**Flujo:**
- Se validan carnets (formato alfanumérico, 6-20 caracteres)
- Se guarda suscripción como `pending_payment`
- Se crea sesión de Stripe con información de ORG en metadata
- Al completar pago (webhook), se crean los participantes automáticamente

---

### 2. **Agregar Participante Después de Contratar** (ORG Management)
```http
POST /api/v1/org-management/{subscriptionId}/participants
Content-Type: application/json
Authorization: Bearer {token}

{
  "carnetNumber": "EST004",
  "studentName": "Juan Pérez",        // Opcional
  "studentEmail": "juan@student.edu"  // Opcional
}
```

**Validaciones:**
- Carnet no puede estar duplicado en esta institución
- No se puede exceder `maxParticipants`
- Formato de carnet validado (6-20 caracteres, alfanumérico)

**Resultado:**
- Se crea ParticipantsORG con status PENDING
- Se envía email de invitación si hay email

---

### 3. **Listar Participantes**
```http
GET /api/v1/org-management/{subscriptionId}/participants?status=ACTIVE
Authorization: Bearer {token}
```

**Parámetros opcionales:**
- `status`: PENDING, ACTIVE, INACTIVE, REMOVED

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "carnetNumber": "EST001",
      "studentName": "Juan",
      "studentEmail": "juan@edu.com",
      "status": "ACTIVE",
      "registeredAt": "2026-05-01T10:30:00Z",
      "lastAccessAt": "2026-05-01T15:45:00Z"
    }
  ],
  "stats": {
    "total": 25,
    "active": 20,
    "pending": 5,
    "limit": 30,
    "utilizationPercentage": 67
  }
}
```

---

### 4. **Obtener Estadísticas de Participantes**
```http
GET /api/v1/org-management/{subscriptionId}/participants/stats
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 20,
    "pending": 5,
    "limit": 30,
    "utilizationPercentage": 67
  }
}
```

---

### 5. **Remover Participante**
```http
DELETE /api/v1/org-management/{subscriptionId}/participants/{carnetNumber}
Authorization: Bearer {token}
```

**Resultado:**
- Participante marcado como REMOVED (no se elimina, se mantiene historial)
- Estudiante no puede acceder a salas del plan ORG

---

### 6. **Validar Carnet para Acceso** (Para otros servicios)
```http
POST /api/v1/org-management/validate-carnet
Content-Type: application/json

{
  "subscriptionId": "507f1f77bcf86cd799439011",
  "carnetNumber": "EST001"
}
```

**Respuesta válida:**
```json
{
  "success": true,
  "message": "Carnet válido",
  "data": {
    "participantId": "...",
    "carnetNumber": "EST001",
    "status": "ACTIVE"
  }
}
```

**Respuesta inválida:**
```json
{
  "success": false,
  "message": "Carnet no autorizado para este plan",
  "error": "INVALID_CARNET"
}
```

---

## 📧 Emails Enviados

### 1. **Email de Invitación**
Se envía cuando se agrega un carnet.

**Contenido:**
- Número de carnet
- Nombre de la institución
- Instrucciones de acceso

### 2. **Email de Confirmación**
Se envía cuando el estudiante se activa (ingresa).

**Contenido:**
- Confirmación de acceso
- Funciones disponibles
- Datos de contacto de soporte

---

## 🔒 Validaciones de Carnet

**Formato válido:**
- Alfanumérico (A-Z, 0-9)
- 6-20 caracteres
- Se normaliza a MAYÚSCULAS

**Ejemplos válidos:**
```
EST001
EST-2024-001
A123456
CARNET789ABC
```

**Ejemplos inválidos:**
```
EST       // Muy corto
EST@123   // Caracteres especiales
12345     // No alfanumérico (solo números)
```

---

## 🔄 Flujos de Estados

### Estado del Participante
```
PENDING (creado)
  ↓
ACTIVE (ingresó)
  ↓
(INACTIVE) ← Si profesor desactiva
(REMOVED) ← Si profesor lo elimina
```

### Estado de la Suscripción ORG
```
Selecciona plan ORG
  ↓
pending_payment (esperando Stripe)
  ↓
[WEBHOOK: checkout.session.completed]
  ↓
active (participantes creados)
```

---

## 🧪 Casos de Prueba

### Caso 1: ORG con Carnets en Selección
```
1. POST /select-plan {ORG, institutionName, maxParticipants: 3, carnets: [A, B, C]}
2. ✓ Suscripción creada (pending_payment)
3. ✓ Carnets guardados en orgInfo.pendingCarnets
4. [PAGO COMPLETADO]
5. ✓ 3 ParticipantsORG creados automáticamente
6. ✓ 3 Emails de invitación enviados
```

### Caso 2: Agregar Participante Después
```
1. POST /participants {carnetNumber: D}
2. ✓ Validación de carnet: D es válido
3. ✓ Verificación de capacidad: 3 activos < 30 límite
4. ✓ ParticipantsORG creado (PENDING)
5. ✓ Email de invitación enviado
```

### Caso 3: Exceder Límite
```
1. Actual: 30 activos, límite: 30
2. POST /participants {carnetNumber: NEW}
3. ✗ Respuesta: "Límite de participantes alcanzado (30/30)"
```

### Caso 4: Carnet Duplicado
```
1. ParticipantsORG ya existe para EST001
2. POST /participants {carnetNumber: EST001}
3. ✗ Respuesta: "El carnet EST001 ya está registrado"
```

### Caso 5: Validar Carnet para Acceso
```
1. Estudiante intenta acceder a sala ORG
2. POST /validate-carnet {subscriptionId, carnetNumber: EST001}
3. ✓ Resultado: {valid: true, status: ACTIVE}
4. ✓ Estudiante accede a la sala
```

---

## 🛠️ Middlewares Utilizados

### validateCarnetFormat
- Valida carnet en `req.body.carnetNumber`
- Normaliza a MAYÚSCULAS
- Se usa en: POST /participants, POST /validate-carnet

### validateCarnetParam
- Valida carnet en `req.params.carnetNumber`
- Normaliza a MAYÚSCULAS
- Se usa en: DELETE /participants/:carnetNumber

### validateCarnetArray
- Valida array de carnets en `req.body.carnets`
- Validaría future endpoint para importación masiva

---

## 📝 Campos en ParticipantsORG

| Campo | Tipo | Descripción |
|-------|------|-------------|
| subscriptionId | ObjectId | Referencia a suscripción ORG |
| carnetNumber | String | Número de carnet (UNIQUE + subscriptionId) |
| studentEmail | String | Email para invitaciones |
| studentName | String | Nombre del estudiante |
| status | Enum | PENDING \| ACTIVE \| INACTIVE \| REMOVED |
| registeredAt | Date | Cuándo ingresó por primera vez |
| lastAccessAt | Date | Último acceso al sistema |
| invitationSentAt | Date | Cuándo se envió invitación |
| confirmationEmailSentAt | Date | Cuándo se confirmó email |
| notes | String | Notas del profesor |
| linkedUserId | String | ID del usuario en AuthService |

---

## 🔗 Integración con Otros Servicios

Cuando un estudiante intenta acceder a una sala del plan ORG, ServiceRoom/ServiceChat/etc debe:

```javascript
// Validar carnet en ServicePlans
const response = await axios.post(
  'http://localhost:3013/api/v1/org-management/validate-carnet',
  {
    subscriptionId: room.subscriptionId,
    carnetNumber: req.body.carnetNumber
  }
);

if (!response.data.success) {
  // Carnet no válido
  return res.status(403).json({ error: 'INVALID_CARNET' });
}

// Carnet válido, permitir acceso
const participant = response.data.data;
req.userId = participant.participantId;
```

---

## ✅ Checklist de Implementación

- [x] Modelo ParticipantsORG creado
- [x] Helper functions implementadas
- [x] Controller functions (5) implementadas
- [x] Routes agregadas (5 endpoints)
- [x] Middleware de validación de carnet
- [x] Email templates (invitación + confirmación)
- [x] Integración con selectPlan
- [x] Webhook para crear participantes automáticamente
- [x] Validación de capacidad (maxParticipants)
- [x] Validación de duplicados
- [ ] Test en ambiente local
- [ ] Pruebas de email
- [ ] Integración con ServiceRoom para validar carnets

---

## 📚 Referencias Rápidas

**Crear plan ORG con 5 carnets:**
```bash
curl -X POST http://localhost:3013/api/v1/subscriptions/select-plan \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "ORG",
    "email": "prof@inst.edu",
    "name": "Prof. Garcia",
    "institutionName": "Universidad ABC",
    "maxParticipants": 10,
    "carnets": ["A001", "A002", "A003", "A004", "A005"]
  }'
```

**Agregar carnet individual:**
```bash
curl -X POST http://localhost:3013/api/v1/org-management/{subId}/participants \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "carnetNumber": "A006",
    "studentName": "Pedro López",
    "studentEmail": "pedro@student.edu"
  }'
```

**Validar carnet (desde otro servicio):**
```bash
curl -X POST http://localhost:3013/api/v1/org-management/validate-carnet \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "507f1f77bcf86cd799439011",
    "carnetNumber": "A001"
  }'
```
