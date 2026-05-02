# CHECKLIST DE VERIFICACIÓN

Usa este checklist para verificar que todo está correctamente implementado.

---

## ✅ ESTRUCTURA DE CARPETAS

```
□ SynapseCode-ServicePlans/
  □ src/
    □ plans/
      □ plan.model.js
      □ plans.controller.js
      □ plans.routes.js
    □ subscriptions/
      □ subscription.model.js
      □ subscriptions.controller.js
      □ subscriptions.routes.js
    □ org-management/
      □ code-rating.model.js
      □ room-ai-restrictions.model.js
      □ org-management.controller.js
      □ org-management.routes.js
    □ health/
      □ health.routes.js
  □ configs/
    □ app.js
    □ config.js
    □ db.js
    □ cors-configuration.js
    □ helmet-configuration.js
  □ helpers/
    □ email-service.js
    □ stripe-service.js
    □ auth-service-bridge.js
    □ seed-plans.js
  □ middlewares/
    □ request-limit.js
    □ validate-JWT.js
    □ validate-org-role.js
    □ validation.js
    □ server-genericError-handler.js
  □ utils/
    □ plan-constants.js
    □ errors.js
    □ responses.js
  □ .env.example
  □ .gitignore
  □ index.js
  □ package.json
  □ pnpm-lock.yaml
  □ README.md
  □ API_EXAMPLES.md
  □ QUICKSTART.md
  □ INTEGRATION.md
  □ IMPLEMENTATION_SUMMARY.md
```

---

## ✅ ARCHIVOS CONFIGURADOS

**index.js:**
```javascript
□ Import connect from configs/db.js
□ Import app from configs/app.js
□ Import seedPlans from helpers/seed-plans.js
□ Llamada a connectDB()
□ Llamada a seedPlans() después de conexión
□ app.listen() en port (default 3013)
```

**package.json:**
```javascript
□ "name": "@synapsecode/service-plans"
□ "version": "1.0.0"
□ "type": "module"
□ Dependencias: express, mongoose, stripe, nodemailer, express-validator, axios
□ "scripts": { "dev": "nodemon index.js", "start": "node index.js" }
```

**configs/app.js:**
```javascript
□ Express instance con middleware
□ CORS configurado
□ Helmet configurado
□ Morgan configurado
□ Rate limiting
□ Routes montadas (/api/v1/health, /api/v1/plans, /api/v1/subscriptions, /api/v1/org-management)
□ 404 handler
□ Global error handler
```

**configs/config.js:**
```javascript
□ PORT (default 3013)
□ MONGO_URI
□ JWT variables (SECRET, ISSUER, AUDIENCE)
□ Email configuration
□ Stripe keys
□ Plan pricing y limits
□ Rate limit settings
```

**configs/db.js:**
```javascript
□ connectDB() async function
□ Mongoose connection setup
□ Pool size y timeout settings
```

---

## ✅ MODELOS MONGODB

**src/plans/plan.model.js:**
```javascript
□ Schema con: name (enum), price, description, currency, features, isActive, stripeProductId, stripePriceId
□ Timestamps enabled
□ Export como 'Plan'
```

**src/subscriptions/subscription.model.js:**
```javascript
□ Schema con: userId (indexed), planId (ref), planName, status (enum), dates
□ Stripe IDs: customerId, subscriptionId
□ orgInfo con: contractorEmail, institutionName, approvedProfessors array
□ Export como 'Subscription'
```

**src/org-management/code-rating.model.js:**
```javascript
□ Schema con: roomId, fileId, userId, ratedByProfessorId (indexed), code, language, rating, ratingScale
□ aiAnalysis object optional
□ Timestamps
□ Export como 'CodeRating'
```

**src/org-management/room-ai-restrictions.model.js:**
```javascript
□ Schema con: roomId (unique indexed), professorId (indexed), aiEnabled, reason, restrictions
□ Timestamps
□ Export como 'RoomAIRestrictions'
```

---

## ✅ CONTROLADORES

**src/plans/plans.controller.js:**
```javascript
□ getAllPlans() - Retorna planes activos sin IDs Stripe
□ getPlanById() - Retorna plan por ID o 404
```

**src/subscriptions/subscriptions.controller.js:**
```javascript
□ getCurrentSubscription() - GET /current
□ selectPlan() - POST /select (FREE vs paid logic)
□ createCheckoutSession() - POST /checkout
□ handleStripeWebhook() - POST /webhook/stripe
```

