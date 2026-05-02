# Actualizaciones - Sistema de Participantes ORG

## 📋 Resumen de Implementación

Se ha completado la implementación del **Sistema de Participantes ORG con Carnets**, que permite a los contractantes de planes ORG:

1. Especificar un número máximo de participantes (estudiantes)
2. Proporcionar números de carnet de estudiantes durante la compra del plan
3. Agregar más estudiantes después de la compra
4. Los estudiantes ingresan usando su número de carnet (no email/password)
5. Recibir confirmación por email cuando se activan

---

## 🔧 Cambios Técnicos Implementados

### 1. **Modelos MongoDB**

#### ✨ Nuevo: `ParticipantsORG` 
**Archivo:** `src/org-management/participants-org.model.js`

Almacena información de estudiantes autorizados para planes ORG:
- `subscriptionId` - Referencia a suscripción ORG
- `carnetNumber` - Número de carnet (ÚNICO por institución)
- `studentEmail`, `studentName` - Datos opcionales
- `status` - PENDING | ACTIVE | INACTIVE | REMOVED
- `registeredAt`, `lastAccessAt` - Fechas de acceso
- `notes` - Notas del profesor/contractante
- `linkedUserId` - ID del usuario cuando se registra

#### 🔄 Modificado: `Subscription`
**Archivo:** `src/subscriptions/subscription.model.js`

Nuevos campos en `orgInfo`:
- `maxParticipants` - Límite de estudiantes para el plan
- `pendingCarnets` - Array de carnets esperando procesamiento (después del pago)

---

### 2. **Helpers y Servicios**

#### ✨ Nuevo: `helpers/participants-org.js`
Funciones para gestionar participantes:
- `addParticipantToORG()` - Agregar un carnet
- `validateCarnetForORG()` - Validar si carnet es autorizado
- `activateParticipant()` - Marcar como ACTIVE cuando se registra
- `getOrgParticipants()` - Listar participantes
- `removeParticipant()` - Marcar como REMOVED
- `getActiveParticipantsCount()` - Contar participantes activos
- `getOrgParticipantLimit()` - Obtener límite de la institución
- `canAddMoreParticipants()` - Verificar capacidad disponible
- `updateParticipantLastAccess()` - Actualizar última actividad
- `getParticipantsStats()` - Estadísticas completas

#### 🔄 Modificado: `helpers/stripe-service.js`
- `createStripeCheckoutSession()` ahora acepta `additionalMetadata`
- Permite pasar información de ORG (institutionName, maxParticipants, carnets)

#### 🔄 Modificado: `helpers/email-service.js`
Nuevas funciones de email:
- `sendParticipantInvitationEmail()` - Email con número de carnet
- `sendParticipantConfirmationEmail()` - Confirmación cuando se activa

---

### 3. **Controllers**

#### 🔄 Modificado: `src/subscriptions/subscriptions.controller.js`

**`selectPlan()`**
- Acepta parámetros adicionales para ORG:
  - `institutionName` - Nombre de institución
  - `maxParticipants` - Número de participantes permitidos
  - `carnets` - Array opcional de carnets para crear
- Valida carnets en formato correcto
- Guarda carnets en `orgInfo.pendingCarnets` para procesamiento posterior
- Crea suscripción con estado `pending_payment`

**`handleStripeWebhook()`**
- Cuando se completa pago de plan ORG:
  - Obtiene suscripción y sus `pendingCarnets`
  - Crea `ParticipantsORG` para cada carnet automáticamente
  - Envía emails de invitación
  - Limpia `pendingCarnets` después de procesarlos

#### ✨ Nuevas funciones en `src/org-management/org-management.controller.js`

**`addOrgParticipant(req, res)`**
- Agrega un nuevo participante (carnet) después de contratar
- Valida que no exceda `maxParticipants`
- Valida que carnet no esté duplicado
- Envía email de invitación si hay email

**`getOrgParticipantsList(req, res)`**
- Lista todos los participantes de una institución
- Filtra opcionalmente por estado
- Devuelve estadísticas junto con la lista

**`removeOrgParticipant(req, res)`**
- Marca participante como REMOVED (soft delete)
- Mantiene historial para auditoría
- Impide que estudianteacceda a salas ORG

**`getOrgParticipantsStats(req, res)`**
- Retorna:
  - Total de participantes
  - Activos, pendientes, removidos
  - Límite máximo
  - Porcentaje de utilización

**`validateCarnetAccess(req, res)`**
- Valida si un carnet está autorizado en un plan
- Endpoint **público** para otros servicios
- Responde con status del carnet (ACTIVE, PENDING, etc.)

---

### 4. **Routes**

#### 🔄 Modificado: `src/org-management/org-management.routes.js`

Nuevas rutas registradas:
```
POST   /:subscriptionId/participants
GET    /:subscriptionId/participants
DELETE /:subscriptionId/participants/:carnetNumber
GET    /:subscriptionId/participants/stats
POST   /validate-carnet
```

---

### 5. **Middlewares**

#### ✨ Nuevo: `middlewares/validate-carnet.js`

Tres middlewares para validar carnets:

**`validateCarnetFormat`**
- Valida `req.body.carnetNumber`
- Formato: alfanumérico, 6-20 caracteres
- Normaliza a MAYÚSCULAS

**`validateCarnetParam`**
- Valida `req.params.carnetNumber`
- Mismo formato que `validateCarnetFormat`

**`validateCarnetArray`**
- Valida array de carnets en `req.body.carnets`
- Valida cada carnet del array
- Reporta cuáles son inválidos si hay errores

---

### 6. **Otros Cambios**

