# Migracion a Multi-Tenant

## Contexto

Propi esta diseñado para venderse a usuarios individuales, no a agencias. Cada usuario maneja su propio CRM completo: sus contactos, propiedades, citas, documentos, inbox, tokens de Meta/ML/Wasi. Actualmente no hay aislamiento de datos entre usuarios. No hay datos de usuarios en la DB, asi que la migracion no tiene riesgo de perdida de datos.

---

## Score: Reescribir vs Migrar

### Reescribir desde cero: 3/10 (NO recomendado)

Joel Spolsky lo llamo "the single worst strategic mistake that any software company can make". Razones:

- **Propi tiene 15 tablas, 68 server actions, 34 componentes, 31 paginas** que funcionan. Reescribir pierde todo ese trabajo.
- **El problema es solo de filtrado**, no de arquitectura. El codigo esta bien estructurado, tipado, con server actions separadas por dominio.
- **El stack es correcto** (Next.js + Clerk + Drizzle + PostgreSQL). No hay que cambiar tecnologias.
- **Reescribir toma 2-3x mas** de lo estimado (dato de la industria). Estimacion optimista: 4-6 semanas. Realista: 8-12 semanas.

### Migrar incrementalmente: 9/10 (RECOMENDADO)

- **El cambio es mecanico**: agregar `userId` a tablas + agregar `where eq(userId)` a queries. No hay logica de negocio que cambie.
- **Cada PR es independiente y testeable**: migrar contacts.ts no afecta properties.ts.
- **No hay datos que migrar**: la DB esta vacia de datos de usuarios, asi que no hay riesgo de corrupcion.
- **El patron es estandar**: Neon + Clerk + Drizzle usan exactamente este patron (`user_id: text("user_id").notNull()` + `auth().userId`).
- **Backward compatible**: se puede hacer gradual, tabla por tabla.

---

## Como lo hacen en nuestro stack (investigacion)

### Patron oficial: Neon + Clerk + Drizzle

Neon (el proveedor de PostgreSQL mas popular para Next.js) documenta exactamente este patron:

```typescript
// Schema
export const UserMessages = pgTable('user_messages', {
  user_id: text('user_id').notNull(),  // Clerk userId
  message: text('message').notNull(),
});

// Server action
import { auth } from '@clerk/nextjs/server';

export async function getMessages() {
  const { userId } = await auth();
  return db.select().from(messages).where(eq(messages.userId, userId));
}
```

Fuente: https://neon.com/blog/nextjs-authentication-using-clerk-drizzle-orm-and-neon

### Clerk auth() en Server Actions

Clerk v7 provee `auth()` que retorna `{ userId, isAuthenticated }` en cualquier server action o route handler:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function myServerAction() {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Not authenticated");
  // userId es el Clerk user ID (ej: "user_2NNEqL2nrIRdJ194ndJqAHwEfxC")
}
```

No necesita pasar userId como parametro. `auth()` lo lee del request context automaticamente.

### Drizzle ORM: no soporta RLS automatico

Drizzle soporta definir RLS policies en el schema (desde v1.0-beta), pero:
- Requiere PostgreSQL roles por usuario
- PgBouncer en transaction mode no puede hacer `SET role` por transaccion
- La alternativa recomendada por Drizzle es application-level filtering

### MinIO: prefix-based isolation

MinIO documenta 3 opciones para multi-tenant:
1. **Bucket por tenant** - no escala (limite de buckets)
2. **Prefix por tenant** - recomendado para nuestro caso
3. **Namespace isolation** - requiere Kubernetes

Opcion 2 es la correcta: un bucket compartido con prefijo `{userId}/`.

---

## Estrategia: Application-Level Tenancy con Clerk userId

### Por que NO usar Clerk Organizations

Clerk Organizations es para equipos (multiples usuarios en un tenant). Propi es para usuarios individuales. Cada usuario ES su propio tenant. Usar Organizations agrega complejidad innecesaria (invitaciones, roles, org switcher).

### Por que NO usar PostgreSQL RLS

Drizzle ORM soporta RLS desde v1.0-beta, pero:
- PgBouncer en transaction mode no puede hacer `SET role` por transaccion
- Requiere crear un PostgreSQL role por cada usuario de Clerk (no escala)
- La alternativa recomendada por Drizzle y Neon es application-level filtering

### La forma correcta

**Application-level tenancy**: agregar `userId TEXT NOT NULL` a cada tabla y filtrar en cada server action con `auth().userId`.

```typescript
// src/lib/auth-helper.ts - helper centralizado
import { auth } from "@clerk/nextjs/server";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
```

Cada server action usa el helper:
```typescript
// SELECT: agregar where
export async function getContacts() {
  const userId = await requireUserId();
  return db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
  });
}

// INSERT: agregar userId al values
export async function createContact(data) {
  const userId = await requireUserId();
  return db.insert(contacts).values({ ...data, userId }).returning();
}

