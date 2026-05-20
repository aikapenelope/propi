# Roadmap Tecnico: De MVP a Produccion Robusta

> Documento generado a partir de una auditoria completa del codebase (Mayo 2026).
> Priorizado por riesgo de fallo en produccion, no por complejidad.

---

## Estado Actual: 75% Production-Ready

| Area | Score | Notas |
|------|-------|-------|
| Seguridad | 8/10 | Auth, validation, CSP, webhook verification |
| Resiliencia | 7/10 | Rate limiting, fail-open Redis, PgBouncer |
| Performance | 8/10 | Pagination, cache, GPU-optimized CSS, splash screen |
| Observabilidad | 9/10 | Logging, metricas, Sentry, alertas Telegram |
| Testing | 5/10 | 108 unit tests, CI en GitHub. Sin integration ni E2E |
| Data integrity | 8/10 | Transactions, CASCADE, UUID PKs, Zod validation |
| Operaciones | 7/10 | Coolify, health checks, cron jobs, worker separado |

---

## P0 — Critico (hacer antes de tener 50+ usuarios)

### 1. Timeout en llamadas externas

**Problema:** `exchangeMeliCode()` y `refreshMeliToken()` en `src/lib/mercadolibre.ts` hacen `fetch()` sin `AbortController`. Si la API de MercadoLibre se cuelga, el request del usuario se queda colgado indefinidamente.

