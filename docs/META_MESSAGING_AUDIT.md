# Meta Messaging Integration Audit

## Architecture Overview

```
Meta Servers
  |
  | POST /api/webhooks/meta (HTTPS via Traefik)
  v
Next.js Route Handler (src/app/api/webhooks/meta/route.ts)
  |
  |-- 1. Validate HMAC signature (X-Hub-Signature-256)
  |-- 2. Parse JSON body
  |-- 3. Route by object type (whatsapp_business_account | instagram | page)
  |-- 4. Resolve userId from platformAccountId (socialAccounts table)
  |-- 5. findOrCreateConversation (with userId)
  |-- 6. storeInboundMessage (with deduplication by externalId)
  |-- 7. Return 200 OK
  v
PostgreSQL (conversations + messages tables)
```

## Audit Results

### 1. Webhook Verification (GET) - PASS

```typescript
// route.ts L24-35
if (mode === "subscribe" && token === verifyToken) {
  return new NextResponse(challenge, { status: 200 });
}
```

**Status**: Correct per Meta docs.
**Meta requirement**: Return `hub.challenge` as plain text with 200.
**Our implementation**: Returns challenge correctly.

### 2. HMAC Signature Validation (POST) - PASS

```typescript
// route.ts L44-62
const sigBuf = Buffer.from(signature, "utf8");
const expectedBuf = Buffer.from(expectedSig, "utf8");
if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
```

**Status**: Correct. Uses `timingSafeEqual` (timing-safe comparison).
**Also**: Rejects if `META_APP_SECRET` is set but no signature header present.

### 3. Response Time - PASS WITH CONCERN

**Meta requirement**: Return 200 within 5-10 seconds or Meta retries.
**Our implementation**: Processing is synchronous (DB queries inline), then returns 200.

**Concern**: Under load, if DB is slow, the webhook could take >10s and Meta retries.
**Recommendation**: For high volume (>100 messages/min), move to queue-first architecture:
```
Receive webhook -> store in Redis queue -> return 200 immediately -> process async
```
**Current risk**: Low for <200 users. Each message does 2-3 DB queries (~10ms each).

### 4. Message Deduplication - PASS

```typescript
// messaging.ts storeInboundMessage
if (externalId) {
  const existing = await db.query.messages.findFirst({
    where: eq(messages.externalId, externalId),
  });
  if (existing) return existing;
}
```

**Status**: Correct. Meta delivers at-least-once, so duplicates are expected.
**Meta docs**: "Delivery guarantee: At-least-once. Ordering guarantee: None."

### 5. Multi-tenant Routing - PASS

```typescript
// WhatsApp: resolves from phone_number_id
const userId = await resolveUser("whatsapp", phoneNumberId);

// Instagram: resolves from recipient.id (IG Business Account ID)
const userId = await resolveUser("instagram", event.recipient.id);

// Facebook: resolves from recipient.id (Page ID)
const userId = await resolveUser("facebook", event.recipient.id);
```

**Status**: Correct. Each platform uses the correct identifier to resolve the user.

### 6. Message Types Handling - PARTIAL

**WhatsApp**: Only extracts text. Other types show as `[type]`.
```typescript
const textBody = msg.type === "text" ? msg.text?.body || "" : `[${msg.type}]`;
```

**Missing types not extracted**:
- `image`: Has `image.id` (media ID to download via API)
- `audio`: Has `audio.id`
- `video`: Has `video.id`
- `document`: Has `document.id`, `document.filename`
- `location`: Has `location.latitude`, `location.longitude`
- `sticker`: Has `sticker.id`
- `reaction`: Has `reaction.emoji`, `reaction.message_id`
- `interactive`: Has `interactive.button_reply` or `interactive.list_reply`

**Instagram/Facebook**: Only extracts text. Media shows as `[media]`.

**Impact**: Users see `[image]` instead of the actual image. Not a bug, but a feature gap.
**Recommendation**: Download media via Graph API and store in MinIO, or at minimum store the media URL.

### 7. Status Updates (Read Receipts) - NOT HANDLED

**WhatsApp sends status updates** (sent, delivered, read, failed) in the same webhook.
```typescript
// Current code checks for value.messages but ignores value.statuses
if (!value.messages) continue;  // Skips status updates
```

**Impact**: We don't track if our outbound messages were delivered/read.
**Recommendation**: Handle `value.statuses` to update message status in DB.

### 8. Token Management - ISSUES FOUND

#### Meta tokens (IG/FB/WA)

**How tokens are stored**: `socialAccounts.accessToken` (plaintext in DB).
**Token type**: Long-lived user tokens (60 days for IG/FB).
**Refresh mechanism**: NONE for Meta tokens.

