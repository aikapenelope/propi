# Production Bugs — Plan de Remediación

**Fecha:** Mayo 2026  
**Sprint previo:** Fix timezone (db.ts), N+1 cron dedup, importContacts transaction (ya mergeados).  
**Este documento:** Plan detallado y explicación técnica de los bugs restantes, organizados por sprint.

---

## Contexto: Severidad y Priorización

| ID | Bug | Severidad | Esfuerzo | Sprint |
|----|-----|-----------|---------|--------|
| B-01 | Tag ownership no verificado en createContact/updateContact | 🔴 Crítico | Bajo | Sprint A |
| B-02 | Content-Length vacío en /api/images | 🔴 Crítico | Mínimo | Sprint A |
| B-03 | Cursor de paginación con colisión en updatedAt | 🟡 Alto | Bajo | Sprint A |
| B-04 | updateUserSettings — race condition TOCTOU | 🟡 Alto | Bajo | Sprint A |
| B-05 | createMetricShare — sin deduplicación de email | 🟡 Alto | Bajo | Sprint A |
| B-06 | Email validation débil en metric-shares | 🟡 Alto | Mínimo | Sprint A |
| B-07 | createTag — acepta nombres vacíos | 🟡 Alto | Mínimo | Sprint A |
| B-08 | Inputs text-sm en commissions, valuation, pipeline | 🟡 Alto | Bajo | Sprint B |
| B-09 | getContactOptions trunca a 500 sin avisar | 🟠 Medio | Bajo | Sprint B |
| B-10 | Storage quota con imagen estimada incorrecta | 🟠 Medio | Medio | Sprint B |
| B-11 | magicSearches acumulación indefinida sin cleanup | 🟠 Medio | Bajo | Sprint B |
| B-12 | Birthday index ausente — full scan cada hora | 🟠 Medio | Bajo | Sprint B |
| B-13 | ILIKE con % inicial — full scan en búsqueda global | 🟠 Medio | Medio | Sprint C |
| B-14 | Matching engine O(P×C) en memoria sin límite | 🟠 Medio | Medio | Sprint C |
| B-15 | DB pool sin graceful shutdown | 🟠 Medio | Bajo | Sprint C |
| B-16 | Tokens de plataforma en plaintext | 🟠 Medio | Alto | Sprint D |
| B-17 | CSP sin report-uri — violaciones silenciosas | 🟢 Bajo | Mínimo | Sprint D |

---

## Sprint A — Seguridad y Correctitud de Datos

**Objetivo:** Cerrar los bugs que pueden corromper datos o comprometer el aislamiento entre usuarios.

---

### B-01 · Tag ownership no verificado

**Archivo:** `src/server/actions/contacts.ts` — `createContact()` y `updateContact()`

**Explicación técnica:**  
Cuando un contacto se crea o edita, los `tagIds` del formulario se insertan directamente en `contact_tags` sin verificar que esos tags pertenezcan al usuario actual:

```typescript
// BUGGY — tagId podría ser de otro usuario
await db.insert(contactTags).values(
  validated.tagIds.map((tagId) => ({ contactId: contact.id, tagId }))
);
```

Un usuario malicioso puede inspeccionar los IDs de tag en el DOM (están en atributos de datos) o usar las DevTools para enviar tagIds de otro tenant. El resultado: un tag del tenant B aparece vinculado a contactos del tenant A. Si el tag se llama "Cliente VIP Confidencial" o contiene información sensible del nombre, eso es una fuga de datos entre tenants.

**Fix:**  
Antes de insertar, filtrar los IDs contra la tabla `tags` con un `WHERE user_id = currentUserId`:

```typescript
// Verificar que los tags pertenecen al usuario actual
if (validated.tagIds && validated.tagIds.length > 0) {
  const ownedTags = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(
      and(
        inArray(tags.id, validated.tagIds),
        eq(tags.userId, userId),
      ),
    );

  const ownedTagIds = ownedTags.map((t) => t.id);

  if (ownedTagIds.length > 0) {
    await tx.insert(contactTags).values(
      ownedTagIds.map((tagId) => ({ contactId: contact.id, tagId })),
    );
  }
}
```

