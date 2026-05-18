# Propi Inbox - Runbook de Operaciones

## Arquitectura del Inbox

```
Browser (chatscope UI)
    |
    v
Server Actions (messaging.ts)
    |
    ├── sendMessage() --> detecta platform --> llama API correcta:
    |       ├── instagram --> sendIgMessage() --> Meta Graph API /{igId}/messages
    |       ├── facebook  --> graphApiFetch() --> Meta Graph API /{pageId}/messages
    |       └── whatsapp  --> sendWhatsAppText() --> Meta Graph API /{phoneNumberId}/messages
    |
    ├── getConversations() --> PostgreSQL conversations + last message
    ├── getConversation()  --> PostgreSQL conversation + 50 messages
    ├── markConversationRead() --> reset unreadCount a 0
    └── cleanupOldMessages() --> DELETE messages WHERE created_at < 90 dias

Webhook (POST /api/webhooks/meta)
    |
    ├── WhatsApp: body.object === "whatsapp_business_account"
    |       └── handleWhatsAppWebhook() --> findOrCreateConversation() + storeInboundMessage()
    |
    ├── Instagram: body.object === "instagram"
    |       └── handleInstagramWebhook() --> findOrCreateConversation() + storeInboundMessage()
    |
    └── Facebook: body.object === "page"
            └── handleFacebookWebhook() --> findOrCreateConversation() + storeInboundMessage()
```

## Dependencias

| Paquete | Version | Proposito |
|---------|---------|-----------|
| `@chatscope/chat-ui-kit-react` | 2.1.1 | Componentes UI de chat (MIT) |
| `@chatscope/chat-ui-kit-styles` | 1.4.0 | CSS default para chatscope |

**Nota:** `@chatscope/use-chat` (hook de state management) NO se usa porque solo soporta React <= 18.2. Propi usa React 19. El state se maneja con useState/useEffect propios.

## Componentes de chatscope usados

| Componente | Uso en Propi | Props clave |
|-----------|-------------|-------------|
| `MainContainer` | Wrapper principal, prop `responsive` para layout adaptativo | `responsive` |
| `Sidebar` | Panel izquierdo con lista de conversaciones | `position="left"`, `scrollable={false}` |
| `ConversationList` | Lista scrollable de conversaciones | children: `Conversation` |
| `Conversation` | Cada fila de conversacion | `name`, `info`, `lastActivityTime`, `unreadCnt`, `active`, `onClick` |
| `ChatContainer` | Area de chat principal | children: Header + MessageList + MessageInput |
| `ConversationHeader` | Barra superior del chat activo | sub-components: `.Back`, `.Content` |
| `ConversationHeader.Back` | Boton volver (visible en mobile) | `onClick` |
| `ConversationHeader.Content` | Nombre + info del contacto | `userName`, `info` |
| `MessageList` | Lista scrollable de mensajes con auto-scroll | `typingIndicator` |
| `Message` | Burbuja de mensaje individual | `model: { message, sentTime, sender, direction, position }` |
| `Message.Footer` | Hora debajo del mensaje | `sentTime` |
| `MessageSeparator` | Separador de fecha entre mensajes | `content` (string) |
| `MessageInput` | Campo de texto para escribir | `onSend(innerHtml, textContent, innerText, nodes)`, `placeholder`, `attachButton`, `disabled` |
| `Avatar` | Avatar en conversacion y header | children: cualquier JSX |
| `TypingIndicator` | Indicador "Enviando..." | `content` |

## API de chatscope - Detalles importantes

### MessageInput.onSend
```typescript
// Firma: onSend(innerHtml: string, textContent: string, innerText: string, nodes: NodeList)
// Usamos textContent (segundo parametro) que es texto plano sin HTML
onSend={(_, textContent) => handleSend(textContent)}
```

### Message.model.direction
```typescript
// Solo acepta: "incoming" | "outgoing" | 0 | 1
// 0 = incoming, 1 = outgoing
// Nosotros mapeamos: "inbound" (DB) -> "incoming" (chatscope)
direction: msg.direction === "inbound" ? "incoming" : "outgoing"
```

### Message.model.position
```typescript
// Controla agrupacion visual: "single" | "first" | "normal" | "last"
// Usamos "single" para simplificar (cada mensaje es independiente)
position: "single"
```

