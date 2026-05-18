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

## Mapa completo de cambios (auditoria del codigo)

### Tablas que necesitan `userId` (10 tablas principales)

| Tabla | Columnas | Indice |
|-------|----------|--------|
| `contacts` | `userId: text("user_id").notNull()` | `index("contacts_user_idx").on(table.userId)` |
| `tags` | `userId: text("user_id").notNull()` | `index("tags_user_idx").on(table.userId)` |
| `properties` | `userId: text("user_id").notNull()` | `index("properties_user_idx").on(table.userId)` |
| `appointments` | `userId: text("user_id").notNull()` | `index("appointments_user_idx").on(table.userId)` |
| `documents` | `userId: text("user_id").notNull()` | `index("documents_user_idx").on(table.userId)` |
| `socialAccounts` | `userId: text("user_id").notNull()` | `index("social_accounts_user_idx").on(table.userId)` |
| `emailCampaigns` | `userId: text("user_id").notNull()` | `index("email_campaigns_user_idx").on(table.userId)` |
| `conversations` | `userId: text("user_id").notNull()` | `index("conversations_user_idx").on(table.userId)` |

Tablas que NO necesitan `userId` (heredan via FK o son publicas):
- `contactTags` - hereda de contacts (cascade delete)
- `propertyTags` - hereda de properties (cascade delete)
- `propertyImages` - hereda de properties (cascade delete)
- `messages` - hereda de conversations (cascade delete)
- `campaignRecipients` - hereda de emailCampaigns (cascade delete)
- `marketListings` - datos publicos de MercadoLibre, compartidos

### Funciones que necesitan `userId` (42 funciones en 14 archivos)

#### contacts.ts (6 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getContacts` | SELECT contacts | Agregar `where eq(userId)` |
| `getContact` | SELECT contacts | Agregar `and(eq(id), eq(userId))` |
| `getTags` | SELECT tags | Agregar `where eq(userId)` |
| `createContact` | INSERT contacts + contactTags | Agregar `userId` al values |
| `updateContact` | UPDATE contacts + DELETE/INSERT contactTags | Agregar `and(eq(id), eq(userId))` |
| `deleteContact` | DELETE contacts | Agregar `and(eq(id), eq(userId))` |
| `createTag` | INSERT tags | Agregar `userId` al values |

#### properties.ts (7 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getProperties` | SELECT properties | Agregar `where eq(userId)` |
| `getProperty` | SELECT properties | Agregar `and(eq(id), eq(userId))` |
| `createProperty` | INSERT properties + propertyTags | Agregar `userId` al values |
| `updateProperty` | UPDATE properties + DELETE/INSERT propertyTags | Agregar `and(eq(id), eq(userId))` |
| `deleteProperty` | DELETE properties | Agregar `and(eq(id), eq(userId))` |
| `getUploadUrl` | S3 presigned URL | Agregar prefijo `{userId}/` al key |
| `addPropertyImage` | INSERT propertyImages | Verificar ownership de la property |
| `deletePropertyImage` | DELETE propertyImages + S3 | Verificar ownership |
| `getImageUrl` | S3 presigned URL | Verificar ownership |

#### appointments.ts (6 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getAppointments` | SELECT appointments | Agregar `where eq(userId)` |
| `getUpcomingAppointments` | SELECT appointments | Agregar `where eq(userId)` |
| `getAppointment` | SELECT appointments | Agregar `and(eq(id), eq(userId))` |
| `createAppointment` | INSERT appointments | Agregar `userId` al values |
| `updateAppointment` | UPDATE appointments | Agregar `and(eq(id), eq(userId))` |
| `deleteAppointment` | DELETE appointments | Agregar `and(eq(id), eq(userId))` |

#### documents.ts (5 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getDocuments` | SELECT documents | Agregar `where eq(userId)` |
| `getDocumentUploadUrl` | S3 presigned URL | Agregar prefijo `{userId}/` al key |
| `getDocumentDownloadUrl` | S3 presigned URL | Verificar ownership |
| `createDocument` | INSERT documents | Agregar `userId` al values |
| `deleteDocument` | DELETE documents + S3 | Agregar `and(eq(id), eq(userId))` |

