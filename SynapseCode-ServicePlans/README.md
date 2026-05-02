# SynapseCode-ServicePlans

Microservicio de gestión de planes, suscripciones y control institucional (ORG_ROLE) para SynapseCode.

## Descripción

Este servicio maneja:

- **3 Planes**: FREE ($0), PRO ($20/mes), ORG ($50+/mes por institución)
- **Suscripciones**: Registro, selección y manejo del ciclo de vida
- **Pagos**: Integración con Stripe para PRO y ORG
- **Emails**: Confirmaciones, facturas y notificaciones
- **ORG Management**: Rol ORG_ROLE, profesores, calificación de código, restricciones de IA

## Instalación

```bash
# Desde SynapseCode-ServicePlans/
pnpm install
```

## Configuración

1. Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Configurar variables de entorno:

```env
PORT=3013
MONGO_URI=mongodb://localhost:27017/synapsecode_plans
JWT_SECRET=your_secret_here
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
STRIPE_SECRET_KEY=sk_test_...
```

## Ejecución

**Desarrollo:**
```bash
pnpm dev
```

**Producción:**
```bash
pnpm start
```

## Estructura

```
src/
├── plans/              # Planes disponibles
│   ├── plans.routes.js
│   ├── plans.controller.js
│   └── plan.model.js
├── subscriptions/      # Suscripciones de usuarios
│   ├── subscriptions.routes.js
│   ├── subscriptions.controller.js
│   └── subscription.model.js
├── org-management/     # Gestión ORG (profesores, calificaciones, restricciones IA)
│   ├── org-management.routes.js
│   ├── org-management.controller.js
│   ├── code-rating.model.js
│   └── room-ai-restrictions.model.js
└── health/             # Health check

configs/
├── app.js              # Express setup
├── config.js           # Variables de entorno parseadas
├── cors-configuration.js
├── db.js               # MongoDB connection
└── helmet-configuration.js

helpers/
├── email-service.js    # Envío de emails
├── stripe-service.js   # Integración con Stripe
├── auth-service-bridge.js  # Llamadas a AuthService
└── seed-plans.js       # Seeding inicial de planes

middlewares/
├── validate-JWT.js     # JWT validation
├── validate-org-role.js # ORG_ROLE validation
├── request-limit.js    # Rate limiting
└── validation.js       # Express-validator chains

utils/
├── plan-constants.js   # Constantes y límites
├── errors.js           # Clases de error
└── responses.js        # Builders de response
```

## Endpoints

### Planes (Públicos)

```
GET  /api/v1/plans
GET  /api/v1/plans/:planId
```

### Suscripciones (JWT requerido)

```
POST /api/v1/subscriptions/select
POST /api/v1/subscriptions/checkout
GET  /api/v1/subscriptions/current
POST /api/v1/subscriptions/webhook/stripe
```

### Gestión ORG (JWT + ORG_ROLE requerido)

```
# Profesores
POST   /api/v1/org-management/professors/request-approval
POST   /api/v1/org-management/professors/:professorId/approve
POST   /api/v1/org-management/professors/:professorId/reject
GET    /api/v1/org-management/professors/approved

# Calificación de código
POST   /api/v1/org-management/code/rate
GET    /api/v1/org-management/code/ratings/:roomId

# Restricciones de IA
POST   /api/v1/org-management/rooms/:roomId/ai-restrictions
GET    /api/v1/org-management/rooms/:roomId/ai-restrictions

# Analíticas
GET /api/v1/org-management/analytics/student/:studentId

# Permisos en sala
PUT /api/v1/org-management/rooms/:roomId/permissions
```

## Flujos Principales

### Flujo Plan FREE

1. Usuario llama `POST /api/v1/subscriptions/select`
   ```json
   {
     "planName": "FREE",
     "email": "user@example.com",
     "name": "Juan"
   }
   ```

2. Sistema crea suscripción activa

3. Sistema envía email de bienvenida con info de otros planes

4. Sistema actualiza `typePlan` en AuthService

### Flujo Plan PRO/ORG

1. Usuario llama `POST /api/v1/subscriptions/select`
   ```json
   {
     "planName": "PRO",
     "email": "user@example.com",
     "name": "Juan"
   }
   ```

2. Sistema retorna sesión de checkout Stripe
   ```json
   {
     "success": true,
     "data": {
       "checkoutUrl": "https://checkout.stripe.com/...",
       "sessionId": "cs_test_..."
     }
   }
   ```

3. Usuario completa pago en Stripe

4. Webhook recibe `checkout.session.completed`

5. Sistema crea suscripción activa y envía factura por email

### Flujo ORG con Profesor

**Paso 1: Compra**
- Admin de institución compra plan ORG
- Se registra como `contractorEmail`

**Paso 2: Solicitud**
- Profesor llama `POST /api/v1/org-management/professors/request-approval`
- Email enviado al contractante

**Paso 3: Aprobación**
- Contractante llama `POST /api/v1/org-management/professors/{id}/approve`
- Profesor obtiene rol ORG_ROLE

**Paso 4: Profesor crea sala**
- Puede establecer restricciones de IA: `POST /api/v1/org-management/rooms/{roomId}/ai-restrictions`
- Puede controlar permisos: `PUT /api/v1/org-management/rooms/{roomId}/permissions`

**Paso 5: Calificación**
- Profesor califica código: `POST /api/v1/org-management/code/rate`
- Puede usar IA para análisis
- Estudiante ve calificación en analíticas: `GET /api/v1/org-management/analytics/student/{studentId}`

## Límites por Plan

| Característica | FREE | PRO | ORG |
|---|---|---|---|
| Precio | $0 | $20/mes | $50+/mes |
| Salas activas | 3 | Ilimitadas | Ilimitadas |
| Usuarios por sala | 5 | 20 | Ilimitados |
| Ejecución de código | Básica (50/mes) | Prioritaria | Ilimitada |
| Explicaciones IA | 10 | 20 | Ilimitadas |
| Historial versiones | No | Sí | Sí |
| Panel admin | No | No | Sí |
| Analíticas | No | No | Sí |
| Branding | No | No | Sí |
| Soporte dedicado | No | No | Sí |

## Integración con otros servicios

- **AuthService**: Actualiza `typePlan` y roles de usuario
- **ServiceRoom**: Consulta límites de salas activas y usuarios por sala
- **ServiceChat**: Consulta límites de explicaciones con IA
- **ServiceCodeSessions**: Consulta límites de ejecuciones

## TODO (Próximas implementaciones)

- [ ] Integración profunda con ServiceChat para análisis de código con IA
- [ ] Dashboard de analíticas avanzadas para ORG
- [ ] Manejo de cancelaciones de suscripción
- [ ] Reintentos automáticos de pago fallido
- [ ] Facturación recurrente
- [ ] Soporte para múltiples monedas
- [ ] Plan de downgrade automático al vencer suscripción
- [ ] Validación de firma de webhook de Stripe en producción

## Variables de Entorno

Ver `.env.example` para lista completa.

## Testing

(Pendiente implementar suite de tests)

## Notas de Desarrollo

- Los planes se seedean automáticamente en el primer inicio
- Los emails se envían de forma asincrónica
- Las validaciones de JWT se hacen en middleware
- Los errores de negocio retornan status HTTP apropiados
- Se usa MongoDB para todas las colecciones

## Autor

Josuë Jiménez - SynapseCode Team
