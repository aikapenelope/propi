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

### P0 — CRM Core (diferenciadores vs competencia EEUU)

Estos features son estandar en CRMs inmobiliarios de EEUU (KvCORE, Follow Up Boss, LionDesk)
y representan la base para escalar Propi como producto competitivo.

| # | Feature | Descripcion | Esfuerzo | Impacto DB |
|---|---------|-------------|----------|------------|
| 1 | Rol comprador/vendedor en contactos | Enum `contact_role` (buyer, seller, both, other). Distinguir tipo de relacion con el agente. El matching solo aplica a buyers. | 1-2d | 1 enum + 1 col |
| 2 | Propietario enlazado a propiedad | Columna `ownerId` (FK contacts) en properties. Selector en form. Permite saber quien es el dueno de cada inmueble. | 2-3d | 1 col + 1 idx |
| 3 | Reportes completos + compartir metricas | Ver seccion detallada abajo. | 5-6d | 2 tablas + 3 cols |
| 4 | Portafolio publico con slider de imagenes | Pagina `/agente/[id]` mostrando todas las propiedades activas con cards fijas e imagenes que rotan (carousel autoplay). Embla Carousel o Swiper. | 3-4d | Ninguno |
| 5 | Calendario: notificaciones + recurrencia | Recurrencia basica (semanal/mensual) en citas. Notificaciones push/email antes de cita (ya existe cron + tabla notifications). Tabla `recurrence_rules` o campo JSONB. | 5-7d | 2-3 cols |
| 6 | Google Calendar sync (unidireccional) | OAuth flow por usuario, sync Propi->GCal. Tokens encriptados, refresh automatico. Soporte para calendar compartido de agencia. Basado en implementacion de Docflow. | 5-7d | 1 tabla (calendar_integrations) |

**Orden recomendado:** 1 -> 2 -> 3 -> 4 -> 5 -> 6

**Notas de implementacion:**
- Features 1-2 son prerequisitos para reportes correctos (saber si una transaccion es venta o compra del cliente)
- Feature 3 incluye reportes individuales + mecanismo de compartir metricas con broker (sin teams)
- Feature 4 ya tiene la ruta `/agente/[id]` creada, solo falta el contenido
- Feature 5 es incremental sobre el calendario actual (FullCalendar ya soporta recurring events con plugin)
- Feature 6 es unidireccional (Propi->GCal). Cada agente conecta su cuenta. Soporta calendar compartido de agencia via `calendarId` configurable.

---

### Detalle Feature #3: Reportes Completos + Compartir Metricas

**Problema:** Equipos de agentes necesitan visibilidad cruzada sin un sistema de teams/permisos complejo.

**Solucion:** Reportes detallados por agente + mecanismo consent-based para compartir metricas con un broker.

#### Fase A: Reportes individuales (3 dias)

Pagina `/reports` con:

| Seccion | Metricas |
|---------|----------|
| Resumen | Periodo seleccionado, propiedades activas/vendidas/alquiladas |
| Pipeline | Leads por etapa, conversion rate, tiempo promedio por etapa |
| Transacciones | Propiedades cerradas, precio total, comision real (con `soldPrice`) |
| Actividad | Citas realizadas/completadas, emails enviados, contactos nuevos, notas creadas |
| Comparativa | vs periodo anterior (%, delta absoluto) |

Filtros: mensual / trimestral / anual / rango custom.
Export: PDF (via html-to-pdf o @react-pdf/renderer) + CSV.

Requiere agregar a `properties`:
- `closedAt` (timestamp) — cuando se cerro la venta/alquiler
- `soldPrice` (numeric) — precio real de cierre (puede diferir del precio de lista)
- `commissionRate` (numeric, default 5) — porcentaje de comision pactado

#### Fase B: Compartir metricas con broker (2-3 dias)

Modelo consent-based: el agente autoriza a un broker a ver sus metricas.

**Tabla `metric_shares`:**
```
id, agentId, brokerEmail, status (pending/active/revoked), 
permissions (jsonb: {pipeline, transactions, activity, contacts_count}),
createdAt, revokedAt
```

**Tabla `scheduled_reports`:**
```
id, userId, recipientEmail, frequency (weekly/monthly), 
lastSentAt, nextRunAt, active
```

**Flujo del agente:**
1. Settings > "Compartir metricas"
2. Ingresa email del broker
3. Selecciona que comparte: pipeline, transacciones, actividad
4. Opcionalmente activa reporte automatico semanal/mensual

**Flujo del broker (si tiene cuenta Propi):**
- Ve pagina `/reports/team` con metricas agregadas de agentes que lo autorizaron
- Filtro por agente, periodo
- Ranking por ventas/actividad
- NO ve datos de contactos individuales (solo conteos)

**Flujo del broker (sin cuenta Propi):**
- Recibe email periodico con PDF del reporte de cada agente
- Cron job existente (`generate-notifications`) se extiende para enviar reportes

**Que ve el broker en el reporte consolidado:**

| Agente | Props Activas | Vendidas | Comision Total | Leads Nuevos | Conversion | Citas |
|--------|--------------|----------|---------------|-------------|-----------|-------|
| Juan   | 12           | 3        | $22,500       | 8           | 37%       | 15    |
| Maria  | 8            | 5        | $41,000       | 12          | 42%       | 22    |
| Pedro  | 15           | 2        | $18,000       | 5           | 40%       | 9     |
| **Total** | **35**    | **10**   | **$81,500**   | **25**      | **40%**   | **46** |

**Ventajas de este enfoque vs Teams:**
- Cero cambios en queries existentes (sigue filtrando por `userId`)
- El agente mantiene control total de sus datos
- El broker no necesita cuenta Propi (recibe por email)
- Si el broker tiene cuenta, ve un dashboard de lectura
- Revocable en cualquier momento
- No requiere Clerk Organizations ni roles complejos

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
