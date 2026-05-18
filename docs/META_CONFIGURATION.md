# Meta Platform Configuration Guide

## Required Accounts

1. **Meta Developer Account**: https://developers.facebook.com
2. **Facebook Business Page**: Required for Facebook Messenger
3. **Instagram Professional Account**: Connected to the Facebook Page
4. **WhatsApp Business Account**: Via Meta Business Suite

## App Configuration

### 1. Create Meta App

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select "Business" type
4. Name: "Propi CRM" (or your app name)
5. Business: Select your Meta Business account

### 2. Add Products

Add these products to your app:
- **Messenger** (for Facebook Messenger)
- **Instagram** (for Instagram DMs)
- **WhatsApp** (for WhatsApp Business API)

### 3. Webhook Configuration

**Callback URL**: `https://propi.aikalabs.cc/api/webhooks/meta`
**Verify Token**: Value of `META_WEBHOOK_VERIFY_TOKEN` env var (generate with `openssl rand -hex 32`)

#### Webhook Subscriptions

| Product | Field | Description |
|---------|-------|-------------|
| Messenger | `messages` | Inbound messages from Facebook |
| Messenger | `messaging_postbacks` | Button clicks |
| Instagram | `messages` | Inbound DMs |
| WhatsApp | `messages` | Inbound messages + status updates |

### 4. Permissions Required

| Permission | Product | Purpose |
|-----------|---------|---------|
| `pages_messaging` | Messenger | Send/receive FB messages |
| `instagram_basic` | Instagram | Read IG profile |
| `instagram_manage_messages` | Instagram | Send/receive IG DMs |
| `instagram_manage_comments` | Instagram | Reply to comments |
| `whatsapp_business_messaging` | WhatsApp | Send/receive WA messages |
| `whatsapp_business_management` | WhatsApp | Manage WA account |

### 5. App Review

For production, submit for App Review with:
- Privacy Policy URL
- Terms of Service URL
- App icon
- Business verification (Meta Business Suite)

## Environment Variables

```bash
# Webhook verification (random string, you define it)
META_WEBHOOK_VERIFY_TOKEN=<openssl rand -hex 32>

# App Secret (from App Dashboard > Settings > Basic)
META_APP_SECRET=<your-app-secret>

# These are configured per-user in Propi settings, not as env vars:
# - Instagram Business Account ID + Long-lived token
# - Facebook Page ID + Page token
# - WhatsApp Phone Number ID + System User token
```

## Token Types & Expiration

| Token | Expiration | Auto-refresh? | How to get |
|-------|-----------|---------------|-----------|
| User Access Token (short-lived) | 1-2 hours | No | OAuth login |
| User Access Token (long-lived) | 60 days | No (must re-login) | Exchange short-lived |
| Page Access Token | Never (if from long-lived user token) | No | From user token |
| System User Token | Never | No | Business Manager |
| WhatsApp System User Token | Never | No | Business Manager |

### Recommended for Production

Use **System User tokens** for WhatsApp (never expire).
Use **Page Access Tokens** derived from long-lived user tokens for IG/FB.
Show expiry warning in UI when <7 days remaining.

## WhatsApp Business API Specifics

### 24-Hour Session Window

- After a customer sends a message, you have **24 hours** to respond with free-form text
- After 24 hours, you can only send **pre-approved template messages**
- Each customer message resets the 24h window
- Propi tracks `lastInboundAt` on conversations and blocks free-form text after 24h

### Message Types Supported

| Type | Inbound | Outbound | Propi Support |
|------|---------|----------|---------------|
| Text | Yes | Yes | Full |
| Image | Yes | No | Shows [image] |
| Audio | Yes | No | Shows [audio] |
| Video | Yes | No | Shows [video] |
| Document | Yes | No | Shows [document] |
| Location | Yes | No | Shows [location] |
| Sticker | Yes | No | Shows [sticker] |
| Reaction | Yes | No | Shows [reaction] |
| Template | N/A | Yes | Via sendWhatsAppTemplate() |

### Rate Limits

- **Messaging**: Depends on phone number quality rating and tier
- **API calls**: 200 calls per hour per phone number (Cloud API)
- **Webhooks**: Meta retries with exponential backoff for up to 7 days if no 200 response

### Status Updates

Meta sends status updates for outbound messages:
- `sent` -> Message sent to Meta servers
- `delivered` -> Message delivered to recipient's device
- `read` -> Recipient opened the message
- `failed` -> Delivery failed (with error code)

Propi updates message status in DB via webhook.

## Instagram Messaging Specifics

### Conversation Rules

- Conversations start when a user messages your IG professional account
- You have **24 hours** to respond (same as WhatsApp)
- For human agent responses, use `HUMAN_AGENT` tag to extend to 7 days
- Group messaging not supported

### Inbox Behavior

- New conversations from followers: Primary folder
- New conversations from non-followers: Requests folder
- API messages don't mark as "Read" in IG app until a reply is sent

## Facebook Messenger Specifics

### Page Messaging

- Users must initiate conversation first
- 24-hour standard messaging window
- Template messages for outside the window (requires approval)
- Page must be published and have messaging enabled

## Webhook Security

### HMAC Validation

Every webhook POST includes `X-Hub-Signature-256` header.
Propi validates with:
1. `crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex")`
2. Compare with `crypto.timingSafeEqual()` (timing-safe)
3. Reject if META_APP_SECRET set but no signature header

### mTLS Certificate (March 2026)

Meta switched CA for mTLS on March 31, 2026.
If using mTLS verification, update trust store with `meta-outbound-api-ca-2025-12.pem`.
Propi uses standard HTTPS (Traefik), not mTLS, so this doesn't apply.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| Code 190 | Token expired/invalid | Reconnect in Settings |
| Code 4 | API rate limit | Wait and retry |
| Code 10 | Permission denied | Check app permissions |
| Code 131047 | Outside 24h window | Use template message |
| Code 368 | Temporarily blocked | Wait 24h |
| Webhook retries | Slow response (>10s) | Optimize DB queries |
| Duplicate messages | Meta retry | Deduplication by externalId |