Este fix debe aplicarse en `createContact` y en el bloque de tags de `updateContact`. La misma vulnerabilidad puede existir en `propertyTags` — revisar `properties.ts` y aplicar el mismo patrón.

**Impacto del fix:** Ningún contacto existente se ve afectado. Solo los tags realmente owned por el usuario se vinculan.

---

### B-02 · Content-Length: "" en /api/images

**Archivo:** `src/app/api/images/[...key]/route.ts`

**Explicación técnica:**  
Cuando MinIO no retorna `ContentLength` en la respuesta, el header se envía como string vacío:

```typescript
"Content-Length": response.ContentLength
  ? String(response.ContentLength)
  : "",  // ← HEADER INVÁLIDO
```

El header `Content-Length` con valor vacío viola RFC 7230. Algunos proxies (Nginx, Cloudflare, AWS ALB) rechazan estas respuestas o las consideran malformadas. En la práctica, el usuario ve la imagen rota o recibe un error 502.

Este mismo bug ya fue corregido en el `download/route.ts` — es el mismo patrón.

**Fix:**  
```typescript
const headers: Record<string, string> = {
  "Content-Type": response.ContentType || "image/jpeg",
  "Cache-Control": "public, max-age=86400, immutable",
};
if (response.ContentLength != null) {
  headers["Content-Length"] = String(response.ContentLength);
}
return new Response(stream, { status: 200, headers });
```

---

### B-03 · Cursor de paginación con colisión en updatedAt

**Archivo:** `src/server/actions/contacts.ts` — `fetchContacts()` y similar en `properties.ts`

**Explicación técnica:**  
La paginación cursor-based usa `updatedAt` como cursor:

```typescript
if (cursor) {
  conditions.push(lt(contacts.updatedAt, new Date(cursor)));
}
// ...
orderBy: [desc(contacts.updatedAt)],
```

El problema: si dos contactos tienen exactamente el mismo `updatedAt` (sucede cuando se importan en batch — todos se crean con `defaultNow()` en el mismo milisegundo), el cursor `lt(updatedAt, cursor)` excluye AMBOS al paginar. El usuario hace scroll-infinito y algunos contactos del lote importado nunca aparecen — desaparecen en la paginación sin avisar.

**Fix:**  
Cursor compuesto `(updatedAt, id)`:

```typescript
// Definición del cursor
const cursor = `${lastItem.updatedAt.toISOString()}|${lastItem.id}`;

// Condición de paginación
if (cursor) {
  const [cursorTs, cursorId] = cursor.split("|");
  conditions.push(
    or(
      lt(contacts.updatedAt, new Date(cursorTs)),
      and(
        eq(contacts.updatedAt, new Date(cursorTs)),
        lt(contacts.id, cursorId),
      ),
    ),
  );
}
```

El mismo patrón debe aplicarse en `properties.ts`.

---

### B-04 · updateUserSettings — race condition TOCTOU

**Archivo:** `src/server/actions/user-settings.ts`

**Explicación técnica:**  
El patrón check-then-act (TOCTOU = Time-Of-Check-Time-Of-Use) en la función de settings:

```typescript
const existing = await db.query.userSettings.findFirst(...)
if (existing) {
  await db.update(...)
} else {
  await db.insert(...)  // ← falla si otra request llegó primero
}
```

Si el usuario hace doble-clic en "Guardar" o dos requests llegan simultáneamente, ambas ven `existing = null` y ambas intentan INSERT. La segunda falla con `duplicate key value violates unique constraint "user_settings_user_id_key"` → error 500 no manejado → el usuario ve un error sin explicación.

**Fix:**  
PostgreSQL UPSERT — una operación atómica que no tiene race condition:

```typescript
await db
  .insert(userSettings)
  .values({
    userId,
    companyName: data.companyName || null,
    companyLogoKey: data.companyLogoKey || null,
  })
  .onConflictDoUpdate({
    target: userSettings.userId,
    set: {
      companyName: data.companyName ?? sql`excluded.company_name`,
      companyLogoKey: data.companyLogoKey ?? sql`excluded.company_logo_key`,
    },
  });
```