**Problem**: Meta long-lived tokens expire after 60 days. There is no automatic refresh.
When the token expires, all API calls fail silently until the user manually reconnects.

**Meta docs on token refresh**:
- Long-lived user tokens cannot be refreshed server-side without user interaction
- System User tokens (for Business accounts) never expire but require Business Manager setup
- The recommended approach for production is System User tokens

**Recommendation**:
1. Track `tokenExpiresAt` (already in schema)
2. Show warning in UI when token expires in <7 days
3. Send email notification when token is about to expire
4. Long-term: migrate to System User tokens (never expire)

#### MercadoLibre tokens

**Refresh mechanism**: Auto-refresh in `getMeliToken()` when token is within 5 minutes of expiry.
**Status**: Correct. Uses `refreshToken` grant type.

### 9. Error Handling - PASS WITH NOTES

```typescript
// Always return 200 to Meta so they don't retry
return NextResponse.json({ status: "error" }, { status: 200 });
```

**Status**: Correct per Meta docs. If you return non-200, Meta retries with exponential backoff for up to 7 days, which can cause a cascade of duplicate processing.

**Note**: Errors are logged with `console.error` but there's no alerting (no Sentry/Datadog).

### 10. WhatsApp 24-Hour Window - NOT ENFORCED

**Meta rule**: After a customer sends a message, you have 24 hours to respond with free-form text. After 24 hours, you can only send pre-approved template messages.

**Current code**: `sendWhatsAppText()` sends text without checking the 24h window.
```typescript
// whatsapp.ts - no window check
export async function sendWhatsAppText(to: string, body: string) {
  // Sends directly without checking lastInboundAt
}
```

**Impact**: Messages sent outside the 24h window will fail with Meta error code 131047.
**Recommendation**: Track `lastInboundAt` on conversations and check before sending.

### 11. Array Handling in Webhooks - PASS

**Meta docs warn**: "Under high load, Meta batches multiple messages in a single webhook. The `entry`, `changes`, and `messages` fields are arrays."

**Our code**: Correctly iterates all arrays with `for...of` loops.
```typescript
for (const entry of body.entry) {
  for (const change of entry.changes) {
    for (const msg of value.messages) {
```

### 12. Outbound Message Flow - PASS

```
User clicks "Send" in Inbox
  -> sendMessage() (messaging.ts)
    -> Checks conversation ownership (userId)
    -> Routes by platform:
      - instagram: sendIgMessage() -> graphApiFetch POST /{igId}/messages
      - facebook: graphApiFetch POST /{pageId}/messages
      - whatsapp: sendWhatsAppText() -> graphApiFetch POST /{phoneNumberId}/messages
    -> Stores outbound message in DB
    -> Updates conversation lastMessageAt
```

**Status**: Correct. All outbound calls go through `graphApiFetch` which has 15s timeout.

### 13. Graph API Error Codes - NOT HANDLED SPECIFICALLY

**Meta error codes that should be handled**:
- `190`: Invalid/expired access token -> prompt user to reconnect
- `100`: Invalid parameter -> log and skip
- `4`: API rate limit -> retry with backoff
- `10`: Permission denied -> prompt user to check permissions
- `368`: Temporarily blocked -> wait and retry

**Current handling**: Generic error message from `graphApiFetch`:
```typescript
throw new Error(`Graph API error: ${err.error?.message || res.statusText}`);
```

**Recommendation**: Parse error codes and handle specifically (especially 190 for expired tokens).

## Summary of Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Webhook verification | - | PASS |
| 2 | HMAC validation | - | PASS |
| 3 | Response time | Low | PASS (concern at scale) |
| 4 | Message deduplication | - | PASS |
| 5 | Multi-tenant routing | - | PASS |
| 6 | Media message types | Medium | Only text extracted |
| 7 | Status updates (read receipts) | Low | Not handled |
| 8 | Token expiry (Meta 60 days) | High | No auto-refresh, no warning |
| 9 | Error handling | - | PASS |
| 10 | WhatsApp 24h window | Medium | Not enforced |
| 11 | Array handling | - | PASS |
| 12 | Outbound flow | - | PASS |
| 13 | Graph API error codes | Medium | Generic handling only |

## Recommendations Priority

1. **Token expiry warning** (High) - Show UI warning when Meta token expires in <7 days
2. **WhatsApp 24h window check** (Medium) - Track lastInboundAt, check before sending
3. **Media message extraction** (Medium) - At minimum store media type and ID
4. **Graph API error code handling** (Medium) - Parse code 190 for expired tokens
5. **Status update handling** (Low) - Track delivered/read status
6. **Queue-first architecture** (Low) - Only needed at >100 msg/min scale