#### social-accounts.ts (4 funciones) - CRITICO
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getSocialAccount` | SELECT socialAccounts | Agregar `and(eq(platform), eq(userId))` |
| `getAllSocialAccounts` | SELECT socialAccounts | Agregar `where eq(userId)` |
| `upsertSocialAccount` | INSERT/UPDATE socialAccounts | Agregar `userId` + encrypt token |
| `deleteSocialAccount` | DELETE socialAccounts | Agregar `and(eq(platform), eq(userId))` |

#### messaging.ts (7 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getConversations` | SELECT conversations | Agregar `where eq(userId)` |
| `getConversation` | SELECT conversations | Agregar `and(eq(id), eq(userId))` |
| `getMessages` | SELECT messages via conversation | Verificar ownership de conversation |
| `sendMessage` | SELECT conversation + INSERT message | Verificar ownership |
| `findOrCreateConversation` | SELECT/INSERT conversations | Agregar `userId` al filtro y values |
| `storeInboundMessage` | INSERT messages + UPDATE conversation | Recibe userId del webhook router |
| `markConversationRead` | UPDATE conversations | Agregar `and(eq(id), eq(userId))` |
| `cleanupOldMessages` | DELETE messages | Filtrar por userId |
| `getTotalUnreadCount` | SELECT conversations | Agregar `where eq(userId)` |

#### email-campaigns.ts (4 funciones)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getEmailCampaigns` | SELECT emailCampaigns | Agregar `where eq(userId)` |
| `getEmailCampaign` | SELECT emailCampaigns | Agregar `and(eq(id), eq(userId))` |
| `createEmailCampaign` | INSERT emailCampaigns | Agregar `userId` al values |
| `sendEmailCampaign` | SELECT/UPDATE emailCampaigns + INSERT recipients | Verificar ownership |

#### dashboard.ts (1 funcion)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `getDashboardStats` | SELECT contacts, properties, appointments | Agregar `where eq(userId)` a las 3 queries |

#### search.ts (1 funcion)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `globalSearch` | SELECT contacts, properties, appointments | Agregar `where eq(userId)` a las 3 queries |

#### wasi-publish.ts (1 funcion)
| Funcion | Operacion | Cambio |
|---------|-----------|--------|
| `publishPropertyToWasi` | SELECT properties + propertyImages | Verificar ownership de la property |

#### Funciones que usan tokens (indirectamente afectadas)

Estas funciones llaman a `getSocialAccount()` para obtener tokens. Una vez que `getSocialAccount` filtre por userId, estas se arreglan automaticamente:

- **instagram.ts**: `getIgMedia`, `getIgMediaInsights`, `replyToIgComment`, `commentOnIgMedia`, `getIgConversations`, `sendIgMessage`, `publishIgPhoto` (7 funciones)
- **facebook.ts**: `getFbPosts`, `publishFbPost`, `commentOnFbPost`, `getFbPageInsights` (4 funciones)
- **whatsapp.ts**: `sendWhatsAppText`, `sendWhatsAppTemplate`, `markWhatsAppMessageRead` (3 funciones)
- **wasi.ts lib**: `getWasiCredentials`, `publishToWasi`, `uploadWasiImage`, `syncWasiPortals` (4 funciones)
- **mercadolibre.ts lib**: `getMLToken`, `refreshMLToken` (2 funciones)

Total indirecto: 20 funciones que se arreglan al migrar `getSocialAccount`.

#### API routes que necesitan cambios

| Route | Cambio |
|-------|--------|
| `/api/webhooks/meta` POST | Resolver userId desde platformAccountId antes de crear conversacion |
| `/api/auth/mercadolibre/callback` | Agregar userId al upsertSocialAccount |
| `/api/cron/sync-market` | Iterar por usuarios con ML conectado |
| `/api/chat/market` | No necesita cambio (usa marketListings que es publica) |
| `/api/images/[key]` | No necesita cambio (proxy publico) |

---

## Plan de ejecucion (7 PRs)

