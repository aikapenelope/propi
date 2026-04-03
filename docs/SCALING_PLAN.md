# Scaling Propi: 200-1000 usuarios

## Estado actual

| Componente | Spec | Limite |
|-----------|------|--------|
| App Plane A | CX33: 4 vCPU, 8GB RAM, 80GB disco | ~50 usuarios concurrentes (Next.js single process) |
| Data Plane | CX33: 4 vCPU, 8GB RAM, 80GB disco | PostgreSQL: 200 max_connections, PgBouncer: 500 client conn |
| Control Plane | CX23: 2 vCPU, 4GB RAM | Traefik + Coolify (no es bottleneck) |
| Redis | DB 3, sin maxmemory config | No se usa actualmente |
| MinIO | Sin quotas, disco compartido con PG | ~60GB disponibles |

## Cuellos de botella para 200-1000 usuarios

### 1. Next.js single process (CRITICO)

Next.js standalone corre en UN proceso Node.js. Node.js es single-threaded. Con 200+ usuarios concurrentes, el event loop se bloquea en:
- Cron de ML (60,000 requests por sync con 10 usuarios)
- Groq streaming (cada chat ocupa el event loop mientras espera)
- Image proxy (streams de MinIO)
- Server actions con queries pesadas (dashboard stats con 10 queries)

**Limite real: ~50-100 usuarios concurrentes antes de degradacion.**

### 2. Disco de 80GB compartido (CRITICO)

PostgreSQL + PgBouncer + Redis + MinIO comparten 80GB en el Data Plane. Con 1000 usuarios subiendo fotos (promedio 20 fotos por propiedad, 2MB cada una, 10 propiedades por usuario):
- 1000 * 10 * 20 * 2MB = 400GB solo en fotos
- PostgreSQL necesita ~5-10GB para datos + indices
- El disco se llena en semanas

### 3. RAM del Data Plane (ALTO)

PostgreSQL tiene `shared_buffers=2GB` de 8GB total. Con 1000 usuarios y queries concurrentes, el working set no cabe en memoria. Queries empiezan a ir a disco.

### 4. Cron bloquea todo (ALTO)

El cron de ML corre dentro del container de Next.js. Con 100 usuarios con ML conectado, son 600,000 requests que toman horas. Durante ese tiempo, el servidor esta degradado para todos.

---

## Plan de escalamiento (3 fases)

### Fase A: Preparar para 200 usuarios (cambios en codigo, mismos servidores)

**Costo: $0 extra. Solo cambios en codigo.**

#### A1. Worker de cron separado con BullMQ + Redis

Mover el cron fuera del proceso de Next.js. Usar BullMQ (cola de trabajos) con Redis (que ya tenemos en DB 3).

```
Antes:  Next.js container -> cron route -> 60,000 requests (bloquea todo)
Ahora:  Next.js container -> agrega job a Redis
        Worker container  -> procesa jobs de Redis (no bloquea Next.js)
```

Archivos nuevos:
- `src/lib/queue.ts` - conexion a BullMQ
- `src/workers/sync-market.ts` - worker que procesa el sync
- `Dockerfile.worker` - container separado para el worker

El cron route cambia de ejecutar el sync a encolar un job:
```typescript
// Antes: ejecuta sync directamente (bloquea 40 min)
await syncForUser(token);

// Ahora: encola job (retorna en 1ms)
await marketSyncQueue.add("sync", { userId: account.userId });
```

#### A2. Storage quota por usuario

Prevenir que un usuario llene el disco:

```typescript
// En getUploadUrl y getDocumentUploadUrl:
const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB por usuario

async function checkStorageQuota(userId: string): Promise<void> {
  const usage = await db
    .select({ total: sql<number>`COALESCE(SUM(size_bytes), 0)::bigint` })
    .from(documents)
    .where(eq(documents.userId, userId));
  
  // Tambien contar imagenes (estimado 2MB por imagen)
  const imageCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(propertyImages)
    .innerJoin(properties, eq(propertyImages.propertyId, properties.id))
    .where(eq(properties.userId, userId));
  
  const estimated = (usage[0]?.total || 0) + (imageCount[0]?.count || 0) * 2 * 1024 * 1024;
  if (estimated > MAX_STORAGE_BYTES) {
    throw new Error("Limite de almacenamiento alcanzado (500MB). Elimina archivos para continuar.");
  }
}
```

#### A3. Rate limit por usuario en API routes