### Conversation.unreadCnt
```typescript
// Tipo: number | undefined
// Muestra badge solo cuando > 0
// Se parsea internamente con parseInt()
unreadCnt={convo.unreadCount}
```

## CSS Overrides

Chatscope usa su propio sistema de clases CSS con prefijo `cs-`. Para integrarlo con el design system de Propi (CSS custom properties), se aplican overrides globales con scope `.inbox-container`:

| Clase chatscope | Override | Proposito |
|----------------|---------|-----------|
| `.cs-main-container` | border, border-radius | Borde redondeado |
| `.cs-conversation-list` | background | Fondo del sidebar |
| `.cs-conversation` | background, border-bottom | Fondo de cada fila |
| `.cs-conversation--active` | background | Fila seleccionada |
| `.cs-conversation__name` | color, font-weight | Nombre del contacto |
| `.cs-conversation__info` | color | Preview del ultimo mensaje |
| `.cs-message-input` | background, border-top | Campo de texto |
| `.cs-message--incoming .cs-message__content` | background, color | Burbuja entrante (gris) |
| `.cs-message--outgoing .cs-message__content` | background, color | Burbuja saliente (azul) |
| `.cs-conversation-header` | background, border-bottom | Header del chat |
| `.cs-message-list` | background | Fondo del area de mensajes |
| `.cs-message-separator` | color, font-size | Separadores de fecha |
| `.cs-sidebar` | background, border-right | Panel lateral |

Dark mode se maneja con `@media (prefers-color-scheme: dark)` que cambia los valores de las custom properties.

## Base de datos

### Tabla: conversations
```sql
id                      UUID PK
platform                ENUM (instagram, facebook, whatsapp)
external_id             VARCHAR(500)  -- ID de conversacion en Meta
contact_id              UUID FK -> contacts  -- Contacto CRM vinculado
participant_name        VARCHAR(255)  -- Nombre del participante externo
participant_external_id VARCHAR(255)  -- ID del participante en Meta
unread_count            INTEGER DEFAULT 0
last_message_at         TIMESTAMPTZ
created_at              TIMESTAMPTZ
```

### Tabla: messages
```sql
id                UUID PK
conversation_id   UUID FK -> conversations (CASCADE DELETE)
direction         ENUM (inbound, outbound)
body              TEXT
external_id       VARCHAR(500)  -- ID del mensaje en Meta
status            ENUM (pending, sent, delivered, read, failed)
metadata          TEXT  -- JSON string con datos extra
created_at        TIMESTAMPTZ
```

### Indices
- `conversations_platform_idx` - filtro por plataforma
- `conversations_contact_idx` - buscar por contacto CRM
- `conversations_external_idx` - buscar por ID externo de Meta
- `conversations_last_msg_idx` - ordenar por ultimo mensaje
- `messages_conversation_idx` - mensajes de una conversacion
- `messages_created_idx` - ordenar por fecha

## Flujo de datos

### Envio de mensaje (outbound)
1. Usuario escribe en MessageInput y presiona Enter
2. `handleSend(text)` en unified-inbox.tsx
3. `sendMessage(conversationId, body)` server action
4. Detecta `conversation.platform`
5. Llama API de Meta correspondiente
6. Guarda mensaje en DB con direction="outbound", status="sent"
7. Actualiza `lastMessageAt` de la conversacion
8. Retorna mensaje al cliente
9. Se agrega al state local (optimistic update)

### Recepcion de mensaje (inbound)
1. Meta envia POST a `/api/webhooks/meta`
2. Se detecta el tipo: whatsapp_business_account | instagram | page
3. Se parsea el payload segun el formato de cada plataforma
4. `findOrCreateConversation()` busca o crea la conversacion
5. `storeInboundMessage()` guarda el mensaje
6. Incrementa `unreadCount` de la conversacion
7. El auto-refresh del cliente (cada 30s) detecta el nuevo mensaje

### Mark as read
1. Usuario hace click en una conversacion
2. `selectConversation(id)` carga el detalle
3. Si `unreadCount > 0`, llama `markConversationRead(id)`
4. Resetea `unreadCount` a 0 en DB
5. Actualiza state local para quitar el badge

## Troubleshooting