### PR 1: Schema + helper + crypto (Fase 1)
**Archivos**: `schema.ts`, `src/lib/auth-helper.ts`, `src/lib/crypto.ts`, `.env.example`
- Agregar `userId: text("user_id").notNull()` a 8 tablas
- Agregar indice `user_idx` a cada tabla
- Crear `requireUserId()` helper
- Crear `encrypt()`/`decrypt()` para tokens
- Agregar `TOKEN_ENCRYPTION_KEY` a .env.example
- **No rompe nada**: drizzle-kit push agrega columnas, la app sigue funcionando

### PR 2: Core data (contacts + properties + tags)
**Archivos**: `contacts.ts`, `properties.ts`, `src/lib/s3.ts`
- 16 funciones: todas las de contacts.ts + properties.ts
- Agregar prefijo `{userId}/` a MinIO keys en properties
- Agregar `userId` a tags (createTag, getTags)
- **Riesgo medio**: son las tablas mas usadas

### PR 3: Calendar + documents
**Archivos**: `appointments.ts`, `documents.ts`
- 11 funciones
- Agregar prefijo `{userId}/` a MinIO keys en documents
- **Riesgo bajo**: tablas independientes

### PR 4: Social accounts + token encryption
**Archivos**: `social-accounts.ts`, `src/lib/wasi.ts`, `src/lib/mercadolibre.ts`
- 4 funciones directas + 20 funciones indirectas (IG, FB, WA, Wasi, ML)
- Encrypt tokens al guardar, decrypt al leer
- **Riesgo critico**: si falla, ninguna integracion funciona. Testear bien.

### PR 5: Messaging + webhook routing
**Archivos**: `messaging.ts`, `/api/webhooks/meta/route.ts`
- 9 funciones de messaging
- Webhook: resolver userId desde platformAccountId
- `findOrCreateConversation` recibe userId del webhook router
- **Riesgo alto**: si el routing falla, mensajes van al usuario equivocado

### PR 6: Email + dashboard + search + wasi-publish
**Archivos**: `email-campaigns.ts`, `dashboard.ts`, `search.ts`, `wasi-publish.ts`
- 7 funciones
- **Riesgo bajo**: funciones simples, queries directas

### PR 7: Cron multi-user + ML callback + NOT NULL
**Archivos**: `/api/cron/sync-market/route.ts`, `/api/auth/mercadolibre/callback/route.ts`, `schema.ts`
- Cron itera por usuarios con ML conectado
- ML callback agrega userId al social account
- Cambiar todas las columnas userId a NOT NULL
- **Punto de no retorno**: despues de esto, no se puede revertir

---

## Que puede fallar

| Riesgo | Severidad | Mitigacion |
|--------|----------|-----------|
| Olvidar `userId` en una query | Critica - data leak | NOT NULL constraint + revisar cada PR |
| Olvidar `userId` en un INSERT | Critica - datos huerfanos | NOT NULL constraint (PR 7) |
| Webhook rutea al usuario equivocado | Alta | Validar platformAccountId unicidad |
| Token encryption rompe integraciones | Alta | Testear cada integracion despues de PR 4 |
| MinIO archivos sin prefijo | No aplica | No hay datos, empezamos limpio |
| Cron rate limit con muchos usuarios | Media | Cola con spacing entre usuarios |
| Performance con filtro extra | Baja | Indice en userId en cada tabla |

---

## Estimacion

| PR | Contenido | Funciones | Esfuerzo |
|----|-----------|-----------|----------|
| 1 | Schema + helper + crypto | 0 (infraestructura) | 2h |
| 2 | Contacts + properties + tags | 16 | 3h |
| 3 | Appointments + documents | 11 | 2h |
| 4 | Social accounts + encryption | 4 + 20 indirectas | 3h |
| 5 | Messaging + webhook | 9 + webhook | 3h |
| 6 | Email + dashboard + search + wasi | 7 | 2h |
| 7 | Cron + ML callback + NOT NULL | 2 + schema | 2h |
| **Total** | | **42 directas + 20 indirectas** | **17h** |
