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
| 20 | Pipeline, email BullMQ, schema improvements | Completado |
| 21 | Mini portal web del agente | Completado |
| 22 | Notificaciones in-app (campana, badge, cron) | Completado |
| 23 | Envio de ficha de propiedad por email | Completado |
| 24 | Simulador de comisiones | Completado |
| 25 | Calendario mobile UX (agenda, swipe, touch) | Completado |
| 26 | Resend API key por usuario | Completado |
| 27 | Historial de actividad automatico por contacto | Completado |
| 28 | Matching propiedad-contacto por preferencias | Completado |
| 29 | Preferencias de busqueda en formulario de contacto | Completado |
| 30 | Tooltips de ayuda contextual (30 tooltips, 4 sprints) | Completado |
| 31 | PWA UX (view transitions, pull-to-refresh, haptics, swipe, skeletons) | Completado |
| 32 | CSP fixes (Clerk CAPTCHA, Iconify) | Completado |
| 33 | Landing actualizada ($30, features reales) | Completado |
| 34 | Logos de Propi (PWA + sidebar) + dashboard moderno | Completado |

---

## Pendiente: Configurar cron jobs en Coolify

El codigo tiene 4 cron endpoints listos pero **no estan activados** en Coolify.
Requieren la env var `CRON_SECRET` y cron jobs en Coolify.

| Cron | Endpoint | Frecuencia | Que hace |
|------|----------|------------|----------|
| Notificaciones | `/api/cron/generate-notifications` | Cada hora | Citas proximas, tareas vencidas, cumpleanos |
| Drip campaigns | `/api/cron/process-drips` | Cada hora | Emails automaticos de secuencias drip |
| Sync MercadoLibre | `/api/cron/sync-market` | Diario (4am) | Encola jobs en BullMQ para sincronizar listings de ML |
| Cleanup mensajes | `/api/cron/cleanup-messages` | Semanal (dom 3am) | Elimina mensajes >90 dias (solo si se activa Meta inbox) |

### Para activar:

1. Agregar env var `CRON_SECRET` a Propi en Coolify
2. Deployar `Dockerfile.worker` como segundo servicio (para sync-market y email campaigns)
3. Configurar cron jobs en Coolify:
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/generate-notifications
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/process-drips
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/cleanup-messages
   ```

## Pendiente: Credenciales en ESC y Coolify

El ESC environment `platform-infra/propi` tiene las credenciales del data plane (DB, Redis, MinIO)
y Groq. **Faltan las siguientes credenciales por agregar:**

| Variable | Donde | Descripcion |
|----------|-------|-------------|
| `CLERK_SECRET_KEY` | ESC + Coolify | Clerk auth backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ESC + Coolify | Clerk auth frontend |
| `CRON_SECRET` | Coolify | Proteccion de cron endpoints |

Nota: `RESEND_API_KEY` ya no es obligatorio a nivel global. Cada usuario configura su propia
key en Configuracion > Email (Resend). La env var global sirve como fallback.

---

## Backlog: Features pendientes

### P1 — Proximo sprint

| Feature | Descripcion | Esfuerzo |
|---------|-------------|----------|
| Reportes PDF exportables | KPIs del mes, propiedades vendidas, comisiones. Generar PDF descargable. | 4h |
| Multi-moneda con tasa BCV | Mostrar precios en USD y VES con tasa del dia automatica. | 3h |
| Recordatorio de seguimiento | Si un lead lleva X dias sin actividad, crear tarea automatica. | 2h |
| Toast notifications | Feedback visual despues de cada accion (guardar, enviar, eliminar). | 2h |

### P2 — Siguiente ciclo

| Feature | Descripcion | Esfuerzo |
|---------|-------------|----------|
| Comparables para tasacion | Reporte de 3-5 propiedades similares para justificar precio. | 3h |
| Install prompt personalizado | Banner dentro de la app invitando a instalar la PWA. | 1h |
| Shortcuts en manifest.json | Long-press en icono muestra "Nueva propiedad", "Contactos", "Calendario". | 30min |
| App Badging API | Mostrar numero de notificaciones no leidas en el icono de la app instalada. | 1h |
| Usuarios PostgreSQL por proyecto | Aislamiento de DB entre proyectos (R5 en INFRASTRUCTURE_RISKS.md). | 2h |
| Service accounts MinIO por proyecto | Aislamiento de storage entre proyectos (R4). | 2h |

### P3 — Cuando haya demanda

| Feature | Descripcion | Esfuerzo |
|---------|-------------|----------|
| Bottom sheets para mobile | Paneles que suben desde abajo para acciones (compartir, filtrar, opciones). | 3h |
| Firma electronica en documentos | Firmar contratos desde la app sin imprimir. | 8h |
| Multi-idioma | Soporte para ingles (agentes con clientes extranjeros). | 6h |
| Modo offline real | Crear/editar contactos y propiedades sin conexion, sync al reconectar. | 12h |
| CSP unsafe-eval | Evaluar si se puede remover (puede ser requerido por Clerk). | 1h |

---

## Capacidad actual

| Componente | Spec | Limite |
|-----------|------|--------|
| Usuarios simultaneos | Next.js single thread + cache 60s | 80-120 |
| Imagenes | 80GB disco compartido, 500MB quota/usuario | ~160 usuarios |
| PostgreSQL | 200 max_connections, PgBouncer 500 client | ~1600 usuarios |
| Redis | 1GB noeviction | Miles de jobs |
| Email | Resend per-user (3,000/mes/usuario free tier) | Sin limite compartido |
| market_listings | ~2KB/listing | Sin limite practico |

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| `docs/ROADMAP.md` | Este archivo — sprints 7-34 + backlog |
| `docs/TOOLTIPS_MAP.md` | Mapa de 55 tooltips con texto exacto |
| `docs/SCALING_PLAN.md` | Fases A/B/C para escalar a 1000 usuarios |
| `docs/INFRASTRUCTURE_RISKS.md` | Riesgos R1-R12 del data plane |
| `docs/ARCHITECTURE.md` | Stack tecnico y distribucion web/PWA |