---

### B-05 · createMetricShare — duplicados al mismo broker

**Archivo:** `src/server/actions/metric-shares.ts`

**Explicación técnica:**  
No hay verificación de si ya existe un share activo para el mismo email. Clicar "Agregar" dos veces crea dos registros. El broker recibe el email de invitación dos veces. Y hay dos registros "active" para el mismo par `(agentId, brokerEmail)`.

**Fix:**  
Verificar antes de insertar, o usar UPSERT:

```typescript
// Opción 1: check explícito
const existing = await db.query.metricShares.findFirst({
  where: and(
    eq(metricShares.agentId, userId),
    eq(metricShares.brokerEmail, email),
    eq(metricShares.status, "active"),
  ),
});
if (existing) {
  throw new Error(`Ya compartiste tus metricas con ${email}.`);
}
```

Adicionalmente, agregar una unique constraint en la migración:
```sql
CREATE UNIQUE INDEX metric_shares_agent_broker_active_idx
  ON metric_shares (agent_id, broker_email)
  WHERE status = 'active';
```

---

### B-06 · Email validation débil en metric-shares

**Archivo:** `src/server/actions/metric-shares.ts`

**Explicación técnica:**  
```typescript
if (!email || !email.includes("@")) {
  throw new Error("Email invalido");
}
```
Acepta `"a@"`, `"@b"`, `"x@y"` como válidos. Todo el resto del codebase usa `z.string().email()`.

**Fix:**  
```typescript
import { z } from "zod";
const emailSchema = z.string().email("Email invalido");
const validatedEmail = emailSchema.parse(email);
```

---

### B-07 · createTag acepta nombres vacíos

**Archivo:** `src/server/actions/contacts.ts` — `createTag()`

**Explicación técnica:**  
```typescript
export async function createTag(name: string, color?: string) {
  await db.insert(tags).values({ name, color: ..., userId })
  // ← no hay validación de name.trim().length > 0
}
```
Un tag con nombre vacío o de un solo espacio se inserta en la DB. Aparece como un punto de color sin texto en la UI.

**Fix:**  
```typescript
const trimmed = name.trim();
if (trimmed.length === 0) {
  throw new Error("El nombre del tag no puede estar vacio.");
}
if (trimmed.length > 100) {
  throw new Error("El nombre del tag no puede superar 100 caracteres.");
}
await db.insert(tags).values({ name: trimmed, color: ..., userId });
```

---

## Sprint B — UX y Calidad de Datos

---

### B-08 · Inputs text-sm en commissions, valuation, pipeline

**Archivos:** `commissions/page.tsx`, `valuation-form.tsx`, `kanban-board.tsx`

**Explicación técnica:**  
Sprint 3 corrigió los formularios principales (contactos, propiedades) pero quedaron formularios secundarios con `text-sm` (14px). iOS Safari hace auto-zoom en cualquier `<input>` con font-size < 16px al recibir foco — jarring en una PWA.

**Fix:**  
Reemplazar `text-sm` por `input-base` (la clase CSS del Sprint 3) en:
- `commissions/page.tsx`: variable `inputClass`
- `valuation-form.tsx`: todos los inputs del formulario de tasación
- `kanban-board.tsx`: el input de búsqueda del Kanban

---

### B-09 · getContactOptions trunca a 500 sin avisar

**Archivo:** `src/server/actions/contacts.ts` — `getContactOptions()`

**Explicación técnica:**  
```typescript
limit: 500,
```
Los dropdowns de "Vincular a contacto" (en documentos, citas, tareas) solo muestran los primeros 500 contactos. Un agente con 600 contactos no verá los últimos 100 en ningún selector. No hay indicación visual de que los resultados están truncados.

**Fix a corto plazo:**  
Aumentar el límite a 2000 (razonable para un agente individual) y documentarlo.

**Fix correcto:**  
Convertir los selectores a búsqueda con debounce — el `ContactPicker` ya existe y acepta un array. En lugar de precargar todos los contactos, hacer una búsqueda en tiempo real al escribir (server action con `ilike`).

