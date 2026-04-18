# Propi - Roadmap de Implementacion

## Sprints completados

| Sprint | Feature | Estado |
|--------|---------|--------|
| 7 | Layout responsive grado produccion | Completado |
| 8 | Migrar email de Nodemailer a Resend | Completado |
| 9 | Proxy de imagenes para publicacion | Completado |
| 10 | Publicar en MercadoLibre | Descartado (ML solo como fuente de datos) |
| 11 | Publicar en Wasi con 1 click | Completado |
| 12 | Dashboard de Meta completo | Descartado (no Meta API directa) |
| 13 | Wasi auth en settings | Completado |
| 14 | Production hardening | Completado |
| 15 | Market actions hardening | Completado |
| 16 | UX improvements | Completado |
| 17 | Performance optimization | Completado |
| 18 | DB audit fixes | Completado |
| 19 | Auditoria P0 fixes | Completado |

## Sprint 14: Production hardening
- Migraciones versionadas con `drizzle-kit migrate` (reemplaza `push --force`)
- PWA offline: `offline.html` + precache de `/dashboard` (SW v4)
- Uploads: validacion MIME type + rate limit 20/min por usuario

## Sprint 15: Market actions hardening
- Sanitizar inputs ILIKE en `market-kpis.ts`, `market-listings.ts`, `zone-search.ts`
- Agregar `requireUserId()` a todas las server actions de market
- Pagina publica `/p/[id]` solo expone columnas necesarias (no userId)

## Sprint 16: UX improvements
- Pipeline: buscador de contactos + drag & drop con `pointerWithin` + `rectIntersection`
- Importacion de contactos: CSV, vCard, Contact Picker API (Chrome Android)
- Calendario: `@fullcalendar/react` con vistas mes/semana/dia/agenda, touch fix para PWA
- Sidebar: TikTok arriba de Email
- Tareas: vista agrupada por fecha (Atrasadas/Hoy/Manana/Semana/Proximas/Sin fecha)
- Tareas: notas expandibles por tarea (nueva columna `notes` en schema)

## Sprint 17: Performance optimization
- Dashboard: 8 queries en paralelo via `Promise.all` (era secuencial)
- Dashboard: cache 60s por usuario con `unstable_cache` + `revalidateTag`
- 2 queries redundantes eliminadas (totales derivados de agrupados)

## Sprint 18: DB audit fixes
- 6 FKs sin `onDelete` corregidas a `SET NULL` (appointments, documents, conversations, email_campaigns)
- `deleteProperty` ahora limpia imagenes de MinIO antes del cascade delete
- `deleteDocument` resiliente a fallos de MinIO (try/catch)
- Loading skeletons en todas las paginas

## Infra (repo separado)
- Passwords estables con `random.RandomPassword` (reemplaza `command.local.Command`)
- SSH key estable con `tls.PrivateKey`
- Redis `noeviction` para BullMQ
- `ignoreChanges: ["sshKeys"]` en todos los servidores
- Documentado en `docs/INFRASTRUCTURE_RISKS.md`

## Sprint 19: Auditoria P0 fixes

- Fix `sanitizeLike` faltante en `getWeeklyNewListings` (omitido en sprint 15)
- Agregar `/api/cron(.*)` a `isPublicRoute` en middleware (Clerk bloqueaba crons)
- Fix `deleteDocument` sin filtro `userId` en el DELETE SQL (defense-in-depth)
- Calendario: `@fullcalendar/react` (corrige referencia a `react-big-calendar` en sprint 16)

## Pendiente: Configurar cron jobs en Coolify

El codigo tiene 3 cron endpoints listos pero **no estan activados** en Coolify.
Se activaran cuando tengamos la API de MercadoLibre aprobada.
Requieren la env var `CRON_SECRET` y cron jobs en Coolify.

| Cron | Endpoint | Frecuencia | Que hace |
|------|----------|------------|----------|
| Sync MercadoLibre | `/api/cron/sync-market` | Diario (4am) | Encola jobs en BullMQ para sincronizar listings de ML |
| Drip campaigns | `/api/cron/process-drips` | Cada hora | Envia emails automaticos de secuencias drip |
| Cleanup mensajes | `/api/cron/cleanup-messages` | Semanal (dom 3am) | Elimina mensajes >90 dias (solo relevante si se activa Meta inbox) |

### Para activar:

1. Agregar env var `CRON_SECRET` a Propi en Coolify
2. Deployar `Dockerfile.worker` como segundo servicio (para sync-market)
3. Configurar cron jobs en Coolify:
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/process-drips
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/cleanup-messages
   ```

## Pendiente: Mejoras post-auditoria (backlog)

| Prioridad | Item | Esfuerzo |
|-----------|------|----------|
| P1 | Crear ESC environment `platform-infra/propi` | 30 min |
| P1 | Agregar limite/paginacion a `getPipelineContacts` (carga todos sin limite) | 1h |
| P1 | Mover `sendEmailCampaign` a BullMQ (evitar timeout con muchos contactos) | 2h |
| P2 | Crear usuarios PostgreSQL por proyecto (R5 en INFRASTRUCTURE_RISKS.md) | 2h |
| P2 | Crear service accounts MinIO por proyecto (R4 en INFRASTRUCTURE_RISKS.md) | 2h |
| P2 | Agregar `magicSearches` a Drizzle relations | 15 min |
| P2 | Indice compuesto en `market_listings(city, neighborhood, property_type)` | 15 min |
| P3 | Evaluar si CSP `unsafe-eval` es removible (puede ser requerido por Clerk) | 1h |

## Capacidad actual

| Componente | Spec | Limite |
|-----------|------|--------|
| Usuarios simultaneos | Next.js single thread + cache 60s | 80-120 |
| Imagenes | 80GB disco compartido, 500MB quota/usuario | ~700 usuarios |
| PostgreSQL | 200 max_connections, PgBouncer 500 client | ~1600 usuarios |
| Redis | 1GB noeviction | Miles de jobs |
| market_listings | ~2KB/listing | Sin limite practico |