### Problema: Los mensajes no llegan al inbox
1. Verificar que el webhook esta registrado en Meta App Dashboard
2. Verificar `META_WEBHOOK_VERIFY_TOKEN` en env vars
3. Verificar que la URL del webhook es accesible publicamente: `https://tu-dominio.com/api/webhooks/meta`
4. Verificar logs del servidor para errores en el POST handler
5. Verificar que la cuenta de Meta esta conectada en `/marketing/settings`

### Problema: No se pueden enviar mensajes
1. Verificar que el access token de Meta no ha expirado (60 dias)
2. Para WhatsApp: verificar que el numero esta registrado y el WABA esta activo
3. Para WhatsApp free-form: solo funciona dentro de la ventana de 24h despues del ultimo mensaje del cliente
4. Para WhatsApp fuera de 24h: usar `sendWhatsAppTemplate()` con un template aprobado
5. Para Instagram DMs: verificar permisos `instagram_manage_messages` en la Meta App
6. Verificar que `platformAccountId` es correcto en `social_accounts`

### Problema: chatscope no renderiza correctamente
1. Verificar que el CSS esta importado: `import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"`
2. El import debe estar en el componente client ("use client"), no en un server component
3. Si los estilos se ven rotos, verificar que no hay conflictos con Tailwind CSS reset
4. El contenedor necesita altura fija: `height: calc(100vh - 3.5rem)` (3.5rem = top bar)

### Problema: Dark mode no funciona
1. Los overrides usan `@media (prefers-color-scheme: dark)` que depende del sistema operativo
2. Si quieres toggle manual, cambiar a clases CSS en vez de media query
3. Verificar que las CSS custom properties estan definidas en `globals.css`

### Problema: Mensajes duplicados
1. `findOrCreateConversation()` busca por `participantExternalId` para evitar duplicados de conversacion
2. Si Meta reenvia un webhook (retry), el mensaje se duplica porque no hay dedup por `externalId`
3. Fix: agregar unique constraint en `messages.external_id` o check antes de insertar

### Problema: Performance con muchas conversaciones
1. `getConversations()` carga todas las conversaciones sin paginacion
2. Para > 100 conversaciones, agregar `limit` y paginacion
3. El auto-refresh cada 30s puede ser pesado con muchos datos
4. Fix: cambiar a polling incremental (solo conversaciones con `lastMessageAt` > ultimo refresh)

## Limpieza de 90 dias

La funcion `cleanupOldMessages()` en `messaging.ts`:
1. Elimina todos los mensajes con `created_at` < 90 dias atras
2. Elimina conversaciones que quedaron sin mensajes
3. Debe ejecutarse como cron job diario

### Configurar en Coolify:
```bash
# Agregar como scheduled task en Coolify o como cron en el servidor
# Opcion 1: API route dedicada (crear /api/cron/cleanup con auth)
# Opcion 2: Script standalone
node -e "
  const { cleanupOldMessages } = require('./src/server/actions/messaging');
  cleanupOldMessages().then(r => console.log('Cleanup:', r));
"
```

### Alternativa: API route con secret
```typescript
// src/app/api/cron/cleanup/route.ts
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (token !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await cleanupOldMessages();
  return NextResponse.json(result);
}
```

## Multi-tenant (SaaS)

El inbox es multi-tenant por diseño:
- Cada tenant configura sus propios tokens de Meta en `social_accounts`
- Las conversaciones se crean a partir de los webhooks que llegan a las cuentas de cada tenant
- No hay campo `tenantId` explicito porque el scope viene del token de Meta: cada token solo recibe webhooks de sus propias cuentas
- Si se necesita multi-tenant explicito en el futuro, agregar `userId` (Clerk) a `conversations` y `social_accounts`, y filtrar en todas las queries

## Versiones y compatibilidad

| Componente | Version actual | Soporte React 19 | Notas |
|-----------|---------------|-------------------|-------|
| chat-ui-kit-react | 2.1.1 (mayo 2025) | Si (peer dep) | Ultimo release, mantenimiento minimo |
| chat-ui-kit-styles | 1.4.0 | N/A (solo CSS) | Estable |
| use-chat | 3.1.2 | NO (max React 18.2) | NO USAR - incompatible |

Si chatscope deja de funcionar con una version futura de React:
1. Los componentes son simples (JSX + CSS classes), faciles de reemplazar
2. Alternativa: copiar los componentes que usamos al proyecto y mantenerlos internamente
3. Alternativa: migrar a `assistant-ui` (9.1k stars, YC backed, Tailwind nativo, React 19)