**src/org-management/org-management.controller.js:**
```javascript
□ requestProfessorApproval()
□ approveProfessor()
□ rejectProfessor()
□ getApprovedProfessors()
□ rateCode()
□ getCodeRatings()
□ setRoomAIRestrictions()
□ getRoomAIRestrictions()
□ getStudentAnalytics()
□ updateRoomPermissions()
```

---

## ✅ RUTAS

**src/plans/plans.routes.js:**
```javascript
□ GET /api/v1/plans
□ GET /api/v1/plans/:planId
```

**src/subscriptions/subscriptions.routes.js:**
```javascript
□ GET /api/v1/subscriptions/current (JWT required)
□ POST /api/v1/subscriptions/select (JWT + validation)
□ POST /api/v1/subscriptions/checkout (JWT + validation)
□ POST /api/v1/subscriptions/webhook/stripe (public)
```

**src/org-management/org-management.routes.js:**
```javascript
□ POST /professors/request-approval (JWT)
□ POST /professors/:professorId/approve (JWT + ORG_ROLE)
□ POST /professors/:professorId/reject (JWT + ORG_ROLE)
□ GET /professors/approved (JWT + ORG_ROLE)
□ POST /code/rate (JWT + ORG_ROLE + validation)
□ GET /code/ratings/:roomId (JWT)
□ POST /rooms/:roomId/ai-restrictions (JWT + ORG_ROLE + validation)
□ GET /rooms/:roomId/ai-restrictions (JWT)
□ GET /analytics/student/:studentId (JWT)
□ PUT /rooms/:roomId/permissions (JWT)
```

**src/health/health.routes.js:**
```javascript
□ GET /api/v1/health
```

---

## ✅ MIDDLEWARES

**middlewares/validate-JWT.js:**
```javascript
□ Extrae token de x-token o Authorization header
□ Verifica con JWT_SECRET
□ Valida issuer y audience
□ Adjunta req.userId y req.user
□ Retorna 401 si es inválido
```

**middlewares/validate-org-role.js:**
```javascript
□ Verifica req.user.role === 'ORG_ROLE'
□ Retorna 403 si no tiene rol
```

**middlewares/validation.js:**
```javascript
□ validatePlanSelection chain (planName, email, name)
□ validateCodeRating chain (roomId, fileId, userId, code, rating, ratingScale)
□ validateRoomAIRestrictions chain (aiEnabled, restrictions)
□ handleValidationErrors middleware
```

**middlewares/request-limit.js:**
```javascript
□ Rate limiting: 900s window, 100 requests
□ Excluye /api/v1/health
```

---

## ✅ HELPERS

**helpers/email-service.js:**
```javascript
□ sendPlanSelectionEmail()
□ sendPaymentConfirmationEmail()
□ sendFreePlanEmail()
□ sendOrgApprovalRequestEmail()
□ Usa Nodemailer con Gmail SMTP
□ Usa variables de .env
```

**helpers/stripe-service.js:**
```javascript
□ createStripeCheckoutSession()
□ createStripeCustomer()
□ handleStripeWebhook() para checkout.session.completed
```

**helpers/auth-service-bridge.js:**
```javascript
□ getUserFromAuthService()
□ updateUserPlan()
□ updateUserRole()
□ Usa axios para HTTP calls
```

**helpers/seed-plans.js:**
```javascript
□ seedPlans() async function
□ Verifica si planes existen (countDocuments)
□ Inserta 3 planes: FREE, PRO, ORG
□ Con todos los límites y características
```

---

## ✅ UTILIDADES

**utils/plan-constants.js:**
```javascript
□ planLimits object con FREE, PRO, ORG
□ Cada uno con: maxActiveRooms, maxUsersPerRoom, etc.
□ ratingScales: 0-10, 0-15, 0-100%
□ subscriptionStatus: ACTIVE, PENDING, CANCELLED, EXPIRED
```

**utils/errors.js:**
```javascript
□ ApiError class (base)
□ ValidationError
□ NotFoundError
□ UnauthorizedError
□ ForbiddenError
□ ConflictError
□ Cada uno con statusCode apropiado
```

**utils/responses.js:**
```javascript
□ buildSuccessResponse()
□ buildErrorResponse()
□ buildPaginatedResponse()
```

---

## ✅ ARCHIVOS EXTERNOS ACTUALIZADOS

