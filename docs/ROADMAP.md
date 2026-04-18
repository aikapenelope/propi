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
- Calendario: `react-big-calendar` con vistas mes/semana/dia/agenda, touch fix para PWA
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

## Capacidad actual

| Componente | Spec | Limite |
|-----------|------|--------|
| Usuarios simultaneos | Next.js single thread + cache 60s | 80-120 |
| Imagenes | 80GB disco compartido, 500MB quota/usuario | ~700 usuarios |
| PostgreSQL | 200 max_connections, PgBouncer 500 client | ~1600 usuarios |
| Redis | 1GB noeviction | Miles de jobs |
| market_listings | ~2KB/listing | Sin limite practico |
