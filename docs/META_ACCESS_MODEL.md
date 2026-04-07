# Meta Integration: Modelo de Acceso para Propi CRM

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

## Modelo A: Usuarios como Testers (RECOMENDADO PARA ARRANCAR)

### Como funciona
1. Tu tienes UNA Meta App (la de Propi)
2. Cada usuario de Propi es agregado como **Tester** en tu Meta App
3. El usuario acepta la invitacion en developers.facebook.com
4. El usuario genera su token desde el Graph API Explorer usando TU app
5. Los webhooks llegan a TU endpoint porque la suscripcion es por app

### Limites
- **Sin Business Verification: 50 testers maximo**
- Con Business Verification: 500 testers
- Con Advanced Access (App Review): sin limite

### Ventajas
- Un solo webhook endpoint, un solo App Secret para validar HMAC
- El usuario solo necesita aceptar invitacion + generar token
- Tu controlas todo desde un solo lugar

### Desventajas
- Limite de 50 usuarios sin empresa
- El usuario tiene que ir a developers.facebook.com a aceptar la invitacion

### Flujo del usuario
1. Tu le envias invitacion como Tester desde el App Dashboard
2. El usuario acepta en developers.facebook.com/requests
3. El usuario abre Graph API Explorer, selecciona TU app
4. Genera token con los permisos necesarios
5. Pega token + IDs en Propi Configuracion

---

## Modelo B: Cada Usuario Crea su Propia App (PROBLEMATICO)

### Como funcionaria en teoria
1. Cada usuario crea su propia Meta App en developers.facebook.com
2. Genera tokens desde SU app (tiene Standard Access sobre sus propias cuentas)
3. Pega tokens en Propi

### El problema critico: WEBHOOKS

Los webhooks de Meta estan atados a la APP, no al token. Cuando un usuario
suscribe su Page o WABA a webhooks, los eventos se envian al webhook URL
configurado en SU app, no en la tuya.

Esto significa que:
- Cada usuario tendria que configurar SU webhook URL apuntando a propi.aikalabs.cc
- Cada app tiene un App Secret diferente, asi que la validacion HMAC de Propi
  no funcionaria (Propi valida con UN solo META_APP_SECRET)
- Si el usuario no configura el webhook, los mensajes entrantes nunca llegan a Propi

### Para que funcione necesitarias:
1. Que cada usuario configure el webhook URL en su app (muy tecnico)
2. Almacenar el App Secret de cada usuario en Propi (riesgo de seguridad)
3. Validar HMAC con diferentes secrets por usuario (cambio de arquitectura)
4. O desactivar la validacion HMAC (inaceptable en produccion)

### Veredicto: NO VIABLE para un CRM multi-tenant

---

## Modelo C: Tokens Manuales SIN Webhooks (PARCIAL)

### Como funciona
1. El usuario genera tokens desde cualquier fuente (su app, Graph API Explorer, etc)
2. Propi usa esos tokens para ENVIAR mensajes y leer datos (API calls salientes)
3. Los mensajes ENTRANTES no llegan a Propi (no hay webhook)

### Que funciona
- Enviar mensajes por WhatsApp, Instagram, Facebook
- Leer metricas de Instagram y Facebook (insights, posts, followers)
- Publicar contenido
- Ver historial de conversaciones (via API polling, no real-time)

### Que NO funciona
- Recibir mensajes en tiempo real (no hay webhook)
- Inbox unificado con mensajes entrantes
- Notificaciones de nuevos mensajes

### Veredicto: Sirve para publicar y ver metricas, NO para inbox

---

## Recomendacion Final

### Fase 1: MVP (0-50 usuarios)
**Modelo A con 50 testers.**
- Agrega cada usuario como Tester en tu Meta App
- El usuario acepta invitacion + genera token + pega en Propi
- Webhooks funcionan porque todo pasa por tu app
- Limite duro: 50 personas

### Fase 2: Escalar (50-500 usuarios)
**Registrar empresa + Business Verification.**
- LLC en EEUU (~$100-200 online, Wyoming o Delaware)
- O firma personal en Venezuela (RIF)
- Business Verification toma 2-14 dias
- Desbloquea 500 testers inmediatamente
- Permite aplicar a App Review para Advanced Access

### Fase 3: Produccion (500+ usuarios)
**Advanced Access via App Review.**
- Submit App Review con screencasts
- Aprobacion toma 2-6 semanas
- Sin limite de usuarios
- Los usuarios conectan con Facebook Login (OAuth automatico)
- No necesitan ir a developers.facebook.com

### Fase 4: WhatsApp automatico (opcional)
**Tech Provider + Embedded Signup.**
- Aplicar como Tech Provider
- Integrar Embedded Signup
- Los usuarios conectan WhatsApp con 2 clicks
- No necesitan crear WABA manualmente

---

## Tabla de Compatibilidad por Modelo

| Feature | Modelo A (Testers) | Modelo B (App propia) | Modelo C (Sin webhook) |
|---------|-------------------|----------------------|----------------------|
| Enviar mensajes WA | Si | Si | Si |
| Recibir mensajes WA | Si | No (webhook roto) | No |
| Enviar DMs IG | Si | Si | Si |
| Recibir DMs IG | Si | No (webhook roto) | No |
| Enviar msgs FB | Si | Si | Si |
| Recibir msgs FB | Si | No (webhook roto) | No |
| KPIs Instagram | Si | Si | Si |
| KPIs Facebook | Si | Si | Si |
| Inbox unificado | Si | No | No |
| Limite usuarios | 50 | Sin limite | Sin limite |
| Complejidad setup | Media | Muy alta | Baja |

---

## Links Oficiales

- [Access Levels](https://developers.facebook.com/docs/graph-api/overview/access-levels/)
- [App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles/)
- [App Review](https://developers.facebook.com/docs/app-review/)
- [Business Verification](https://www.facebook.com/business/help/2058515294227817)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [WhatsApp Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup/)
- [Instagram Messaging API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)