**AuthService/helpers/role-constants.js:**
```javascript
□ export const ORG_ROLE = 'ORG_ROLE'
□ ALLOWED_ROLES incluye ORG_ROLE
```

**scripts/dev.js:**
```javascript
□ ServicePlans agregado a services array
□ Port 3013, color amarillo
□ healthUrl y docsUrl configurados
```

**scripts/start.js:**
```javascript
□ ServicePlans agregado a services array
□ Port 3013
```

**README.md (raíz):**
```javascript
□ SynapseCode-ServicePlans en tabla de contenidos
□ Sección completa de documentación
□ Agregado a mapa de servicios
□ Endpoints de planes y suscripciones documentados
```

---

## ✅ DOCUMENTACIÓN

```javascript
□ README.md - Documentación completa (250+ líneas)
□ API_EXAMPLES.md - 13 ejemplos de endpoints
□ QUICKSTART.md - Guía de inicio rápido
□ INTEGRATION.md - Cómo integrarse con otros servicios
□ IMPLEMENTATION_SUMMARY.md - Resumen de lo implementado
□ .env.example - Template de variables
□ .gitignore - Configuración Git
```

---

## ✅ FLUJO DE USUARIO

**Plan FREE:**
```
1. Usuario selecciona plan FREE
2. Sistema crea suscripción en DB
3. Envía email de bienvenida
4. Actualiza plan en AuthService
5. Usuario puede usar SynapseCode
```

**Plan PRO/ORG (con pago):**
```
1. Usuario selecciona plan PRO/ORG
2. Sistema genera sesión Stripe
3. Retorna checkout URL
4. Usuario paga en Stripe
5. Webhook recibe confirmación
6. Sistema crea suscripción
7. Actualiza plan en AuthService
8. Envía factura por email
```

**ORG con profesores:**
```
1. Profesor solicita aprobación ORG
2. Email va a contractante
3. Contractante aprueba
4. Profesor obtiene ORG_ROLE
5. Puede calificar código
6. Puede restringir IA
7. Puede ver analíticas
```

---

## 🔧 VERIFICACIÓN FUNCIONAL

### Antes de iniciar el servicio:

```bash
□ cd SynapseCode-ServicePlans
□ cp .env.example .env
□ Editar .env con credenciales reales
□ pnpm install (o ya está hecho)
```

### Iniciar y probar:

```bash
□ pnpm dev
□ Esperar a que aparezca "listening on port 3013"
□ Probar curl http://localhost:3013/api/v1/health
□ Debe responder: {"status":"UP","service":"SynapseCode-ServicePlans",...}
```

### Probar endpoints:

```bash
□ GET /api/v1/plans - Debe retornar 3 planes
□ GET /api/v1/subscriptions/current - Con JWT válido
□ POST /api/v1/subscriptions/select - Con datos válidos
```

---

## ⚠️ POSIBLES PROBLEMAS

| Problema | Solución |
|----------|----------|
| MONGO_URI inválida | Verificar conexión a MongoDB, configurar en .env |
| JWT_SECRET no configurado | Agregar JWT_SECRET en .env |
| Stripe keys no validas | Usar keys de test (sk_test_...) o producción (sk_live_...) |
| Emails no se envían | Verificar SMTP_USERNAME y SMTP_PASSWORD en .env |
| Rate limit muy restrictivo | Ajustar en configs/config.js |
| CORS error desde frontend | Verificar CORS_ORIGINS en .env |

---

## ✅ FINAL VALIDATION

```
Checkear que todos los archivos están presentes: ___
Verificar que todos los imports funcionan: ___
Confirmar que se puede iniciar sin errores: ___
Probar health check: ___
Probar listar planes: ___
Probar seleccionar plan FREE: ___
Verificar que se créo suscripción en DB: ___
Verificar que se envió email: ___
Verificar que se actualizó plan en AuthService: ___
LISTO PARA PRODUCCIÓN: ___
```

---

## 📞 SI ALGO FALLA

1. Revisar los logs de la terminal
2. Buscar líneas que empiecen con [ERROR]
3. Verificar configuración de .env
4. Revisar que MongoDB está corriendo
5. Revisar que AuthService está disponible
6. Ver documentación en README.md
7. Ver ejemplos en API_EXAMPLES.md
8. Ver integración en INTEGRATION.md

---

**Una vez que hayas verificado todos los checkboxes, el servicio está listo para producción.**
