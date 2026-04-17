# Propi - Distribucion Web vs PWA Mobile

## Principio

Web-first. La PWA mobile es un companion para el agente en campo, no una replica del desktop.

## PWA Mobile (bottom nav)

Lo que el agente usa con el telefono en la calle, entre visitas, en el carro:

| Tab | Feature | Interaccion |
|-----|---------|-------------|
| **Inbox** | Chat unificado IG/FB/WA | Ver conversaciones, responder mensajes, filtrar por canal |
| **Contactos** | Lista de contactos | Ver, buscar, llamar (tap to call), ver detalle basico |
| **Inmuebles** | Propiedades del cliente | Ver listado, ver detalle, **boton compartir por WA/IG/FB** |
| **Agenda** | Calendario de citas | Ver proximas citas, crear cita rapida |
| **Mas...** | Drawer con acceso a todo | Dashboard, documentos, marketing, configuracion |

### Que NO esta en el mobile:
- Dashboard completo con KPIs (va en "Mas...")
- CRUD completo de propiedades (crear, editar, subir fotos)
- Documentos (upload, gestion)
- Email marketing (compositor, campanas)
- Instagram/Facebook (publicar contenido, metricas)
- Publicacion en portales (Wasi, MercadoLibre)
- Configuracion de cuentas sociales
- Busqueda avanzada con filtros

### Feature especial mobile: Compartir Propiedad
Desde el detalle de una propiedad, boton "Compartir" que abre un menu con:
- Compartir por WhatsApp (genera mensaje con titulo, precio, link)
- Compartir por Instagram DM
- Compartir por Facebook Messenger
- Copiar link

## Web Desktop (sidebar completa)

Todo el CRM completo. El agente sentado en la oficina con pantalla grande:

### CRM Core
- **Dashboard** - KPIs, canales de marketing, citas, comisiones, actividad reciente
- **Contactos** - CRUD completo, tags, segmentacion, fuente, busqueda avanzada
- **Propiedades** - CRUD completo, galeria de fotos, filtros, GPS, multi-moneda
- **Calendario** - Vista mensual, crear/editar/eliminar citas, vincular a contacto/propiedad
- **Documentos** - Upload, descarga, vincular a contacto/propiedad, tipos
- **Busqueda Global** - Busca en contactos, propiedades, citas

### Marketing (solo web)
- **Inbox** - Mismo inbox unificado pero con mas espacio (sidebar + chat)
- **Instagram** - Publicar fotos, ver metricas, comentar en posts
- **Facebook** - Publicar en pagina, insights, comentar
- **Email** - Compositor de campanas HTML, enviar a segmentos
- **TikTok** - Acceso rapido via popup
- **Configuracion** - Tokens de Meta, Wasi credentials

### Portales (solo web)
- **Wasi** - Publicar propiedades con 1 click (implementado)

## Navegacion

### Mobile Bottom Nav (5 items)
```
[ Inbox ] [ Contactos ] [ Inmuebles ] [ Agenda ] [ Mas... ]
```

### Mobile Drawer (desde "Mas...")
```
Dashboard
Documentos
---
Marketing
  Inbox (link al mismo)
  Instagram
  Facebook
  Email
  TikTok
  Configuracion
---
Busqueda
```

### Desktop Sidebar
```
CRM
  Dashboard
  Contactos
  Propiedades
  Calendario
  Documentos

Marketing
  Inbox
  Instagram
  Facebook
  Email
  TikTok
  Configuracion
```

## Justificacion

Basado en como operan los CRM inmobiliarios lideres en 2026:

- **Follow Up Boss** (EEUU, #1): Web completo, app mobile solo contactos/calendario/inbox/deals
- **Rechat** (EEUU, moderno): Web completo + IA, mobile solo contactos/calendario/tareas/chat IA
- **Clientify** (LATAM, partner Meta): Web completo, mobile solo inbox WhatsApp + contactos basicos
- **Aurora Inbox** (LATAM): Web completo, mobile solo inbox WhatsApp

El patron es claro: **mobile = comunicacion + consulta rapida**, **web = gestion completa + marketing + analytics**.

## Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **PWA:** Service worker manual (0 dependencias), manifest.json
- **Chat UI:** Chatscope (inbox unificado)
- **Auth:** Clerk (modelo por seat)
- **DB:** PostgreSQL + Drizzle ORM
- **Storage:** MinIO (S3-compatible)
- **Messaging:** Meta Graph API (IG + FB + WA Cloud API)
- **Email:** Resend (API, free tier 3K/mes)
