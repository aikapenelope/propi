# Propi - Roadmap de Implementacion

## Sprints completados

| Sprint | Feature | Estado |
|--------|---------|--------|
| 7 | Layout responsive grado produccion | Completado |
| 8 | Migrar email de Nodemailer a Resend | Completado |
| 9 | Proxy de imagenes para publicacion | Completado |
| 10 | Publicar en MercadoLibre | Descartado (ML solo como fuente de datos) |
| 11 | Publicar en Wasi con 1 click | Eliminado (reemplazado por publicacion asistida) |
| 12 | Dashboard de Meta completo | Descartado (no Meta API directa) |
| 13 | Wasi auth en settings | Eliminado (reemplazado por publicacion asistida) |
| 14 | Production hardening | Completado |
| 15 | Market actions hardening | Completado |
| 16 | UX improvements | Completado |
| 17 | Performance optimization | Completado |
| 18 | DB audit fixes | Completado |
| 19 | Auditoria P0 fixes | Completado |
| 20 | Pipeline, email BullMQ, schema improvements | Completado |
| 21 | Mini portal web del agente | Completado |
| 22 | Notificaciones in-app (campana, badge, cron) | Completado |
| 23 | Envio de ficha de propiedad por email | Completado |
| 24 | Simulador de comisiones | Completado |
| 25 | Calendario mobile UX (agenda, swipe, touch) | Completado |
| 26 | Resend API key por usuario | Eliminado (simplificado a key global) |
| 27 | Historial de actividad automatico por contacto | Completado |
| 28 | Matching propiedad-contacto por preferencias | Completado |
| 29 | Preferencias de busqueda en formulario de contacto | Completado |
| 30 | Tooltips de ayuda contextual (30 tooltips, 4 sprints) | Completado |
| 31 | PWA UX (view transitions, pull-to-refresh, haptics, swipe, skeletons) | Completado |
| 32 | CSP fixes (Clerk CAPTCHA, Iconify) | Completado |
| 33 | Landing actualizada ($30, features reales) | Completado |
| 34 | Logos de Propi (PWA + sidebar) + dashboard moderno | Completado |
| 35 | Reportes PDF profesionales (5 paginas, @react-pdf/renderer) | Completado |
| 36 | Limpieza: eliminar Wasi API + publicacion asistida multi-portal | Completado |
| 37 | Limpieza: eliminar email marketing (campanas + drip) | Completado |
| 38 | Limpieza: eliminar reportes automaticos por email | Completado |
| 39 | Hardening: Redis password, CRON_SECRET, entrypoint, queue lazy init | Completado |
| 40 | Fixes: drip advance-on-failure, deletePropertyImage, createProperty tx | Completado |
| 41 | Robustez: rate limit cleanup, lint CI, health check, notification cleanup | Completado |
| 42 | Recordatorio de leads inactivos (7+ dias sin actividad) | Completado |
| 43 | Ficha de propiedad PDF descargable | Completado |
| 44 | Toast notifications (feedback visual) | Completado |
| 45 | PWA: install prompt + shortcuts + badge count | Completado |

---

## Pendiente: Configurar cron jobs en Coolify

El codigo tiene 3 cron endpoints listos pero **no estan activados** en Coolify.
Requieren la env var `CRON_SECRET` y cron jobs en Coolify.

| Cron | Endpoint | Frecuencia | Que hace |
|------|----------|------------|----------|
| Notificaciones | `/api/cron/generate-notifications` | Cada hora | Citas proximas, tareas vencidas, cumpleanos, leads inactivos |
| Sync MercadoLibre | `/api/cron/sync-market` | Diario (4am) | Encola jobs en BullMQ para sincronizar listings de ML |
| Cleanup | `/api/cron/cleanup-messages` | Semanal (dom 3am) | Elimina mensajes >90 dias + notificaciones leidas >30 dias |

### Para activar:

1. Agregar env var `CRON_SECRET` a Propi en Coolify
2. Deployar `Dockerfile.worker` como segundo servicio (para sync-market)
3. Configurar cron jobs en Coolify:
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/generate-notifications
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/cleanup-messages
   ```

---

## Backlog: Features pendientes

### P1 — Proximo (cuando haya demanda)

| Feature | Descripcion | Esfuerzo |
|---------|-------------|----------|
| Comparables para tasacion | Reporte de 3-5 propiedades similares (de market_listings) para justificar precio. | 3h |

### P2 — Futuro

| Feature | Descripcion | Esfuerzo |
|---------|-------------|----------|
| Push notifications | Web Push para alertas cuando la app esta cerrada (VAPID + web-push). | 4h |
| Bottom sheets para mobile | Paneles que suben desde abajo para acciones (compartir, filtrar, opciones). | 3h |
| Firma electronica en documentos | Firmar contratos desde la app sin imprimir. | 8h |
| Multi-idioma | Soporte para ingles (agentes con clientes extranjeros). | 6h |
| Modo offline real | Crear/editar contactos y propiedades sin conexion, sync al reconectar. | 12h |

---

## Producto final (Mayo 2026)

### CRM Core
- Contactos con tags, segmentacion, fuente, preferencias de busqueda
- Propiedades con galeria (4 fotos, HEIC->WebP), multi-moneda, GPS
- Pipeline Kanban (7 etapas, drag & drop)
- Calendario con agenda, citas vinculadas a contacto/propiedad
- Tareas con fecha, notas, vinculacion a contacto/propiedad
- Documentos (upload a MinIO, descarga via proxy)
- Busqueda global
- Matching propiedad-contacto por preferencias

### Marketing & Publicacion
- Publicacion asistida en portales: MercadoLibre, Wasi, Facebook Marketplace
- Texto pre-generado + copy-to-clipboard + link directo al portal
- Instagram: acceso directo (publicar, DMs, metricas)
- Facebook: acceso directo (publicar, inbox, insights)
- TikTok: acceso directo (subir video, analiticas)
- Compartir propiedad por WhatsApp/Instagram/Facebook/Link
- Envio de ficha de propiedad por email

### Inteligencia de Mercado (Propi Magic)
- Datos de MercadoLibre Venezuela (sync diario, 6 categorias)
- KPIs por zona: precio promedio, mediana, min, max, precio/m2
- Chat con IA (Groq) que resume datos de mercado
- Busqueda por zona con resultados deduplicados

### Reportes & PDFs
- Reporte PDF profesional de 5 paginas (portada, resumen ejecutivo, transacciones, pipeline, inventario)
- Ficha de propiedad PDF (1 pagina con foto, specs, agente)
- Comparativa vs periodo anterior
- Compartir metricas con broker (acceso por email)

### Notificaciones
- In-app: citas proximas, tareas vencidas, cumpleanos, leads inactivos (7+ dias)
- Campana con badge + dropdown
- App Badging (conteo en icono PWA)
- Toast notifications (feedback visual al guardar)

### PWA
- Service Worker con cache offline de paginas visitadas + fotos
- Install prompt personalizado
- Shortcuts en long-press (Nueva Propiedad, Contactos, Calendario)
- View transitions, pull-to-refresh, haptics

### Paginas Publicas
- /p/[id]: pagina publica de propiedad (compartible por redes)
- /agente/[id]: portal del agente con propiedades activas

### Infraestructura
- Next.js 16 + Drizzle ORM + PostgreSQL + PgBouncer
- MinIO (S3-compatible) para archivos
- Redis + BullMQ para jobs (market sync)
- Clerk para autenticacion
- Coolify para deploy (Hetzner Cloud)
- CI: ESLint + TypeScript + Vitest

---

## Capacidad actual

| Componente | Spec | Limite |
|-----------|------|--------|
| Usuarios simultaneos | Next.js single thread + cache 60s | 80-120 |
| Imagenes | 80GB disco compartido, 500MB quota/usuario | ~160 usuarios |
| PostgreSQL | 200 max_connections, PgBouncer 500 client | ~1600 usuarios |
| Redis | 1GB noeviction | Miles de jobs |
| Email | Resend global (3,000/mes free tier) | Fichas de propiedad + alertas |
| market_listings | ~2KB/listing | Sin limite practico |