---

### B-10 · Storage quota con imagen estimada incorrecta

**Archivo:** `src/lib/storage-quota.ts`

**Explicación técnica:**  
```typescript
const ESTIMATED_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
```
El upload route convierte imágenes a WebP al 80% de calidad. Una foto de iPhone de 3MB puede quedar en 150KB después del proceso. Con 100 imágenes, la cuota real sería ~15MB pero el sistema contabiliza 200MB → el usuario es bloqueado cuando tiene solo el 7.5% de su cuota real usada.

**Fix:**  
Agregar columna `sizeBytes integer` a `property_images` en el schema y en la migración. En el upload route, después de procesar la imagen, registrar el `buffer.length` como `sizeBytes`. La función `checkStorageQuota` suma entonces los tamaños reales.

```sql
-- Nueva migración
ALTER TABLE property_images ADD COLUMN size_bytes integer;
```

```typescript
// En upload/route.ts, después de PutObjectCommand
await db.insert(propertyImages).values({
  propertyId,
  key,
  sizeBytes: buffer.length,  // ← tamaño real post-WebP
});
```

---

### B-11 · magicSearches acumulación indefinida

**Archivo:** `src/server/actions/magic-searches.ts` (implícito) y cron cleanup

**Explicación técnica:**  
Las búsquedas de Propi Magic se guardan permanentemente. No hay `LIMIT` ni tarea de cleanup. Un agente que usa la herramienta 10 veces/día acumula 3,650 registros/año. Proyectado a 100 agentes: 365,000 registros/año de historial de búsquedas que nunca se eliminan.

**Fix:**  
Dos cambios coordinados:

1. En la acción que crea la búsqueda, mantener solo las últimas N por usuario usando DELETE:
```typescript
// Al crear, eliminar las más antiguas si supera el límite
const MAX_SAVED_SEARCHES = 50;
const count = await db.select({ n: sql`count(*)::int` })
  .from(magicSearches)
  .where(eq(magicSearches.userId, userId));

if ((count[0]?.n ?? 0) >= MAX_SAVED_SEARCHES) {
  // Borrar las más viejas que excedan el límite
  const oldest = await db.query.magicSearches.findMany({
    where: eq(magicSearches.userId, userId),
    orderBy: [desc(magicSearches.createdAt)],
    offset: MAX_SAVED_SEARCHES - 1,
    columns: { id: true },
  });
  if (oldest.length > 0) {
    await db.delete(magicSearches)
      .where(inArray(magicSearches.id, oldest.map(s => s.id)));
  }
}
```

2. Incluir `magicSearches` más antiguos de 90 días en el cron `cleanup-messages`.

---

### B-12 · Index de cumpleaños ausente

**Archivo:** `src/server/schema.ts` + nueva migración

**Explicación técnica:**  
El cron de notificaciones ejecuta cada hora:
```sql
WHERE EXTRACT(MONTH FROM birth_date) = 5
  AND EXTRACT(DAY FROM birth_date) = 21
```
PostgreSQL no puede usar el índice B-tree en `birth_date` para este predicado porque `EXTRACT()` es una función no-indexada sobre la columna. Con 50,000 contactos en el sistema, esto es un full scan de tabla en cada ejecución hourly.

**Fix:**  
Crear un índice de expresión basado en las mismas funciones que usa la query:

```sql
-- Migración
CREATE INDEX contacts_birth_month_day_idx
  ON contacts (
    EXTRACT(MONTH FROM birth_date),
    EXTRACT(DAY FROM birth_date)
  )
  WHERE birth_date IS NOT NULL;
```

PostgreSQL usará este índice para la query del cron de cumpleaños, reduciendo el costo de O(N) a O(log N + matches).

En Drizzle, esto se agrega como un index funcional en el schema y se genera una nueva migración con `drizzle-kit generate`.

---

## Sprint C — Performance y Escalabilidad

---

### B-13 · Búsqueda global con ILIKE — full scan garantizado

**Archivo:** `src/server/actions/search.ts` y `contacts.ts`

