# Propi - Roadmap de Implementacion

## Sprint 7: Layout responsive grado produccion
**Estado: EN PROGRESO**

- Dashboard: grid fijo que no se mueve en web ni mobile
- Todas las paginas: estructura estatica, no colapsa
- Mobile: cards apiladas, sin scroll horizontal roto
- Web: grid de 4 columnas en cards, 2-3 en bottom section
- Propi Magic: chat centrado, no se desborda
- Meta pages (IG metrics, FB insights): solo web, ocultas en mobile nav

## Sprint 8: Migrar email de Nodemailer a Resend
- Reemplazar `src/lib/mailer.ts` (Nodemailer SMTP) por Resend SDK
- 1 env var: `RESEND_API_KEY` (gratis 3K emails/mes)
- Mantener la misma interfaz de `sendEmail()` para no romper campanas
- Quitar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM del .env
- Actualizar settings page para mostrar Resend en vez de SMTP config

## Sprint 9: Proxy de imagenes para Meta
- Crear `/api/images/[key]/route.ts` que sirve imagenes de MinIO publicamente
- Instagram publish: usar `https://propi.aikalabs.cc/api/images/{key}` como image_url
- Facebook publish: igual
- Las imagenes de publicaciones NO se guardan permanentemente
- Las imagenes de propiedades SI se quedan hasta que el cliente las elimine
- Cache-Control: public, max-age=86400 en el proxy

## Sprint 10: Publicar en MercadoLibre con 1 click
- Boton "Publicar en ML" en la card de cada propiedad
- Ventana emergente (modal) con:
  - Preview de la propiedad (titulo, precio, fotos)
  - Selector de categoria ML (auto-detectada por tipo)
  - Selector de plan/tipo de publicacion (gratis, clasica, premium)
  - Ubicacion (auto-detectada por ciudad)
  - Boton "Publicar"
- Flujo backend:
  1. Descargar imagenes de MinIO
  2. Subir cada imagen a ML via `POST /pictures/items/upload` (multipart)
  3. Crear listing con `POST /items` incluyendo picture_ids
  4. Guardar `ml_item_id` en la propiedad para sincronizar despues
- El JSON se transforma automaticamente del schema de Propi al formato ML

## Sprint 11: Publicar en Wasi con 1 click
- Boton "Publicar en Wasi" en la card de cada propiedad
- Wasi usa API key (no OAuth): `id_company` + `wasi_token` en settings
- Modal con:
  - Preview de la propiedad
  - Campos adicionales de Wasi (estrato, tipo de renta, disponibilidad)
  - Boton "Publicar"
- Flujo backend:
  1. `POST api.wasi.co/v1/property/add` con datos mapeados
  2. Subir imagenes via `POST api.wasi.co/v1/property/upload-image/{id}`
  3. Sincronizar con portales: `POST api.wasi.co/v1/portal/send-property/{id}`
  4. Guardar `wasi_property_id` en la propiedad

## Sprint 12: Dashboard de Meta completo (solo web)
- Pagina `/marketing/instagram/metrics` rediseñada:
  - KPIs: reach, impressions, profile_views, follower_count
  - Posts recientes con metricas (engagement, saves, shares)
  - Grafico de reach por dia (ultimos 30 dias)
- Pagina `/marketing/facebook/insights` rediseñada:
  - KPIs: page_views_total, page_engaged_users, page_daily_follows
  - Posts recientes con metricas
  - Fix: reemplazar `page_fans` (deprecado) por metricas actuales
- Ambas paginas: solo visibles en web (no en mobile bottom nav)
- Layout dark theme consistente con el dashboard principal

## Sprint 13: Wasi auth en settings
- Seccion "Wasi" en `/marketing/settings`
- 2 campos: `id_company` y `wasi_token`
- Se guardan en `social_accounts` (platform: "wasi")
- No OAuth, no login, solo copiar/pegar desde el dashboard de Wasi

## Orden de ejecucion

| Sprint | Prioridad | Dependencia |
|--------|----------|-------------|
| 7 | Alta | Ninguna |
| 8 | Alta | Ninguna |
| 9 | Alta | Ninguna |
| 10 | Alta | Sprint 9 (proxy de imagenes para ML upload) |
| 11 | Media | Sprint 13 (Wasi auth) |
| 12 | Media | Ninguna |
| 13 | Media | Ninguna |
