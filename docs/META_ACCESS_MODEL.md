# Meta Integration: Modelo de Acceso para Propi CRM

> Ultima actualizacion: Abril 2026

## Resumen Ejecutivo

Propi necesita que multiples realtors conecten sus cuentas de Instagram, Facebook y WhatsApp
para recibir y responder mensajes desde el inbox unificado. Este documento analiza como
lograrlo con una cuenta de Meta Developer sin Business Verification.

## El Problema Central

Meta tiene dos niveles de acceso:

| Nivel | Quien puede usar la app | Requiere |
|-------|------------------------|----------|
| **Standard Access** | Solo personas con rol en tu app (admin/developer/tester) | Nada |
| **Advanced Access** | Cualquier usuario del mundo | App Review + Business Verification |

**Business Verification requiere una empresa registrada** (LLC, firma personal, etc).
Sin empresa, estas limitado a Standard Access.

> Fuente: [Access Levels - Graph API](https://developers.facebook.com/docs/graph-api/overview/access-levels/)

---

## Roles y Limites de tu Meta App

### Tipos de roles

| Rol | Que puede hacer | Limite |
|-----|----------------|--------|
| **Admin** | Editar app, ver App Secret, agregar/quitar personas, ver insights, eliminar app | **500** |
| **Developer** | Crear test users, ver app settings (no editar) | Sin limite documentado |
| **Tester** | Usar la app (generar tokens, autorizar permisos, usar todas las funciones) | **50** (sin BV) / **500** (con BV) |

> Fuente: [App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles/)

### Lo que necesitas para Propi

- **1 Admin** (tu): Controlas la app, configuras webhooks, ves el App Secret
- **Hasta 50 Testers** (tus realtors): Usan la app con pleno acceso a messaging

**NO agregues realtors como Admins.** Un admin puede ver tu App Secret, eliminar la app,
y cambiar configuraciones. Solo tu debes ser admin.

### Que pueden hacer los Testers (pleno uso)

Los testers tienen acceso completo a todas las funciones:

> "All features are active for Testers while it is in development."
> Fuente: [App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles/)

Esto incluye:

**Instagram:**
- Recibir DMs en el inbox de Propi
- Responder DMs desde Propi
- Ver metricas (insights, followers, engagement)
- Publicar contenido (fotos, stories)

**Facebook Messenger:**
- Recibir mensajes de Messenger en Propi
- Responder desde Propi
- Ver metricas de la pagina
- Publicar en la pagina

**WhatsApp:**
- Enviar y recibir mensajes via Cloud API
- Enviar templates
- Recibir status updates (delivered, read)

### Aclaracion importante: Clientes vs Realtors

**Solo los realtors (usuarios de Propi) necesitan ser testers.**
Los clientes finales que escriben a los realtors por IG/FB/WA NO necesitan
ser testers ni tener ningun rol. Escriben normalmente y los mensajes
llegan al inbox de Propi.

Ejemplo: Si tienes 50 realtors como testers, cada uno puede atender
miles de clientes. El limite es de realtors, no de clientes finales.

---

## Rate Limits (Limites de API)

### Graph API (aplica a IG + FB)

| Tipo | Formula | Con 50 testers |
|------|---------|----------------|
| **App-level** | `200 x usuarios_activos_diarios` calls/hora | 10,000 calls/hora |
| **Page-level** | 4,800 calls/persona/24h | 4,800 por pagina |

> Fuente: [Rate Limiting - Graph API](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/)

### Messenger Send API

| Limite | Valor |
|--------|-------|
| Envio de mensajes | **250 mensajes/segundo** (safe limit) |
| Mensajes por pagina | Sin limite diario documentado |

> Fuente: [Send Messages - Messenger Platform](https://developers.facebook.com/docs/messenger-platform/send-messages/#limits)

### Instagram Messaging

| Limite | Valor |
|--------|-------|
| Ventana de respuesta | **24 horas** desde ultimo mensaje del cliente |
| Tamano de mensaje | **1,000 bytes** max |
| Conversaciones por request | **50 entries** max (paginado) |
| Mensajes inactivos | Desaparecen despues de **30 dias** en Requests |

> Fuente: [Instagram Messaging API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/)

### WhatsApp Cloud API

| Limite | Valor |
|--------|-------|
| Throughput | **500 mensajes/segundo** (envio + recepcion) |
| Ventana de sesion | **24 horas** desde ultimo mensaje del cliente |
| Templates fuera de ventana | Requieren aprobacion previa de Meta |
| Webhook retry | Exponential backoff por **7 dias** si no recibe 200 |

> Fuente: [WhatsApp Cloud API Overview](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/)

---

## Modelo A: Usuarios como Testers (RECOMENDADO)

### Como funciona
1. Tu tienes UNA Meta App (la de Propi)
2. Cada realtor es agregado como **Tester** en tu Meta App
3. El realtor acepta la invitacion en developers.facebook.com/requests
4. El realtor genera su token desde el Graph API Explorer usando TU app
5. Los webhooks llegan a TU endpoint porque la suscripcion es por app

### Limites
- **Sin Business Verification: 50 testers (realtors) maximo**
- Con Business Verification: 500 testers
- Con Advanced Access (App Review): sin limite

### Ventajas
- Un solo webhook endpoint, un solo App Secret para validar HMAC
- El realtor solo necesita aceptar invitacion + generar token
- Tu controlas todo desde un solo lugar
- Pleno uso de todas las funciones (messaging, insights, publicacion)

### Desventajas
- Limite de 50 realtors sin empresa
- El realtor tiene que ir a developers.facebook.com a aceptar la invitacion

### Flujo del realtor
1. Tu le envias invitacion como Tester desde el App Dashboard
2. El realtor acepta en developers.facebook.com/requests
3. El realtor abre Graph API Explorer, selecciona TU app
4. Genera token con los permisos necesarios
5. Pega token + IDs en Propi > Configuracion

---

## Modelo B: Cada Usuario Crea su Propia App (NO VIABLE)

### El problema critico: WEBHOOKS

Los webhooks de Meta estan atados a la APP, no al token. Cuando un usuario
suscribe su Page o WABA a webhooks, los eventos se envian al webhook URL
configurado en SU app, no en la tuya.

Esto significa que:
- Cada usuario tendria que configurar SU webhook URL apuntando a propi.aikalabs.cc
- Cada app tiene un App Secret diferente, la validacion HMAC de Propi no funcionaria
- Si el usuario no configura el webhook, los mensajes entrantes nunca llegan

**Veredicto: NO VIABLE para un CRM multi-tenant con inbox unificado.**

> Fuente: [Webhooks Getting Started](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/)

---

## Modelo C: Tokens Manuales SIN Webhooks (PARCIAL)

### Que funciona
- Enviar mensajes por WhatsApp, Instagram, Facebook
- Leer metricas de Instagram y Facebook
- Publicar contenido
- Ver historial de conversaciones (via API polling, no real-time)

### Que NO funciona
- Recibir mensajes en tiempo real (no hay webhook)
- Inbox unificado con mensajes entrantes

**Veredicto: Sirve para publicar y ver metricas, NO para inbox.**

---

## Roadmap de Escalamiento

### Fase 1: MVP (0-50 realtors)
**Modelo A con 50 testers.**
- Agrega cada realtor como Tester en tu Meta App
- Pleno uso de IG + FB + WA messaging, insights, publicacion
- Limite duro: 50 realtors (clientes ilimitados)

### Fase 2: Escalar (50-500 realtors)
**Registrar empresa + Business Verification.**
- LLC en EEUU (~$100-200 online, Wyoming o Delaware)
- O firma personal en Venezuela (RIF)
- Business Verification toma 2-14 dias
- Desbloquea 500 testers inmediatamente
- Permite aplicar a App Review para Advanced Access

> Fuente: [Business Verification](https://www.facebook.com/business/help/2058515294227817)

### Fase 3: Produccion (500+ realtors)
**Advanced Access via App Review.**
- Submit App Review con screencasts
- Aprobacion toma 2-6 semanas
- Sin limite de usuarios
- Los realtors conectan con Facebook Login (OAuth automatico)
- No necesitan ir a developers.facebook.com

> Fuente: [App Review](https://developers.facebook.com/docs/app-review/)

### Fase 4: WhatsApp automatico (opcional)
**Tech Provider + Embedded Signup.**
- Aplicar como Tech Provider
- Integrar Embedded Signup
- Los realtors conectan WhatsApp con 2 clicks

> Fuente: [Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup/)

---

## Tabla de Compatibilidad

| Feature | Modelo A (Testers) | Modelo B (App propia) | Modelo C (Sin webhook) |
|---------|-------------------|----------------------|----------------------|
| Enviar mensajes WA | Si | Si | Si |
| Recibir mensajes WA | Si | No | No |
| Enviar DMs IG | Si | Si | Si |
| Recibir DMs IG | Si | No | No |
| Enviar msgs FB | Si | Si | Si |
| Recibir msgs FB | Si | No | No |
| KPIs Instagram | Si | Si | Si |
| KPIs Facebook | Si | Si | Si |
| Inbox unificado | Si | No | No |
| Publicar contenido | Si | Si | Si |
| Limite realtors | 50 | Sin limite | Sin limite |
| Clientes por realtor | Ilimitados | Ilimitados | Ilimitados |

---

## Fuentes Oficiales

| Tema | URL |
|------|-----|
| Access Levels (Standard vs Advanced) | https://developers.facebook.com/docs/graph-api/overview/access-levels/ |
| App Roles (limites de admin/tester) | https://developers.facebook.com/docs/development/build-and-test/app-roles/ |
| Rate Limiting (Graph API) | https://developers.facebook.com/docs/graph-api/overview/rate-limiting/ |
| App Review | https://developers.facebook.com/docs/app-review/ |
| Business Verification | https://www.facebook.com/business/help/2058515294227817 |
| Instagram Messaging API | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/ |
| Instagram App Review | https://developers.facebook.com/docs/instagram-platform/app-review/ |
| Messenger Platform | https://developers.facebook.com/docs/messenger-platform/ |
| Messenger Send Limits | https://developers.facebook.com/docs/messenger-platform/send-messages/#limits |
| WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/overview/ |
| WhatsApp Embedded Signup | https://developers.facebook.com/docs/whatsapp/embedded-signup/ |
| Webhooks Setup | https://developers.facebook.com/docs/graph-api/webhooks/getting-started/ |
| Graph API Explorer | https://developers.facebook.com/tools/explorer/ |
| Access Token Debugger | https://developers.facebook.com/tools/debug/accesstoken/ |