**Explicación técnica:**  
```typescript
ilike(contacts.name, `%${sanitizeLike(search)}%`)
```
Un patrón LIKE/ILIKE que **empieza con `%`** nunca puede usar un índice B-tree. PostgreSQL ejecuta un full scan de la tabla por cada búsqueda. Los índices `contacts_name_idx`, `contacts_email_idx` son completamente inútiles para este patrón.

Con 50,000 contactos en el sistema y el buscador integrado en el TopBar (se ejecuta al hacer submit), esto es un full scan por cada búsqueda.

**Fix (Fase 1 — rápido):**  
Crear un índice GIN con la extensión `pg_trgm` que soporta ILIKE con wildcards:

```sql
-- Requiere extensión pg_trgm (disponible en Postgres sin instalación adicional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX contacts_name_trgm_idx ON contacts USING gin(name gin_trgm_ops);
CREATE INDEX contacts_email_trgm_idx ON contacts USING gin(email gin_trgm_ops);
CREATE INDEX properties_title_trgm_idx ON properties USING gin(title gin_trgm_ops);
```

Los índices GIN-trigram aceleran consultas LIKE/ILIKE con wildcards en cualquier posición. La query no necesita cambiar.

**Fix (Fase 2 — óptimo):**  
Migrar a PostgreSQL Full-Text Search con `tsvector`:

```sql
ALTER TABLE contacts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(company, ''))
  ) STORED;

CREATE INDEX contacts_fts_idx ON contacts USING gin(search_vector);
```

Fase 2 requiere más cambio en el código de query pero es O(log N) para cualquier término.

---

### B-14 · Matching engine O(P×C) en memoria

**Archivo:** `src/server/actions/matching.ts`

**Explicación técnica:**  
```typescript
// Carga TODAS las propiedades activas y TODOS los contactos en memoria
const [activeProperties, allContacts] = await Promise.all([
  db.query.properties.findMany({ where: and(eq(...status, "active")) }),
  db.query.contacts.findMany({ where: eq(contacts.userId, userId) }),
]);

// Cross-product en JavaScript
for (const property of activeProperties) {
  for (const contact of contactsWithPrefs) { ... }
}
```

Un agente con 500 propiedades activas y 2,000 contactos con preferencias ejecuta 1,000,000 comparaciones en JavaScript per request. Si múltiples agentes usan Matches simultáneamente, el servidor procesa millones de comparaciones concurrentemente.

**Fix (Fase 1 — límite):**  
Agregar límites y cache:
```typescript
db.query.properties.findMany({
  where: and(eq(...status, "active")),
  limit: 200,  // límite razonable para un agente
})
// ...
const getCached = unstable_cache(
  () => runFullMatchingUncached(userId),
  [`matches-${userId}`],
  { revalidate: 300 }, // cache 5 minutos
);
```

**Fix (Fase 2 — mover a SQL):**  
Reescribir el matching como una query SQL con JOINs y condiciones WHERE. SQL puede hacer este cross-product en el DB (con índices) en milisegundos:

```sql
SELECT p.id, p.title, c.id, c.name,
  (CASE WHEN p.type = c.pref_property_type THEN 1 ELSE 0 END +
   CASE WHEN lower(p.city) = lower(c.pref_city) THEN 1 ELSE 0 END +
   CASE WHEN p.price::numeric <= c.pref_budget_max::numeric THEN 1 ELSE 0 END
  ) AS score
FROM properties p
CROSS JOIN contacts c
WHERE p.user_id = $userId
  AND p.status = 'active'
  AND c.user_id = $userId
  AND (c.pref_property_type IS NOT NULL OR c.pref_city IS NOT NULL OR c.pref_budget_max IS NOT NULL)
  AND (
    p.type = c.pref_property_type OR
    lower(p.city) = lower(c.pref_city) OR
    p.price::numeric <= c.pref_budget_max::numeric
  )
ORDER BY score DESC
LIMIT 100;
```

---

### B-15 · DB pool sin graceful shutdown

**Archivo:** `src/lib/db.ts`

