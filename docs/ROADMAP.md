# Propi - Roadmap de Implementacion

## Sprint 7: Layout responsive grado produccion
**Estado: COMPLETADO**

- Dashboard: grid fijo que no se mueve en web ni mobile
- Todas las paginas: estructura estatica, no colapsa
- Mobile: cards apiladas, sin scroll horizontal roto
- Web: grid de 4 columnas en cards, 2-3 en bottom section
- Propi Magic: chat centrado, no se desborda
- Meta pages (IG metrics, FB insights): solo web, ocultas en mobile nav

## Sprint 8: Migrar email de Nodemailer a Resend
**Estado: COMPLETADO**

- `src/lib/mailer.ts` usa Resend SDK
- 1 env var: `RESEND_API_KEY` (gratis 3K emails/mes)
- Misma interfaz `sendEmail()` para campanas y drip sequences

## Sprint 9: Proxy de imagenes
**Estado: COMPLETADO**

- `/api/images/[...key]/route.ts` sirve imagenes de MinIO publicamente
- Rate limit: 100 req/min por IP
- Cache-first en service worker

## Sprint 10: Publicar en MercadoLibre
**Estado: DESCARTADO**

No se publicara en MercadoLibre. ML se usa solo como fuente de datos
para Propi Magic (market_listings via BullMQ worker).

## Sprint 11: Publicar en Wasi con 1 click
**Estado: COMPLETADO**

- Boton "Publicar en Wasi" en detalle de propiedad (`publish-section.tsx`)
- Backend: `wasi.ts` + `wasi-publish.ts` (crear propiedad, subir imagenes, sync portales)
- Guarda `wasi_property_id` en `externalIds` de la propiedad
- Indicador verde cuando ya esta publicada

## Sprint 12: Dashboard de Meta completo
**Estado: DESCARTADO**

No se usara Meta API directamente. Las interacciones con Instagram,
Facebook y WhatsApp seran por ventana emergente (links directos),
no por API.

## Sprint 13: Wasi auth en settings
**Estado: COMPLETADO**

- `wasi-config-form.tsx` en `/marketing/settings`
- 2 campos: `id_company` y `wasi_token`
- Se guardan en `social_accounts` (platform: "wasi")

## Sprint 14: Production hardening
**Estado: COMPLETADO**

- Migraciones versionadas con `drizzle-kit migrate` (reemplaza `push --force`)
- PWA offline: `offline.html` + precache de `/dashboard` (SW v4)
- Uploads: validacion MIME type + rate limit 20/min por usuario
- Infra: passwords/SSH key estables, Redis noeviction para BullMQ

## Sprint 15: Hardening de market actions
**Estado: PENDIENTE**

- Sanitizar inputs ILIKE en `market-listings.ts`, `market-kpis.ts`, `zone-search.ts`
  (usar `sanitizeLike()` como ya se hace en `contacts.ts` y `properties.ts`)
- Agregar `requireUserId()` a las server actions de market que no lo tienen
  (`market-kpis.ts`, `market-listings.ts`, `zone-search.ts`)
  Actualmente protegidas por middleware de Clerk pero sin auth explicita en la funcion

## Orden de ejecucion

| Sprint | Estado | Notas |
|--------|--------|-------|
| 7 | Completado | Layout responsive |
| 8 | Completado | Resend email |
| 9 | Completado | Image proxy |
| 10 | Descartado | ML solo como fuente de datos |
| 11 | Completado | Wasi publish |
| 12 | Descartado | No Meta API directa |
| 13 | Completado | Wasi auth |
| 14 | Completado | Production hardening |
| 15 | Pendiente | Market actions hardening |