// UPDATE/DELETE: verificar ownership
export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await db.delete(contacts).where(
    and(eq(contacts.id, id), eq(contacts.userId, userId))
  );
}
```

### Encriptacion de tokens

Los tokens de Meta/ML/Wasi se guardan en `socialAccounts.accessToken` como texto plano. En multi-tenant, si un atacante accede a la DB, tiene los tokens de TODOS los usuarios. Solucion:

```typescript
// src/lib/crypto.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, "hex"); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(data: string): string {
  const [ivHex, tagHex, encHex] = data.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex")) + decipher.final("utf8");
}
```

Nueva env var: `TOKEN_ENCRYPTION_KEY` (generar con `openssl rand -hex 32`).

Aplicar en `upsertSocialAccount` (encrypt al guardar) y `getWasiCredentials`, `getIgToken`, etc. (decrypt al leer).

---

## Fase 1: Schema (no rompe nada)

### Agregar columna `userId` a 13 tablas

```typescript
// Agregar a cada tabla:
userId: text("user_id"),

// Con indice:
index("tabla_user_idx").on(table.userId),
```

Tablas que necesitan `userId`:

| Tabla | Razon |
|-------|-------|
| contacts | Cada usuario tiene sus propios contactos |
| tags | Tags son por usuario |
| properties | Propiedades son por usuario |
| propertyImages | Hereda de properties (pero agregar userId directo es mas seguro) |
| appointments | Citas son por usuario |
| documents | Documentos son por usuario |
| socialAccounts | Tokens de Meta/ML/Wasi son por usuario |
| emailCampaigns | Campanas son por usuario |
| conversations | Conversaciones de inbox son por usuario |
| messages | Hereda de conversations |
| marketAnalyses | Si se reactiva, por usuario |
| contactTags | Hereda de contacts + tags |
| propertyTags | Hereda de properties + tags |

Tablas que NO necesitan `userId`:
- `marketListings` - datos publicos de MercadoLibre, compartidos entre todos
- `campaignRecipients` - hereda de emailCampaigns (ya filtrado)

### Columna nullable al inicio

```typescript
userId: text("user_id"), // nullable para no romper datos existentes
```

Despues de migrar datos existentes, cambiar a:
```typescript
userId: text("user_id").notNull(),
```

### Helper centralizado

```typescript
// src/lib/auth-helper.ts
import { auth } from "@clerk/nextjs/server";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
```

---

## Fase 2: Server Actions (gradual, por archivo)

### Patron para cada funcion

**Queries (SELECT):**
```typescript
// Antes
export async function getContacts() {
  return db.query.contacts.findMany({
    orderBy: [desc(contacts.updatedAt)],
  });
}

// Despues
export async function getContacts() {
  const userId = await requireUserId();
  return db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: [desc(contacts.updatedAt)],
  });
}
```

**Mutations (INSERT):**
```typescript
// Antes
export async function createContact(data) {
  return db.insert(contacts).values(data).returning();
}

// Despues
export async function createContact(data) {
  const userId = await requireUserId();
  return db.insert(contacts).values({ ...data, userId }).returning();
}
```

**Mutations (UPDATE/DELETE) - verificar ownership:**
```typescript
// Antes
export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
}

// Despues
export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await db.delete(contacts).where(
    and(eq(contacts.id, id), eq(contacts.userId, userId))
  );
}
```

### Orden de migracion por archivo

| PR | Archivo | Funciones | Riesgo |
|----|---------|-----------|--------|
| 1 | contacts.ts | 7 | Medio - tabla mas usada |
| 2 | properties.ts | 9 | Alto - imagenes vinculadas |
| 3 | appointments.ts | 6 | Bajo |
| 4 | documents.ts | 5 | Bajo |
| 5 | messaging.ts | 9 | Alto - webhook routing |
| 6 | social-accounts.ts | 4 | Critico - tokens |
| 7 | email-campaigns.ts | 4 | Bajo |
| 8 | dashboard.ts | 1 | Bajo - agrega userId a todas las queries |
| 9 | search.ts | 1 | Bajo |
| 10 | market-listings.ts | 7 | Bajo - solo filtra queries de KPIs |

---

## Fase 3: MinIO (storage)

### Estrategia: Prefix-based isolation

No crear buckets por usuario (limite de buckets, complejidad). Usar prefijos:

```
propi-media/
  {userId}/
    properties/
      {propertyId}-{filename}.jpg
    documents/
      {docId}-{filename}.pdf