**Explicación técnica:**  
El pool de conexiones `postgres-js` no tiene un handler de shutdown. Cuando Coolify para el container con SIGTERM, las conexiones al pool quedan en estado `idle` o `active` hasta que PostgreSQL/PgBouncer las expira por timeout (`idle_timeout = 20s`). En deployments frecuentes, esto puede agotar el pool de PgBouncer temporalmente.

**Fix:**  
```typescript
// En db.ts
const sql = postgres(connectionString, { max: 10, ... });
export const db = drizzle(sql, { schema });

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", async () => {
    await sql.end({ timeout: 5 });
    process.exit(0);
  });
}
```

Nota: Next.js en standalone mode recibe SIGTERM de Docker. El handler permite que las queries en vuelo terminen (hasta 5s) antes de cerrar el pool.

---

## Sprint D — Seguridad y Observabilidad

---

### B-16 · Tokens de plataforma en plaintext

**Archivos:** `schema.ts` — tablas `social_accounts` y `service_credentials`

**Explicación técnica:**  
```typescript
accessToken: text("access_token").notNull(),
refreshToken: text("refresh_token"),
```

Los tokens de acceso de Meta (Instagram, Facebook) y MercadoLibre se almacenan en texto plano en la DB. Un dump de la base de datos (backup comprometido, acceso directo a PostgreSQL) expone todos los tokens de todos los usuarios. Un token de Meta con permisos de mensajería puede leer todos los DMs de los usuarios.

**Fix — opción pragmática para este stack:**  
Encriptación simétrica a nivel de aplicación usando AES-256-GCM con una clave maestra en un env var:

```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const MASTER_KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, "hex");
// TOKEN_ENCRYPTION_KEY = 64 hex chars (32 bytes)

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  const decipher = createDecipheriv("aes-256-gcm", MASTER_KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return decipher.update(Buffer.from(encryptedHex, "hex")) + decipher.final("utf8");
}
```

Los tokens se encriptan al guardar y desencriptan al leer. La clave maestra vive en Coolify como secret env var — no en el código ni en la DB.

**Consideraciones de migración:**  
Los tokens existentes necesitan una migración one-time para encriptarlos. El plan:
1. Deploy con las funciones de crypto sin activar
2. Migración: leer todos los tokens, encriptarlos, guardarlos
3. Deploy con encriptación activa

---

### B-17 · CSP sin report-uri

**Archivo:** `src/next.config.ts`

**Explicación técnica:**  
El CSP header actual no tiene `report-uri` ni `report-to`. Las violaciones de CSP (intentos de XSS, recursos externos no autorizados, cambios de URL de CDN) son silenciosas — nunca se registran.

**Fix:**  
```typescript
// En el CSP header
`report-uri /api/csp-report`,

// Nueva route: src/app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json();
  log.http.warn({ csp_report: report }, "CSP violation");
  return new Response(null, { status: 204 });
}
```

Esto no bloquea ningún recurso pero sí registra en Loki (vía pino) cuando ocurre una violación de CSP, permitiendo detectar intentos de inyección.

---

## Notas de Implementación

### Orden recomendado

1. **Sprint A** primero — son bugs de seguridad y correctitud. B-01 (tag ownership) y B-04 (TOCTOU) pueden causar problemas con usuarios reales ahora mismo.

2. **Sprint B** segundo — mejoras de UX y datos. B-10 (storage quota) puede estar bloqueando usuarios legítimamente si tienen muchas imágenes pequeñas.

3. **Sprint C** tercero — preparación para escala. B-13 (trgm index) tiene ROI inmediato ya que la búsqueda es el feature más usado.

4. **Sprint D** último — mejoras de seguridad que requieren trabajo de infraestructura. B-16 (encriptación de tokens) requiere planeación de migración cuidadosa para no invalidar tokens en producción.

### Dependencias entre fixes

- B-08 depende de que `.input-base` del Sprint 3 ya esté en main (está).
- B-12 (birthday index) requiere que el fix de timezone (db.ts) ya esté mergeado (está).
- B-16 requiere agregar `TOKEN_ENCRYPTION_KEY` como env var en Coolify antes del deploy.
- B-10 requiere una migración de DB + cambios en upload route — coordinar deploy.
