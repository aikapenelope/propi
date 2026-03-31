# Propi

CRM inmobiliario moderno para agentes y agencias. PWA instalable con gestion de contactos, propiedades, citas, documentos e inbox unificado de mensajeria (Instagram, Facebook, WhatsApp) via Meta Graph API.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Lenguaje | TypeScript (strict) |
| UI | Tailwind CSS v4, Lucide icons |
| Auth | Clerk v7 (modelo por seat) |
| ORM | Drizzle ORM + postgres.js |
| Storage | MinIO (S3-compatible) via AWS SDK |
| PWA | Serwist (service worker, offline, instalable) |
| Mensajeria | Meta Graph API v21.0 (Instagram DMs + Facebook Messenger + WhatsApp Cloud API) |
| Email | Nodemailer (SMTP) |

## Arquitectura de Mensajeria

Un solo proveedor (Meta) para los 3 canales de chat. Mismo access token para todo:

```
Instagram DMs  --\
Facebook Msgs  ----> Meta Graph API ----> Webhook ----> DB ----> Inbox UI
WhatsApp Msgs  --/   (mismo token)       /api/webhooks/meta     (unificado)
```

- **Envio**: server action detecta el `platform` de la conversacion y llama al endpoint correcto de Meta
- **Recepcion**: webhook unico `/api/webhooks/meta` parsea payloads de los 3 canales y guarda en tabla `messages`
- **Sin Twilio**: WhatsApp usa Meta Cloud API directamente (mas barato, mismo token)

## Requisitos

- Node.js 20+
- PostgreSQL 16 (con pgvector)
- MinIO o cualquier storage S3-compatible
- Cuenta de Clerk (auth)
- Meta Developer App (Instagram, Facebook, WhatsApp Cloud API)
- SMTP server (opcional, para email marketing)

## Setup

```bash
git clone https://github.com/aikapenelope/propi.git
cd propi
npm install
cp .env.example .env.local
# Editar .env.local con tus credenciales
npm run db:push
npm run dev
```

## Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://platform:PASSWORD@10.0.1.20:6432/propi

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MinIO / S3
S3_ENDPOINT=http://10.0.1.20:9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_MEDIA_BUCKET=propi-media
S3_DOCS_BUCKET=propi-documents

# SMTP (Email) - opcional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=app-password
SMTP_FROM=tu@email.com

# Meta Webhook
META_WEBHOOK_VERIFY_TOKEN=your-random-verify-token
```

Los tokens de Meta (Instagram, Facebook, WhatsApp) se configuran desde la UI en `/marketing/settings`, no en env vars.

## Scripts

| Comando | Descripcion |
|---------|------------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de produccion (standalone) |
| `npm run start` | Iniciar en produccion |
| `npm run lint` | Linter |
| `npm run typecheck` | Verificar tipos |
| `npm run db:push` | Sincronizar schema con la DB |
| `npm run db:generate` | Generar migraciones |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:studio` | Abrir Drizzle Studio |

## Modulos

### CRM

- **Dashboard** - KPIs, canales de marketing, calculadora de comisiones, actividad reciente
- **Contactos** - CRUD, busqueda, segmentacion por tags, tracking de fuente
- **Propiedades** - CRUD, 7 tipos, filtros, galeria de imagenes con MinIO, tags
- **Calendario** - Citas vinculadas a contacto y propiedad, editar/eliminar
- **Documentos** - Upload a MinIO, vinculacion a contacto/propiedad, descarga/eliminacion
- **Busqueda Global** - Busca en contactos, propiedades y citas

### Mensajeria (Inbox Unificado)

- **Inbox** - Conversaciones de Instagram, Facebook y WhatsApp en una sola vista
- **Webhook** - `/api/webhooks/meta` recibe mensajes entrantes de los 3 canales
- **Envio** - `sendMessage()` enruta al canal correcto segun la conversacion
- **WhatsApp Cloud API** - Mensajes de texto y templates via Meta Graph API
- **Instagram** - DMs, comentarios, publicar fotos, metricas por post
- **Facebook** - Posts, comentarios, publicar en pagina, insights

### Marketing

- **Email** - Campanas HTML, enviar a segmentos por tag
- **TikTok** - Acceso rapido via popup
- **Configuracion** - Tokens de Meta (IG, FB, WA), info SMTP

## Base de Datos

14 tablas:

```
contacts            - Contactos/leads
contact_tags        - M2M contactos <-> tags
tags                - Etiquetas compartidas
properties          - Listados de propiedades
property_images     - Imagenes en MinIO
property_tags       - M2M propiedades <-> tags
appointments        - Citas
documents           - Archivos en MinIO
social_accounts     - Tokens de Instagram/Facebook/WhatsApp
email_campaigns     - Campanas de email
campaign_recipients - Destinatarios por campana
conversations       - Conversaciones unificadas (IG/FB/WA)
messages            - Mensajes de todas las conversaciones
```

## Estructura

```
src/
  app/
    (app)/              # Rutas autenticadas
      calendar/         # Citas
      contacts/         # Contactos
      dashboard/        # Panel principal
      documents/        # Documentos
      marketing/        # Inbox, Instagram, Facebook, Email, TikTok, Settings
      properties/       # Propiedades
      search/           # Busqueda global
    api/webhooks/meta/  # Webhook de Meta (IG/FB/WA)
  components/           # Componentes React
  lib/                  # DB, S3, Mailer, Meta API wrapper
  server/
    actions/            # Server Actions
    schema.ts           # Schema Drizzle
```

## Modelo de Negocio

- Sin tabla de agentes. Cada usuario de Clerk = un seat
- Cobro por seat (usuario), no por agente registrado
- Tokens de Meta se guardan en DB por usuario, no en env vars

## Infraestructura

Hetzner Cloud via Coolify:

- **App Plane** (10.0.1.30) - Next.js standalone
- **Data Plane** (10.0.1.20) - PostgreSQL 16 + PgBouncer + Redis 7 + MinIO
- **DB:** `propi` | **Redis DB:** 3 | **MinIO:** `propi-media`, `propi-documents`

## Licencia

MIT