**Solucion:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);
const res = await fetch(url, { signal: controller.signal, ...options });
clearTimeout(timeout);
```

**Archivos:** `src/lib/mercadolibre.ts` (lineas 97, 125)
**Esfuerzo:** 30 min

---

### 2. Backup automatizado de MinIO

**Problema:** Si el disco del Data Plane muere, se pierden todas las fotos de propiedades y documentos. PostgreSQL tiene backups via Hetzner, pero MinIO no.

**Solucion:** Cron job diario que sincroniza MinIO a un bucket de backup (Hetzner Object Storage o un segundo volumen):
```bash
# En el Data Plane, cron diario 2am:
mc mirror --overwrite /data/minio /backup/minio-$(date +%Y%m%d)
```

**Esfuerzo:** 1-2 horas (instalar mc CLI + cron + volumen de backup)

---

### 3. Migrar console.error a logger estructurado

**Problema:** 22 ubicaciones usan `console.error` en vez del logger de pino. Estos logs no son parseables en Loki y dificultan debugging en produccion.

**Archivos afectados:**
- `src/app/api/webhooks/meta/route.ts` (5 ocurrencias)
- `src/app/api/webhooks/clerk/route.ts` (2)
- `src/app/api/upload/route.ts` (1)
- `src/app/api/cron/generate-notifications/route.ts` (1)
- `src/app/api/cron/cleanup-messages/route.ts` (1)
- `src/app/api/properties/[id]/pdf/route.ts` (1)
- `src/app/api/reports/pdf/route.ts` (1)
- `src/app/api/auth/mercadolibre/callback/route.ts` (1)
- `src/server/actions/documents.ts` (1)
- `src/server/actions/properties.ts` (1)

**Solucion:** Reemplazar con `log.http.error()` o `log.external.error()` segun el contexto.
**Esfuerzo:** 1 hora

---

### 4. Error boundaries en server actions

**Problema:** La mayoria de server actions no tienen try/catch. Si PostgreSQL devuelve un error (constraint violation, timeout, connection refused), se propaga como un 500 generico sin contexto.

**Solucion:** Wrapper generico para server actions:
```typescript
export function withErrorHandling<T>(action: () => Promise<T>): Promise<T> {
  try { return action(); }
  catch (err) {
    log.db.error({ error: err.message }, "server action failed");
    Sentry.captureException(err);
    throw new Error("Ocurrio un error. Intenta de nuevo.");
  }
}
```

**Esfuerzo:** 2-3 horas (crear wrapper + aplicar a los 29 server actions)

---

## P1 — Importante (hacer antes de 200+ usuarios)

### 5. CDN o proxy de cache para imagenes

**Problema:** Cada imagen pasa por Node.js (`/api/images/[...key]`). Con 20 imagenes en pantalla = 20 requests simultaneos al servidor. El `Cache-Control: max-age=86400` ayuda en visitas repetidas pero la primera carga es lenta.

**Opciones:**
- **A) Traefik cache layer** — agregar middleware de cache en Traefik para `/api/images/*`
- **B) Cloudflare proxy** — poner Cloudflare delante del dominio (gratis, cache automatico)
- **C) MinIO directo** — exponer MinIO via Traefik con auth por signed URL

**Recomendacion:** Opcion B (Cloudflare) — cero codigo, cache global, gratis.
**Esfuerzo:** 1 hora (cambiar DNS a Cloudflare, configurar cache rules)

---

### 6. Cambiar price/areaM2 de varchar a numeric en market_listings

**Problema:** `market_listings.price` y `areaM2` son `varchar`. Las queries de valuacion hacen `CAST(price AS NUMERIC)` que impide uso de indices. Con 500k+ rows sera un full table scan.

**Solucion:** Migracion de Drizzle:
```sql
ALTER TABLE market_listings
  ALTER COLUMN price TYPE numeric USING price::numeric,
  ALTER COLUMN area_m2 TYPE numeric USING area_m2::numeric;
```

**Riesgo:** Rows con valores no-numericos fallaran el CAST. Limpiar primero.
**Esfuerzo:** 2 horas (migracion + limpiar datos + actualizar queries)

---

### 7. Tests de integracion para server actions

**Problema:** Los server actions (CRUD de contactos, propiedades, citas) no tienen tests. Un refactor puede romper la logica de negocio sin que nadie se entere.

**Solucion:** PostgreSQL de test en CI con Docker:
```yaml
# .github/workflows/ci.yml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: propi_test
      POSTGRES_PASSWORD: test
    ports: ["5432:5432"]
```

Tests con Vitest + DB real (no mocks):
```typescript
// src/__tests__/integration/contacts.test.ts
beforeAll(async () => { await migrate(testDb); });
afterEach(async () => { await testDb.delete(contacts); });

it("creates and retrieves a contact", async () => { ... });
```

**Esfuerzo:** 4-6 horas (setup CI + 10-15 tests de los actions criticos)

---

### 8. Graceful shutdown en Next.js standalone

**Problema:** Cuando Coolify redeploya, el container viejo se mata con SIGTERM. Next.js standalone no tiene handler de graceful shutdown — requests en vuelo se cortan.

**Solucion:** Agregar al `entrypoint.sh`:
```bash
# Trap SIGTERM and wait for in-flight requests
trap 'kill -TERM $PID; wait $PID' TERM
node server.js &
PID=$!
wait $PID
```

O usar `--experimental-graceful-shutdown` si Next.js 16 lo soporta.
**Esfuerzo:** 30 min

---

## P2 — Mejoras (hacer cuando haya tiempo)

### 9. Health check sin crear conexion Redis nueva

**Problema:** `src/app/api/health/route.ts` crea una nueva conexion Redis en cada invocacion (cada 10s). Son 6 conexiones/minuto que se abren y cierran.

**Solucion:** Reusar la conexion singleton de `src/lib/rate-limit.ts` o crear un singleton de health-check Redis.
**Esfuerzo:** 30 min

---

### 10. Archivado de market_listings viejos

**Problema:** La tabla crece indefinidamente (~1000-5000 rows/dia). Con 1 ano = 500k-1M rows.

**Solucion:** Cron job que mueve listings con `last_seen_at > 90 dias` a una tabla `market_listings_archive`. O simplemente `DELETE WHERE last_seen_at < NOW() - INTERVAL '6 months'`.
**Esfuerzo:** 1 hora

---

### 11. Rate limiting en webhooks

**Problema:** Los endpoints de webhook (`/api/webhooks/meta`, `/api/webhooks/clerk`) no tienen rate limiting. Un atacante podria enviar miles de requests con firmas invalidas, consumiendo CPU en la verificacion HMAC.

**Solucion:** Agregar rate limiter por IP (100 req/min) antes de la verificacion de firma.
**Esfuerzo:** 30 min

---

### 12. Soft delete para contactos y propiedades

**Problema:** `deleteContact()` y `deleteProperty()` hacen `DELETE` real. Si un usuario borra por error, no hay forma de recuperar.

**Solucion:** Agregar columna `deleted_at` y filtrar en queries. Cron job que purga despues de 30 dias.
**Esfuerzo:** 3-4 horas (migracion + actualizar todas las queries + UI de "papelera")

---

### 13. Row-Level Security (RLS) en PostgreSQL

**Problema:** La seguridad multi-tenant depende 100% de que cada query tenga `WHERE userId = ?`. Si un developer olvida el filtro, se exponen datos de otros usuarios.

**Solucion:** Habilitar RLS en PostgreSQL como segunda barrera:
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_user_policy ON contacts
  USING (user_id = current_setting('app.user_id'));
```

Requiere setear `app.user_id` en cada conexion via PgBouncer.
**Esfuerzo:** 4-6 horas (RLS policies + PgBouncer config + testing)

---

### 14. E2E tests con Playwright

**Problema:** No hay tests que verifiquen el flujo completo (login → crear propiedad → ver en lista → editar → borrar).

**Solucion:** Playwright con Clerk test mode:
```typescript
test("agent can create and view a property", async ({ page }) => {
  await clerk.signIn(page, testUser);
  await page.goto("/properties/new");
  await page.fill('[name="title"]', "Test Property");
  await page.click('button:has-text("Guardar")');
  await expect(page.locator("text=Test Property")).toBeVisible();
});
```

**Esfuerzo:** 8-12 horas (setup + 10-15 flujos criticos)

---

## P3 — Escalabilidad (cuando llegues a 500+ usuarios)

### 15. Read replica de PostgreSQL

Separar queries de lectura (dashboard, listas, reportes) a una replica. Reduce carga en el primary.

### 16. App Plane dedicado para Propi

Activar `appPlaneBEnabled` en Pulumi y mover los otros proyectos ahi. Propi se queda con los 8GB completos.

### 17. Connection pooling tuning

Subir PgBouncer de 200 a 500 max client connections. Ajustar `pool_size` por base de datos.

### 18. Horizontal scaling con multiple instancias

Correr 2-3 instancias de Propi detras de un load balancer. Requiere que el cache de `unstable_cache` sea compartido (Redis adapter) o que se use ISR con revalidation.

---

## Orden de Ejecucion Recomendado

| Fase | Items | Cuando |
|------|-------|--------|
| **Inmediato** | #1 (timeout), #3 (logger), #8 (graceful shutdown) | Esta semana |
| **Antes de lanzar** | #2 (backup MinIO), #4 (error boundaries) | Antes de 50 usuarios |
| **Primer mes** | #5 (CDN), #6 (numeric columns), #9 (health Redis) | Primeras semanas con usuarios |
| **Segundo mes** | #7 (integration tests), #10 (archivado), #11 (webhook rate limit) | Cuando haya estabilidad |
| **Trimestre 2** | #12 (soft delete), #13 (RLS), #14 (E2E) | Cuando haya equipo o mas tiempo |
| **Cuando escale** | #15, #16, #17, #18 | 500+ usuarios |