```typescript
// Rate limit map por userId (en memoria, se resetea con deploy)
const userRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkUserRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

Aplicar en:
- `/api/chat/market`: 20 requests/hora por usuario (Groq free tier)
- `/api/images/[key]`: 100 requests/minuto por IP (ya implementado)

#### A4. Health check endpoint

```typescript
// /api/health/route.ts
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
```

Configurar en Coolify como health check para auto-restart.

---

### Fase B: Escalar para 500 usuarios (upgrade servidores)

**Costo: ~$30/mes extra.**

#### B1. Upgrade Data Plane: CX33 -> CX52

| | CX33 (actual) | CX52 (nuevo) | Mejora |
|--|--------------|-------------|--------|
| vCPU | 4 | 16 | 4x |
| RAM | 8GB | 32GB | 4x |
| Disco | 80GB | 320GB | 4x |
| Precio | ~$8/mes | ~$27/mes | +$19/mes |

PostgreSQL config actualizado:
```
shared_buffers=8GB        (era 2GB)
effective_cache_size=24GB  (era 4GB)
work_mem=128MB            (era 64MB)
max_connections=500       (era 200)
```

PgBouncer:
```
MAX_CLIENT_CONN=2000      (era 500)
DEFAULT_POOL_SIZE=100     (era 40)
```

#### B2. Hetzner Volume para MinIO (storage separado)

Crear un Hetzner Volume de 500GB (~$25/mes) montado en el Data Plane:
```
/mnt/storage/minio -> MinIO data
```

Esto separa el storage de MinIO del disco del sistema. Si MinIO se llena, PostgreSQL no se afecta.

#### B3. Upgrade App Plane: CX33 -> CX42

| | CX33 (actual) | CX42 (nuevo) | Mejora |
|--|--------------|-------------|--------|
| vCPU | 4 | 8 | 2x |
| RAM | 8GB | 16GB | 2x |
| Disco | 80GB | 160GB | 2x |
| Precio | ~$7/mes | ~$12/mes | +$5/mes |

Con 8 vCPU, se puede correr Next.js con PM2 cluster mode (4 workers) + 1 worker de BullMQ.

---

### Fase C: Escalar para 1000 usuarios (arquitectura distribuida)

**Costo: ~$80/mes extra.**

#### C1. Activar App Plane B (ya provisionado en infra)

El App Plane B (10.0.1.40) ya esta definido en el codigo de infra pero desactivado (`appPlaneBEnabled` config). Activarlo y correr una segunda replica de Propi.

Traefik balancea entre App Plane A y B automaticamente.

#### C2. Worker dedicado en App Plane B

```
App Plane A: Next.js (4 PM2 workers) -> sirve requests de usuarios
App Plane B: Next.js (4 PM2 workers) -> sirve requests de usuarios
             + BullMQ worker -> procesa cron, webhooks, emails
```

#### C3. Redis como cache layer

Usar Redis DB 3 (ya asignado a Propi) para:
- Cache de dashboard stats (TTL 5 min)
- Cache de market KPIs (TTL 1 hora)
- Session de rate limiting (compartido entre replicas)

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
```

#### C4. Webhook queue (no perder mensajes)

```
Meta webhook -> /api/webhooks/meta -> encola en Redis (BullMQ)
                                      -> retorna 200 inmediatamente
Worker -> procesa mensajes de la cola -> findOrCreateConversation + storeInboundMessage
```

Beneficio: si el worker esta caido, los mensajes se quedan en Redis. Cuando el worker vuelve, los procesa.

---

## Resumen de costos

| Fase | Usuarios | Costo mensual | Cambios |
|------|----------|--------------|---------|
| Actual | 1-50 | ~$22/mes | Nada |
| A | 50-200 | ~$22/mes | Solo codigo (worker, quotas, rate limits) |
| B | 200-500 | ~$55/mes | Upgrade Data Plane + Volume + App Plane |
| C | 500-1000 | ~$100/mes | App Plane B + workers + Redis cache |

## Orden de implementacion

| Prioridad | Item | Fase | Esfuerzo |
|-----------|------|------|----------|
| 1 | BullMQ worker para cron | A | 4h |
| 2 | Storage quota por usuario | A | 2h |
| 3 | Rate limit por usuario en chat | A | 1h |
| 4 | Health check endpoint | A | 30min |
| 5 | Upgrade Data Plane a CX52 | B | 1h (Pulumi) |
| 6 | Hetzner Volume para MinIO | B | 2h (Pulumi) |
| 7 | Upgrade App Plane a CX42 | B | 1h (Pulumi) |
| 8 | PM2 cluster mode | B | 2h |
| 9 | Activar App Plane B | C | 1h (Pulumi config) |
| 10 | Redis cache layer | C | 3h |
| 11 | Webhook queue | C | 3h |

**Fase A es la mas urgente y no cuesta nada extra.** Se puede hacer ahora.