#### 🔄 Modificado: `src/subscriptions/subscriptions.controller.js`
- Agregado import: `addParticipantToORG`, `sendParticipantInvitationEmail`, `sendParticipantConfirmationEmail`

#### 🔄 Modificado: `src/org-management/org-management.controller.js`
- Actualizado export default para incluir 5 nuevas funciones de participantes

---

## 📊 Resumen de Cambios

| Tipo | Archivos | Acción |
|------|----------|--------|
| **Nuevos** | `participants-org.model.js` | Modelo MongoDB |
| **Nuevos** | `participants-org.js` | 10 funciones helper |
| **Nuevos** | `validate-carnet.js` | 3 middlewares de validación |
| **Nuevos** | `PARTICIPANTS_ORG_GUIDE.md` | Documentación |
| **Modificados** | `org-management.controller.js` | +5 funciones |
| **Modificados** | `org-management.routes.js` | +5 rutas + imports + middlewares |
| **Modificados** | `subscriptions.controller.js` | selectPlan() + handleWebhook() |
| **Modificados** | `subscriptions.controller.js` | Nuevas propiedades en modelo Subscription |
| **Modificados** | `email-service.js` | +2 funciones de email |
| **Modificados** | `stripe-service.js` | Soporte para metadata adicional |
| **Actualizado** | `STATUS.txt` | Información del nuevo sistema |

---

## 🔄 Flujo Completo de Uso

### Scenario: Profesor contrata plan ORG con estudiantes

```
1. POST /subscriptions/select-plan
   {
     "planName": "ORG",
     "email": "prof@inst.edu",
     "institutionName": "Universidad XYZ",
     "maxParticipants": 30,
     "carnets": ["A001", "A002", "A003"]
   }
   ✓ Suscripción creada (status: pending_payment)
   ✓ Carnets guardados en orgInfo.pendingCarnets

2. Usuario paga en Stripe checkout

3. Stripe webhook: checkout.session.completed
   ✓ Suscripción activada
   ✓ 3 ParticipantsORG creados (PENDING)
   ✓ 3 emails de invitación enviados

4. Profesor puede agregar más estudiantes:
   POST /org-management/{subId}/participants
   { "carnetNumber": "A004", "studentEmail": "a4@student.edu" }
   ✓ ParticipantsORG creado
   ✓ Email de invitación enviado

5. Profesor lista estudiantes:
   GET /org-management/{subId}/participants
   ✓ Retorna 4 participantes + estadísticas

6. Estudiante intenta acceder a sala ORG:
   POST /org-management/validate-carnet
   { "subscriptionId": "...", "carnetNumber": "A001" }
   ✓ Respuesta: { valid: true, status: "PENDING" }
   
7. Estudiante se registra:
   ✓ Carnet marcado como ACTIVE
   ✓ Email de confirmación enviado
```

---

## ✅ Validaciones Implementadas

- ✅ Formato de carnet (alfanumérico, 6-20 caracteres)
- ✅ Carnet no duplicado en la institución
- ✅ No exceder `maxParticipants`
- ✅ Solo el contractante puede agregar/remover participantes
- ✅ Carnet válido para acceder a salas ORG
- ✅ Status de carnet (PENDING, ACTIVE, REMOVED)

---

## 📧 Emails Enviados

### 1. Email de Invitación
Se envía cuando se agrega un carnet
- Contenido: Número de carnet, nombre institución, instrucciones
- A: Dirección email del estudiante (si se proporciona)

### 2. Email de Confirmación
Se envía cuando estudiante se activa (ingresa)
- Contenido: Confirmación de acceso, funciones disponibles
- A: Dirección email del estudiante

---

## 🔗 Integración con Otros Servicios

Cuando un estudiante intenta acceder a una sala ORG, los servicios (ServiceRoom, ServiceChat, etc.) deben:

```javascript
// Validar carnet antes de permitir acceso
const carnetValidation = await axios.post(
  'http://localhost:3013/api/v1/org-management/validate-carnet',
  {
    subscriptionId: room.subscriptionId,
    carnetNumber: studentCarnet
  }
);

if (!carnetValidation.data.success) {
  // Carnet no válido o removido
  return res.status(403).json({ error: 'INVALID_CARNET' });
}

// Carnet válido, permitir acceso
// carnetValidation.data.data.participantId puede usarse como userId
```

---

## 📚 Documentación Completa

Para más detalles, consultar:
- [PARTICIPANTS_ORG_GUIDE.md](./SynapseCode-ServicePlans/PARTICIPANTS_ORG_GUIDE.md) - Guía completa del sistema
- [README.md](./SynapseCode-ServicePlans/README.md) - Documentación general
- [API_EXAMPLES.md](./SynapseCode-ServicePlans/API_EXAMPLES.md) - Ejemplos de API

---

## ✨ Características Principales

✨ **Automatización**
- Participantes creados automáticamente al pagar
- Emails enviados automáticamente
- Límites validados automáticamente

✨ **Seguridad**
- Carnets únicos por institución
- Validación de límites de participantes
- Soft delete (REMOVED) para auditoría
- Endpoint de validación público pero seguro

✨ **Flexibilidad**
- Carnets especificados al contratar o después
- Personalización de datos del estudiante
- Estados granulares para control fino

✨ **Observabilidad**
- Estadísticas de participación
- Fechas de registro y acceso
- Historial completo (nunca se elimina)

---

## 🧪 Testing

Ver [PARTICIPANTS_ORG_GUIDE.md](./SynapseCode-ServicePlans/PARTICIPANTS_ORG_GUIDE.md) para:
- 5 casos de prueba detallados
- Ejemplos curl para cada endpoint
- Validaciones esperadas

---

**Implementación completada: 1 de Mayo de 2026** ✅