```

### Cambios en codigo

```typescript
// src/lib/s3.ts - agregar helper
export function getUserKey(userId: string, key: string): string {
  return `${userId}/${key}`;
}
```

```typescript
// En getUploadUrl:
const userId = await requireUserId();
const key = getUserKey(userId, `properties/${Date.now()}-${filename}`);
```

### Migracion de archivos existentes

Los archivos actuales no tienen prefijo. Opciones:
1. **Mover archivos** - script que mueve cada archivo a `{userId}/...` (requiere saber el userId del primer usuario)
2. **Backward compatibility** - si el key no tiene prefijo, buscar sin prefijo (fallback)
3. **Ignorar** - los archivos viejos se quedan donde estan, los nuevos van con prefijo

Recomendacion: opcion 2 (backward compatibility) para no perder datos.

---

## Fase 4: Webhook routing

### Problema

El webhook de Meta recibe un mensaje y no sabe de que usuario es. Actualmente lo guarda en `conversations` sin `userId`.

### Solucion

1. El webhook recibe el mensaje con un `pageId` (Facebook), `igId` (Instagram), o `phoneNumberId` (WhatsApp)
2. Buscar en `socialAccounts` cual usuario tiene ese `platformAccountId`
3. Usar el `userId` de ese social account para crear la conversacion

```typescript
// En el webhook POST handler:
async function resolveUserId(platform: string, platformId: string): Promise<string | null> {
  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, platform),
      eq(socialAccounts.platformAccountId, platformId),
    ),
  });
  return account?.userId || null;
}
```

### Edge case: 2 usuarios con la misma cuenta de Meta

No deberia pasar (cada usuario conecta SU cuenta), pero si pasa, el mensaje va al primer usuario que conecto esa cuenta. Agregar validacion de unicidad en `upsertSocialAccount`.

---

## Fase 5: Cron sync

### Problema

El cron de MercadoLibre usa un token compartido. En multi-tenant, cada usuario tiene su propio token de ML.

### Solucion

```typescript
// En /api/cron/sync-market:
// 1. Obtener todos los usuarios con ML conectado
const mlAccounts = await db.query.socialAccounts.findMany({
  where: eq(socialAccounts.platform, "mercadolibre"),
});

// 2. Para cada usuario, sincronizar con su token
for (const account of mlAccounts) {
  try {
    await syncForUser(account.userId, account.accessToken);
  } catch (err) {
    console.error(`Sync failed for user ${account.userId}:`, err);
  }
}
```

### Rate limit

Con N usuarios, el cron hace N * 1000 requests (1000 por usuario). Con 1500 req/min de ML, soporta ~1.5 usuarios por minuto. Para mas usuarios, necesita cola o spacing.

---

## Fase 6: Hacer userId NOT NULL

### Prerequisitos

- Todas las server actions migradas
- Datos existentes asignados a un userId
- Tests manuales pasados

### Migracion de datos existentes

```sql
-- Asignar todos los registros existentes al primer usuario
UPDATE contacts SET user_id = 'user_PRIMER_CLERK_ID' WHERE user_id IS NULL;
UPDATE properties SET user_id = 'user_PRIMER_CLERK_ID' WHERE user_id IS NULL;
-- ... para cada tabla
```

### Cambiar columna

```typescript
userId: text("user_id").notNull(),
```

---

## Que puede fallar

| Riesgo | Severidad | Mitigacion |
|--------|----------|-----------|
| Olvidar `userId` en una query | Critica - data leak | Lint rule custom o wrapper de DB |
| Olvidar `userId` en un INSERT | Critica - datos huerfanos | NOT NULL constraint (Fase 6) |
| Webhook rutea al usuario equivocado | Alta | Validar platformAccountId unicidad |
| MinIO archivos sin prefijo | Media | Backward compatibility fallback |
| Cron rate limit con muchos usuarios | Media | Cola con spacing |
| Performance con filtro extra | Baja | Indice en userId |
| Datos existentes sin userId | Media | Script de migracion antes de NOT NULL |

---

## Estimacion

| Fase | Esfuerzo | PRs | Puede hacerse gradual? |
|------|----------|-----|----------------------|
| 1: Schema + helper | 2h | 1 | Si - no rompe nada |
| 2: Server actions | 8-10h | 10 | Si - archivo por archivo |
| 3: MinIO prefijos | 3h | 1 | Si - backward compatible |
| 4: Webhook routing | 3h | 1 | Si - agrega logica sin romper |
| 5: Cron multi-user | 2h | 1 | Si - itera por usuarios |
| 6: NOT NULL + migracion | 2h | 1 | No - punto de no retorno |
| **Total** | **20-22h** | **15** | |

---

## Orden recomendado

1. Fase 1 (schema) - prepara el terreno
2. Fase 2 PRs 1-4 (contacts, properties, appointments, documents) - las tablas core
3. Fase 3 (MinIO) - storage aislado
4. Fase 2 PRs 5-6 (messaging, social-accounts) - las mas delicadas
5. Fase 4 (webhook) - depende de social-accounts migrado
6. Fase 2 PRs 7-10 (email, dashboard, search, market) - las restantes
7. Fase 5 (cron) - depende de social-accounts migrado
8. Fase 6 (NOT NULL) - cierre, punto de no retorno
