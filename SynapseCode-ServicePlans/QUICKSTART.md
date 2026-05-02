# QUICKSTART - SynapseCode-ServicePlans

## Descripción Rápida

Microservicio que maneja:
- **3 Planes**: FREE ($0), PRO ($20/mes), ORG ($50+/mes)
- **Suscripciones**: Pago con Stripe, emails de confirmación
- **ORG Management**: Profesores aprobados, calificación de código, restricción de IA

Puerto: **3013**  
Base de datos: **MongoDB**

---

## Instalación (1 minuto)

```bash
cd SynapseCode-ServicePlans
cp .env.example .env
# Editar .env con tus credenciales Stripe, SMTP, JWT_SECRET, etc
pnpm install
```

---

## Ejecutar (Desarrollo)

```bash
# Desde la carpeta SynapseCode-ServicePlans/
pnpm dev

# O desde raíz (con todos los servicios)
pnpm dev  # Ejecuta scripts/dev.js que levanta ServicePlans en puerto 3013
```

---

## Endpoints Principales

### Públicos (sin JWT)

```
GET  /api/v1/plans                        # Listar planes
GET  /api/v1/plans/:planId                # Detalle de plan
GET  /api/v1/health                       # Health check
```

### Privados (con JWT)

```
# Suscripciones
GET  /api/v1/subscriptions/current        # Mi suscripción
POST /api/v1/subscriptions/select         # Seleccionar plan
POST /api/v1/subscriptions/checkout       # Generar sesión Stripe

# ORG Management (requieren ORG_ROLE)
POST /api/v1/org-management/professors/request-approval
GET  /api/v1/org-management/professors/approved
POST /api/v1/org-management/code/rate
GET  /api/v1/org-management/code/ratings/:roomId
POST /api/v1/org-management/rooms/:roomId/ai-restrictions
GET  /api/v1/org-management/analytics/student/:studentId
```

---

## Flujos de Uso

### 1️⃣ Usuario selecciona plan FREE

```bash
curl -X POST http://localhost:3013/api/v1/subscriptions/select \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "planName": "FREE",
    "email": "user@example.com",
    "name": "Juan"
  }'
```

✅ Resultado: Suscripción activa + Email de bienvenida

### 2️⃣ Usuario selecciona plan PRO

```bash
curl -X POST http://localhost:3013/api/v1/subscriptions/select \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "planName": "PRO",
    "email": "user@example.com",
    "name": "Juan"
  }'
```

✅ Resultado: URL de checkout Stripe

👤 Usuario va a URL, completa pago

✅ Webhook recibe confirmación → Suscripción activa + Factura por email

### 3️⃣ Profesor solicita aprobación ORG

```bash
curl -X POST http://localhost:3013/api/v1/org-management/professors/request-approval \
  -H "Authorization: Bearer <JWT_PROFESOR>" \
  -d '{
    "email": "profesor@example.com",
    "name": "Dr. García"
  }'
```

✅ Resultado: Email al contractante con solicitud

### 4️⃣ Contractante aprueba profesor

```bash
curl -X POST http://localhost:3013/api/v1/org-management/professors/{professorId}/approve \
  -H "Authorization: Bearer <JWT_CONTRACTANTE>"
```

✅ Resultado: Profesor obtiene rol ORG_ROLE

### 5️⃣ Profesor califica código

```bash
curl -X POST http://localhost:3013/api/v1/org-management/code/rate \
  -H "Authorization: Bearer <JWT_PROFESOR>" \
  -d '{
    "roomId": "room123",
    "fileId": "file456",
    "userId": "student789",
    "code": "function hello() {...}",
    "rating": 8,
    "ratingScale": "0-10",
    "comments": "Buen trabajo"
  }'
```

✅ Resultado: Calificación guardada

### 6️⃣ Profesor restringe IA en ejercicio

```bash
curl -X POST http://localhost:3013/api/v1/org-management/rooms/room123/ai-restrictions \
  -H "Authorization: Bearer <JWT_PROFESOR>" \
  -d '{
    "aiEnabled": false,
    "reason": "Ejercicio para evaluar sin IA"
  }'
```

✅ Resultado: IA deshabilitada en esa sala

---

## Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `.env.example` | Template de configuración |
| `README.md` | Documentación completa |
| `API_EXAMPLES.md` | Ejemplos de todos los endpoints |
| `INTEGRATION.md` | Cómo se integra con otros servicios |
| `index.js` | Punto de entrada |
| `configs/app.js` | Setup de Express |
| `src/plans/` | Endpoints de planes |
| `src/subscriptions/` | Endpoints de suscripciones |
| `src/org-management/` | Endpoints de gestión ORG |

---

## Variables de Entorno Críticas

```env
PORT=3013                                 # Puerto del servicio
MONGO_URI=mongodb://localhost:27017/...  # Base de datos
JWT_SECRET=your_secret_key_here          # Para validar JWT
AUTH_SERVICE_URL=http://localhost:3006   # AuthService para actualizar planes
STRIPE_SECRET_KEY=sk_test_...            # Clave secreta Stripe
SMTP_USERNAME=your_email@gmail.com       # Para enviar emails
```

---

## Límites por Plan

| Plan | Salas | Usuarios/Sala | Ejecuciones | Explicaciones IA |
|------|-------|---------------|-------------|-----------------|
| FREE | 3 | 5 | 50/mes | 10/mes |
| PRO | ∞ | 20 | ∞ | 20/mes |
| ORG | ∞ | ∞ | ∞ | ∞ |

---

## Roles

- **USER_ROLE**: Usuario normal (todos empiezan aquí)
- **ORG_ROLE**: Profesor en institución (requiere aprobación)
- **ADMIN_ROLE**: Administrador de SynapseCode

---

## Debugging

**Ver logs:**
```bash
# Terminal donde corre pnpm dev
# Busca líneas que digan:
# [ServicePlans] ...
```

**Probar health check:**
```bash
curl http://localhost:3013/api/v1/health
```

**Ver planes en BD:**
```bash
# Desde MongoDB CLI
use synapsecode_plans
db.plans.find()
```

---

## Próximos Pasos de Integración

1. ✅ ServicePlans está listo
2. ⏳ Implementar validación de límites en **ServiceRoom** (salas activas)
3. ⏳ Implementar validación de límites en **ServiceChat** (explicaciones IA)
4. ⏳ Implementar validación de límites en **ServiceCodeSessions** (ejecuciones)
5. ⏳ Implementar validación de límites en **ServiceExecutionCode** (ejecuciones)

Ver `INTEGRATION.md` para pseudocódigo de cada integración.

---

## Contacto / Soporte

Este es un microservicio de SynapseCode.  
Autor: Josuë Jiménez - 2026
