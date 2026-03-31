# Propi

CRM inmobiliario moderno para agentes y agencias. PWA instalable con gestion de contactos, propiedades, citas, documentos y marketing integrado (Instagram, Facebook, WhatsApp, Email).

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Lenguaje | TypeScript (strict) |
| UI | Tailwind CSS v4, Lucide icons |
| Auth | Clerk v7 |
| ORM | Drizzle ORM + postgres.js |
| Storage | MinIO (S3-compatible) via AWS SDK |
| PWA | Serwist (service worker, offline, instalable) |
| WhatsApp | Twilio SDK |
| Email | Nodemailer (SMTP) |
| Social | Meta Graph API v21.0 (Instagram + Facebook) |

## Requisitos

- Node.js 20+
- PostgreSQL 16 (con pgvector)
- MinIO o cualquier storage S3-compatible
- Cuenta de Clerk (auth)
- Twilio (opcional, para WhatsApp)
- SMTP server (opcional, para email marketing)
- Meta Developer App (opcional, para Instagram/Facebook)

## Setup

```bash
# Clonar e instalar
git clone https://github.com/aikapenelope/propi.git
cd propi
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Crear tablas en la base de datos
npm run db:push

# Desarrollo
npm run dev
```

## Variables de Entorno

```bash
# Base de datos (PgBouncer para runtime, Postgres directo para migraciones)
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

# Twilio (WhatsApp) - opcional
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# SMTP (Email) - opcional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=app-password
SMTP_FROM=tu@email.com
```

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

- **Dashboard** - KPIs (propiedades, contactos, citas), canales de marketing, calculadora de comisiones, actividad reciente
- **Contactos** - CRUD, busqueda, segmentacion por tags, tracking de fuente (web, Instagram, WhatsApp, referido, etc.), asignacion a agente
- **Propiedades** - CRUD, 7 tipos de inmueble, 3 operaciones, 6 estados, filtros combinables, galeria de imagenes con upload a MinIO, tags
- **Calendario** - Citas con hora inicio/fin, 5 estados, vinculadas a contacto y propiedad, editar y eliminar
- **Documentos** - Upload a MinIO con presigned URLs, 7 tipos (contrato, escritura, avaluo, etc.), vinculacion a contacto/propiedad, descarga y eliminacion
- **Agentes** - CRUD, vinculado a Clerk user ID, tasa de comision configurable, selector en formularios de contacto y propiedad
- **Busqueda Global** - Busca en contactos, propiedades y citas desde la barra superior

### Marketing

- **Instagram** - Inbox de DMs y comentarios con respuesta, publicar fotos via Graph API, metricas por post (impresiones, alcance, engagement)
- **Facebook** - Posts de la pagina con comentarios y respuesta, publicar en la pagina, insights (impresiones, usuarios activos, seguidores, visitas)
- **WhatsApp** - Enviar mensajes a contacto individual o segmento por tag via Twilio, historial con estado de entrega
- **Email** - Compositor de campanas HTML, enviar a segmento por tag, lista de campanas con conteo de enviados/fallidos
- **TikTok** - Acceso rapido via popup (login, subir video, analiticas, bandeja de entrada)
- **Configuracion** - Tokens de Meta (Instagram Business Account ID, Facebook Page ID), info de Twilio y SMTP

## Base de Datos

14 tablas, 10 enums PostgreSQL:

```
agents              - Perfiles de agentes (vinculados a Clerk)
contacts            - Contactos/leads del CRM
contact_tags        - Relacion M2M contactos <-> tags
tags                - Etiquetas compartidas (contactos + propiedades)
properties          - Listados de propiedades
property_images     - Imagenes en MinIO (propi-media)
property_tags       - Relacion M2M propiedades <-> tags
appointments        - Citas vinculadas a contacto/propiedad/agente
documents           - Archivos en MinIO (propi-documents)
social_accounts     - Tokens de Instagram/Facebook
email_campaigns     - Campanas de email marketing
campaign_recipients - Destinatarios por campana
whatsapp_messages   - Historial de mensajes WhatsApp (Twilio)
```

## Estructura del Proyecto

```
src/
  app/                    # Next.js App Router
    (app)/                # Rutas autenticadas
      agents/             # CRUD de agentes
      calendar/           # Citas y agenda
      contacts/           # Gestion de contactos
      dashboard/          # Panel principal
      documents/          # Documentos y contratos
      marketing/          # Instagram, Facebook, WhatsApp, Email, TikTok
      properties/         # Inventario de propiedades
      search/             # Busqueda global
    sign-in/              # Login (Clerk)
    sign-up/              # Registro (Clerk)
  components/             # Componentes React
    agents/               # Formulario de agentes
    calendar/             # Formulario y acciones de citas
    contacts/             # Formulario y acciones de contactos
    dashboard/            # Calculadora de comisiones
    documents/            # Upload, download, delete
    layout/               # Sidebar, top bar, mobile nav
    marketing/            # Formularios de Instagram, Facebook, WhatsApp, Email
    properties/           # Formulario, galeria de imagenes
    ui/                   # Componentes reutilizables (tag selector)
  lib/                    # Utilidades
    db.ts                 # Conexion PostgreSQL (Drizzle)
    s3.ts                 # Cliente MinIO/S3
    mailer.ts             # Nodemailer (SMTP)
    meta-api.ts           # Meta Graph API wrapper
    utils.ts              # Helpers (cn, formatCurrency, formatDate)
  server/
    actions/              # Server Actions (12 archivos)
    schema.ts             # Schema Drizzle (14 tablas)
  middleware.ts           # Clerk auth middleware
  sw.ts                   # Service worker (Serwist)
```

## Infraestructura

Diseñado para correr en Hetzner Cloud via Coolify:

- **App Plane** (10.0.1.30) - Contenedor Next.js standalone
- **Data Plane** (10.0.1.20) - PostgreSQL 16 + PgBouncer + Redis 7 + MinIO
- **DB:** `propi` | **Redis DB:** 3 | **MinIO:** `propi-media`, `propi-documents`

## Deploy

```bash
# Build de produccion
npm run build

# El output standalone esta en .next/standalone
# Copiar public/ y .next/static/ al directorio standalone
# Ejecutar con: node .next/standalone/server.js
```

En Coolify: crear proyecto apuntando a este repo, configurar las variables de entorno, y Coolify se encarga del build y deploy automatico.

## Licencia

MIT
