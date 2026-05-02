# Integración con Otros Servicios

Este documento explica cómo SynapseCode-ServicePlans se integra con los demás microservicios.

## 1. Integración con AuthService

### Objetivo
- Actualizar el campo `typePlan` del usuario
- Agregar/remover rol `ORG_ROLE`
- Obtener datos del usuario

### Endpoints que se llaman

**Actualizar plan del usuario:**
```
PUT /api/v1/users/:userId/plan
Body: { planName: "FREE" | "PRO" | "ORG" }
```

**Actualizar rol del usuario:**
```
PUT /api/v1/users/:userId/role
Body: { role: "ORG_ROLE" }
```

### Cuándo se llama

- ✅ Cuando usuario selecciona un plan (después de pago exitoso o para FREE)
- ✅ Cuando un profesor es aprobado por el contractante ORG
- ✅ Cuando un profesor es rechazado (remover ORG_ROLE)

### Implementación actual

Ver archivo: `helpers/auth-service-bridge.js`

```javascript
export const updateUserPlan = async (userId, planName, token) => {
  const response = await axios.put(
    `${config.auth_service.url}/api/v1/users/${userId}/plan`,
    { planName },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
```

---

## 2. Integración con ServiceRoom

### Objetivo
- Validar límites de salas activas según plan
- Validar límites de usuarios por sala según plan
- Validar permisos del host ORG

### Límites por Plan

**FREE:**
- Máximo 3 salas activas
- Máximo 5 usuarios por sala

**PRO:**
- Salas ilimitadas
- Máximo 20 usuarios por sala

**ORG:**
- Salas ilimitadas
- Usuarios ilimitados

### Cuándo se valida

- Antes de crear una sala nueva (comprobar salas activas del usuario)
- Antes de agregar usuario a sala (comprobar límite de usuarios)
- Al crear sala ORG: validar que sea profesor aprobado

### Implementación pendiente

ServiceRoom debe consultar a ServicePlans para obtener:
1. Plan del usuario creador
2. Límites asociados a ese plan
3. Contar salas/usuarios activos
4. Comparar contra límites

**Pseudocódigo:**

```javascript
// En ServiceRoom/src/rooms/rooms.controller.js
async function createRoom(req, res) {
  const subscription = await axios.get(
    'http://localhost:3013/api/v1/subscriptions/current',
    { headers: { Authorization: req.get('Authorization') } }
  );
  
  const plan = subscription.data.planName;
  const limits = getLimitsForPlan(plan);
  
  const userRoomCount = await Room.countDocuments({ hostId: req.userId });
  
  if (userRoomCount >= limits.maxActiveRooms) {
    return res.status(403).json({
      success: false,
      message: `Límite de ${limits.maxActiveRooms} salas alcanzado`
    });
  }
  
  // Proceder a crear sala
}
```

---

## 3. Integración con ServiceChat

### Objetivo
- Validar límites de explicaciones con IA según plan
- Restringir explicaciones si el límite está agotado

### Límites por Plan

**FREE:**
- Máximo 10 explicaciones con IA por mes

**PRO:**
- Máximo 20 explicaciones con IA por mes

**ORG:**
- Explicaciones ilimitadas

### Cuándo se valida

- Antes de llamar a Groq para generar explicación
- Contar explicaciones generadas este mes
- Bloquear si se agotó el límite

### Implementación pendiente

ServiceChat debe consultar a ServicePlans para obtener plan del usuario y validar límites.

**Pseudocódigo:**

```javascript
// En ServiceChat/src/explication/explication.controller.js
async function explain(req, res) {
  const subscription = await axios.get(
    'http://localhost:3013/api/v1/subscriptions/current',
    { headers: { Authorization: req.get('Authorization') } }
  );
  
  const plan = subscription.data.planName;
  const limits = { FREE: 10, PRO: 20, ORG: null }[plan];
  
  if (limits) {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const count = await Explication.countDocuments({
      userId: req.userId,
      createdAt: { $gte: thisMonth }
    });
    
    if (count >= limits) {
      return res.status(403).json({
        success: false,
        message: `Límite de ${limits} explicaciones alcanzado`
      });
    }
  }
  
  // Proceder con Groq
}
```

---

## 4. Integración con ServiceCodeSessions

### Objetivo
- Validar límites de ejecuciones de código

### Límites por Plan

**FREE:**
- Máximo 50 ejecuciones por mes

**PRO:**
- Ejecuciones prioritarias (sin límite práctico)

**ORG:**
- Ejecuciones prioritarias sin límite

### Cuándo se valida

- Antes de ejecutar código
- Contar ejecuciones este mes
- Bloquear si se agotó el límite FREE

---

## 5. Integración con ServiceExecutionCode

### Objetivo
- Similar a ServiceCodeSessions

### Límites por Plan

**FREE:**
- Máximo 50 ejecuciones por mes
- Ejecución básica

**PRO:**
- Sin límite práctico
- Prioridad en cola de ejecución

**ORG:**
- Sin límite
- Máxima prioridad

---

