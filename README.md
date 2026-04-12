# Propi

CRM inmobiliario para agentes venezolanos. PWA instalable con gestion de contactos, propiedades, citas, documentos, inteligencia de mercado con IA (Propi Magic), y publicacion en portales (Wasi).

## Stack

| Capa | Tecnologia |
|------|-----------:|
| Framework | Next.js 16 (App Router, Server Actions) |
| Lenguaje | TypeScript (strict) |
| UI | Tailwind CSS v4, Lucide icons |
| Auth | Clerk v7 (modelo por seat) |
| ORM | Drizzle ORM + postgres.js |
| Storage | MinIO (S3-compatible) via AWS SDK |
| PWA | Service worker manual (offline, instalable) |
| IA | Groq (Llama 3.3 70B) via Vercel AI SDK v6 |
| Email | Resend (3,000 emails/mes gratis) |
| Chat UI | chatscope/chat-ui-kit-react |

## Modulos

### CRM
- **Dashboard** - KPIs, graficos por tipo/fuente, actividad reciente
- **Contactos** - CRUD, busqueda, segmentacion por tags, tracking de fuente
- **Propiedades** - 7 tipos, filtros, galeria (4 fotos), tags, pagina publica `/p/{id}`
- **Calendario** - Citas vinculadas a contacto y propiedad
- **Documentos** - Upload a MinIO, vinculacion a contacto/propiedad
- **Busqueda Global** - Busca en contactos, propiedades y citas

### Propi Magic (Inteligencia de Mercado)
- **Chat con IA** - Busca propiedades en lenguaje natural ("Apartamentos en Altamira de 80m2")
- **KPIs de mercado** - Precio promedio, mediana, min/max, precio/m2 (calculados con SQL)
- **Busquedas guardadas** - Historial persistente en DB con chat y resultados
- **Pagina de zona** - Todas las propiedades deduplicadas de una zona con grid y KPIs
- **Deduplicacion** - DISTINCT ON (precio + area + titulo) elimina duplicados de MercadoLibre
- **Datos** - MercadoLibre Venezuela (182k+ inmuebles), sync diario via cron worker

### Marketing
- **Instagram** - Acceso directo a publicar, DMs, metricas (asistido)
- **Facebook** - Acceso directo a Business Suite, inbox, insights (asistido)
- **TikTok** - Acceso directo a subir video, analiticas, inbox
- **Email** - Campanas HTML a segmentos por tag via Resend
- **Wasi** - Publicacion con 1 click (API directa, fotos se suben automaticamente)

### Publicacion de Propiedades
- **Wasi** - Auto-publish con API (1 click)
- **Pagina publica** - `/p/{id}` para compartir por WhatsApp/redes
- **Links externos** - Hasta 3 URLs a portales (Wasi, inmuebles24, etc)
- **Texto generado** - Descripcion lista para copiar y pegar

## Feature Flags

| Flag | Default | Que controla |
|------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_META_INBOX` | `false` | Inbox unificado (WA/IG/FB), token config, unread badge |

Cuando se active el inbox (requiere Business Verification de Meta):
- Inbox unificado con chatscope (WhatsApp + Instagram DMs + Facebook Messenger)
- Configuracion de tokens de Meta en settings
- Badge de mensajes no leidos en sidebar
- Help sections de inbox y tokens

## Base de Datos

15 tablas + PgBouncer (6432) + PostgreSQL directo (5432):

```
contacts, contact_tags, tags, properties, property_images, property_tags,
appointments, documents, social_accounts, email_campaigns, campaign_recipients,
conversations, messages, market_listings, magic_searches
```

## Requisitos

- Node.js 20+
- PostgreSQL 16
- MinIO (S3-compatible)
- Clerk (auth)
- Groq API key (IA)
- Resend API key (email, opcional)
- MercadoLibre App ID + Secret (Propi Magic)

## Setup

```bash
git clone https://github.com/aikapenelope/propi.git
cd propi
npm install
cp .env.example .env.local
# Editar .env.local con tus credenciales
npm run dev
```

El schema se sincroniza automaticamente en cada deploy via `entrypoint.sh`.

## Infraestructura

Hetzner Cloud via Coolify:

| Plano | Servidor | IP | Rol |
|-------|----------|-----|-----|
| Control | CX23 | 89.167.75.19 | Coolify, Traefik |
| Data | CX33 | 10.0.1.20 | PostgreSQL, PgBouncer, Redis, MinIO |
| App | CX33 | 10.0.1.30 | Next.js (Propi) + BullMQ worker |

Acceso: Solo via Tailscale VPN (SSH publico bloqueado).

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| `docs/META_CONFIGURATION.md` | Configuracion de webhooks y tokens de Meta |
| `docs/META_MESSAGING_AUDIT.md` | Auditoria del flujo de mensajes |
| `docs/META_ACCESS_MODEL.md` | Modelo de acceso (testers, limites, roadmap) |
| `docs/MERCADOLIBRE_SETUP.md` | Tutorial de ML desde Argentina para Venezuela |

## Precio

$50/mes por usuario. Pago en bolivares a tasa BCV.

## Licencia

MIT