## 6. Integración con ServiceFeedback

### Objetivo
- Validar permisos de moderación según plan

### Reglas

- Solo `ADMIN_ROLE` puede moderar comentarios (estado)
- No hay restricciones por plan

---

## 7. Integración con ServiceGit

### Objetivo
- Validar acceso a repositorios según plan

### Reglas

- Todos los planes tienen acceso a Git básico
- ORG tiene acceso a repositorios compartidos institucionales

---

## Estrategia de Validación Actual

**Opción 1: Delegada (Recomendada)**
- Cada servicio consulta a ServicePlans antes de operación
- Cada servicio valida sus propias reglas de límites
- ServicePlans es "fuente de verdad" de planes/suscripciones

**Opción 2: Centralizada**
- ServiceRoom actúa como "proxy" de validación
- Los demás servicios confían en que ServiceRoom ya validó
- Requiere coordinación más compleja

---

## Flujo de Ejemplo: Crear Sala en Plan FREE

1. Cliente llama `POST /api/v1/rooms` con JWT
2. ServiceRoom middleware valida JWT
3. ServiceRoom llama `GET /api/v1/subscriptions/current` a ServicePlans
4. ServicePlans retorna: `{ planName: "FREE", status: "active" }`
5. ServiceRoom cuenta salas activas: encuentra 3 salas
6. ServiceRoom compara 3 >= límite de 3
7. ServiceRoom retorna error 403: "Límite de salas alcanzado"

---

## Variables de Comunicación

Todas las URLs hardcodeadas (para ahora):

| Variable | Valor |
|---|---|
| `AUTH_SERVICE_URL` | `http://localhost:3006` |
| `PLANS_SERVICE_URL` | `http://localhost:3013` |
| `ROOM_SERVICE_URL` | `http://localhost:3007` |
| `CHAT_SERVICE_URL` | `http://localhost:3008` |
| `CODE_SESSIONS_URL` | `http://localhost:3009` |
| `EXECUTION_CODE_URL` | `http://localhost:3010` |

En `.env` se pueden override:
```env
AUTH_SERVICE_URL=http://auth.production.internal
PLANS_SERVICE_URL=http://plans.production.internal
```

---

## TODO de Integración

- [ ] Implementar validación de límites de salas en ServiceRoom
- [ ] Implementar validación de límites de explicaciones en ServiceChat
- [ ] Implementar validación de límites de ejecuciones en ServiceCodeSessions
- [ ] Implementar validación de límites de ejecuciones en ServiceExecutionCode
- [ ] Agregar logging de usos para analytics
- [ ] Implementar webhook de fin de suscripción
- [ ] Implementar downgrade automático a FREE cuando vence suscripción
- [ ] Agregar métricas de consumo por usuario/plan

---

## Ejemplo: Llamada HTTP desde ServiceRoom a ServicePlans

```javascript
// SynapseCode-ServiceRoom/src/rooms/rooms.controller.js

import axios from 'axios';

const PLANS_SERVICE_URL = process.env.PLANS_SERVICE_URL || 'http://localhost:3013';

export const createRoom = async (req, res) => {
  try {
    const token = req.get('x-token') || req.get('Authorization');
    
    // 1. Obtener suscripción actual del usuario
    const subscriptionResponse = await axios.get(
      `${PLANS_SERVICE_URL}/api/v1/subscriptions/current`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const { planName } = subscriptionResponse.data.data || {};
    
    // 2. Definir límites por plan
    const planLimits = {
      FREE: { maxActiveRooms: 3, maxUsersPerRoom: 5 },
      PRO: { maxActiveRooms: null, maxUsersPerRoom: 20 },
      ORG: { maxActiveRooms: null, maxUsersPerRoom: null }
    };
    
    const limits = planLimits[planName];
    
    // 3. Contar salas activas del usuario
    const userRoomCount = await Room.countDocuments({
      hostId: req.userId,
      status: 'active'
    });
    
    // 4. Validar límite
    if (limits.maxActiveRooms && userRoomCount >= limits.maxActiveRooms) {
      return res.status(403).json({
        success: false,
        message: `Plan ${planName}: Límite de ${limits.maxActiveRooms} salas activas alcanzado`
      });
    }
    
    // 5. Proceder a crear sala
    const room = new Room({
      hostId: req.userId,
      // ...resto de datos
    });
    
    await room.save();
    
    res.status(201).json({
      success: true,
      data: room
    });
    
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando sala'
    });
  }
};
```

---

## Monitoreo y Observabilidad

Cada servicio debería loguear:
- Cuándo se consulta el plan/suscripción
- Si se rechaza por límite alcanzado
- Cuántos recursos está usando el usuario
- Alertas si se acerca al límite

Ejemplo:
```javascript
console.log(`[INFO] User ${userId} plan: ${planName}, rooms: ${count}/${limits.maxActiveRooms}`);
console.log(`[WARN] User ${userId} approaching room limit: ${count} of ${limits.maxActiveRooms}`);
console.log(`[ERROR] User ${userId} exceeded room limit`);
```
