# Propi - Estructura de UI: PWA Mobile y Web Dashboard

## Resumen

Propi tiene una sola codebase (Next.js 16) que sirve dos experiencias:

- **Web Dashboard** (desktop, >=768px): CRM completo con sidebar, todos los modulos
- **PWA Mobile** (<768px): companion para el agente en campo, features reducidos

La diferencia no es codigo separado. Es la misma app con navegacion diferente segun el viewport.

---

## PWA Mobile

### Que ve el agente en el telefono

```
┌─────────────────────────────┐
│  Top Bar                    │
│  [≡ Menu]  [🔍 Buscar]  [👤]│
├─────────────────────────────┤
│                             │
│                             │
│     Contenido de la         │
│     pagina activa           │
│                             │
│                             │
├─────────────────────────────┤
│  Bottom Nav                 │
│  💬    👥    🏠    📅    ≡   │
│ Inbox Cont. Inm. Agenda Mas│
└─────────────────────────────┘
```

### Bottom Nav (5 tabs, siempre visible)

| Posicion | Icono | Label | Ruta | Que hace |
|----------|-------|-------|------|----------|
| 1 | MessageCircle | Inbox | `/marketing/inbox` | Chat unificado IG/FB/WA. Responder mensajes. |
| 2 | Users | Contactos | `/contacts` | Lista de contactos. Buscar. Tap para llamar. |
| 3 | Building2 | Inmuebles | `/properties` | Ver propiedades. Detalle. **Boton Compartir**. |
| 4 | Calendar | Agenda | `/calendar` | Ver citas. Crear cita rapida. |
| 5 | Menu | Mas | (abre drawer) | Acceso a todo lo demas. |

### Drawer "Mas..." (se abre desde bottom nav o hamburger del top bar)

```
┌──────────────────────┐
│ 🏠 Propi          [X]│
├──────────────────────┤
│ 📊 Dashboard         │
│ 📄 Documentos        │
│ 🔍 Busqueda          │
├──────────────────────┤
│ MARKETING            │
│ 📸 Instagram         │
│ 📘 Facebook          │
│ ✉️  Email             │
│ 🎵 TikTok            │
│ ⚙️  Configuracion     │
└──────────────────────┘
```

### Feature especial mobile: Compartir Propiedad

En el detalle de cada propiedad (`/properties/[id]`), boton verde "Compartir" que abre:

```
┌─────────────────────────┐
│ Compartir propiedad  [X]│
├─────────────────────────┤
│ 💬 WhatsApp  📸 Instagram│
│ 📘 Facebook  🔗 Copiar   │
└─────────────────────────┘
```

Cada opcion genera un mensaje con:
- Titulo de la propiedad
- Precio formateado
- Ciudad
- URL directa a la propiedad

WhatsApp abre `wa.me/?text=...`, Instagram abre `ig.me/m/`, Facebook abre el sharer, Copiar Link copia al clipboard.

### Que NO se ve en mobile (solo via drawer)

- Dashboard completo con KPIs y graficos
- Crear/editar propiedades (formulario completo con fotos)
- Gestion de documentos (upload, vincular)
- Email marketing (compositor HTML, campanas)
- Publicar en Instagram/Facebook
- Metricas de redes sociales
- Configuracion de cuentas
- Busqueda avanzada con filtros

### Loading States (mobile)

Cada pagina principal tiene `loading.tsx` con skeleton animado:
- Contactos: filas con avatar placeholder
- Propiedades: grid de cards placeholder
- Calendario: filas placeholder
- Inbox: sidebar + area de chat placeholder
- Dashboard: grid de cards grandes
- Documentos: filas placeholder

### Error Handling (mobile)

- `error.tsx`: pantalla con icono de error, mensaje "Algo salio mal", boton "Intentar de nuevo", link "Ir al inicio"
- `not-found.tsx`: pantalla con icono de busqueda, mensaje "Pagina no encontrada", link al dashboard

---

## Web Dashboard

### Que ve el agente en la computadora

```
┌──────┬──────────────────────────────────────────┐
│      │  Top Bar                                  │
│      │  [🔍 Buscar contactos, propiedades...]  [👤]│
│  S   ├──────────────────────────────────────────┤
│  I   │                                          │
│  D   │                                          │
│  E   │     Contenido de la pagina activa        │
│  B   │     (area completa, sin bottom nav)      │
│  A   │                                          │
│  R   │                                          │
│      │                                          │
└──────┴──────────────────────────────────────────┘
```

### Sidebar Desktop (siempre visible, colapsable a iconos)

```
┌──────────────────────┐
│ 🏠 Propi             │
├──────────────────────┤
│ CRM                  │
│ 📊 Dashboard         │
│ 👥 Contactos         │
│ 🏠 Propiedades       │
│ 📅 Calendario        │
│ 📄 Documentos        │
├──────────────────────┤
│ MARKETING            │
│ 💬 Inbox             │
│ 📸 Instagram         │
│ 📘 Facebook          │
│ ✉️  Email             │
│ 🎵 TikTok            │
│ ⚙️  Configuracion     │
├──────────────────────┤
│ [◀ Colapsar]         │
└──────────────────────┘
```

### Paginas Web (todas las rutas)

#### CRM Core
| Ruta | Pagina | Funcionalidad |
|------|--------|---------------|
| `/dashboard` | Dashboard | KPIs (contactos, propiedades activas, citas), canales de marketing, proximas citas, calculadora de comisiones, propiedades recientes, contactos recientes |
| `/contacts` | Lista contactos | Busqueda, lista con tags, fuente, avatar |
| `/contacts/new` | Crear contacto | Formulario: nombre, email, tel, empresa, fuente, tags, notas |
| `/contacts/[id]` | Detalle contacto | Info, tags, notas, citas vinculadas, tap-to-call, tap-to-email |
| `/contacts/[id]/edit` | Editar contacto | Mismo formulario pre-poblado |
| `/properties` | Lista propiedades | Grid con cards, filtros (tipo, operacion, estado, precio), busqueda |
| `/properties/new` | Crear propiedad | Formulario completo: titulo, tipo, operacion, estado, precio, moneda, area, hab, banos, parqueaderos, direccion, ciudad, GPS, descripcion, tags |
| `/properties/[id]` | Detalle propiedad | Galeria de imagenes, specs, tags, **boton Compartir**, editar, eliminar |
| `/properties/[id]/edit` | Editar propiedad | Mismo formulario pre-poblado |
| `/calendar` | Calendario | Vista mensual agrupada por dia, crear/editar/eliminar citas |
| `/calendar/new` | Crear cita | Titulo, inicio, fin, estado, ubicacion, contacto, propiedad, notas |
| `/calendar/[id]/edit` | Editar cita | Mismo formulario pre-poblado |
| `/documents` | Documentos | Lista con tipo, tamano, contacto/propiedad vinculados, descarga, eliminar |
| `/search` | Busqueda global | Resultados de contactos, propiedades, citas |

#### Marketing (solo web recomendado)
| Ruta | Pagina | Funcionalidad |
|------|--------|---------------|
| `/marketing/inbox` | Inbox unificado | Chatscope: ConversationList + ChatContainer, filtros IG/FB/WA, unread badges, date separators |
| `/marketing/inbox/[id]` | Conversacion directa | Deep-link a una conversacion especifica |
| `/marketing/instagram` | Instagram | Posts recientes, DMs, comentar, stats |
| `/marketing/instagram/publish` | Publicar en IG | URL de imagen + caption |
| `/marketing/instagram/metrics` | Metricas IG | Impresiones, alcance, engagement por post |
| `/marketing/facebook` | Facebook | Posts de la pagina, comentarios, publicar |
| `/marketing/facebook/publish` | Publicar en FB | Texto + link opcional |
| `/marketing/facebook/insights` | Insights FB | Impresiones, usuarios activos, seguidores |
| `/marketing/email` | Email marketing | Lista de campanas con estado y conteo |
| `/marketing/email/new` | Nueva campana | Compositor HTML, seleccionar segmento por tag |
| `/marketing/tiktok` | TikTok | Botones popup: login, subir video, analiticas, bandeja |
| `/marketing/settings` | Configuracion | Tokens Meta (IG, FB, WA), info SMTP |

#### Sistema
| Ruta | Pagina | Funcionalidad |
|------|--------|---------------|
| `/` | Landing | Pagina publica, no requiere auth |
| `/sign-in` | Login | Clerk sign-in |
| `/sign-up` | Registro | Clerk sign-up |
| `/api/webhooks/meta` | Webhook | Recibe mensajes entrantes de IG/FB/WA |

---

## Componentes

### Layout
| Componente | Archivo | Donde se usa |
|-----------|---------|-------------|
| AppShell | `layout/app-shell.tsx` | Layout de `(app)/` - orquesta sidebar + topbar + mobile nav |
| Sidebar | `layout/sidebar.tsx` | Desktop: sidebar colapsable con CRM + Marketing |
| TopBar | `layout/top-bar.tsx` | Barra superior con busqueda global + UserButton |
| MobileNav | `layout/mobile-nav.tsx` | Bottom nav: Inbox, Contactos, Inmuebles, Agenda, Mas |
| MobileSidebar | `layout/mobile-sidebar.tsx` | Drawer: Dashboard, Docs, Busqueda, Marketing |

### CRM
| Componente | Archivo | Funcion |
|-----------|---------|---------|
| ContactForm | `contacts/contact-form.tsx` | Crear/editar contacto con tags |
| DeleteContactButton | `contacts/delete-contact-button.tsx` | Eliminar con confirmacion |
| PropertyForm | `properties/property-form.tsx` | Crear/editar propiedad con tags |
| PropertyImageUpload | `properties/property-image-upload.tsx` | Upload de imagenes a MinIO |
| SharePropertyButton | `properties/share-property-button.tsx` | Compartir por WA/IG/FB/Link |
| DeletePropertyButton | `properties/delete-property-button.tsx` | Eliminar con confirmacion |
| AppointmentForm | `calendar/appointment-form.tsx` | Crear/editar cita |
| DeleteAppointmentButton | `calendar/delete-appointment-button.tsx` | Eliminar con confirmacion |
| UploadDocumentButton | `documents/upload-document-button.tsx` | Upload con tipo + vincular |
| DocumentActions | `documents/document-actions.tsx` | Descargar + eliminar |
| CommissionCalculator | `dashboard/commission-calculator.tsx` | Calculadora interactiva |

### Marketing
| Componente | Archivo | Funcion |
|-----------|---------|---------|
| UnifiedInbox | `inbox/unified-inbox.tsx` | Chatscope: conversaciones + chat + filtros |
| IgInboxTabs | `marketing/instagram/inbox-tabs.tsx` | Tabs DMs + Posts |
| IgReplyForm | `marketing/instagram/ig-reply-form.tsx` | Responder DM o comentar |
| PublishIgForm | `marketing/instagram/publish-ig-form.tsx` | Publicar foto en IG |
| FbReplyForm | `marketing/facebook/fb-reply-form.tsx` | Comentar en post FB |
| PublishFbForm | `marketing/facebook/publish-fb-form.tsx` | Publicar en pagina FB |
| CampaignComposer | `marketing/email/campaign-composer.tsx` | Compositor de email HTML |
| SocialAccountForm | `marketing/social-account-form.tsx` | Conectar IG/FB/WA tokens |
| TikTokLaunchButton | `marketing/tiktok-launch-button.tsx` | Popup a TikTok |

### UI Compartidos
| Componente | Archivo | Funcion |
|-----------|---------|---------|
| TagSelector | `ui/tag-selector.tsx` | Seleccionar + crear tags inline |
| SkeletonPage/Row/Card | `ui/skeleton.tsx` | Loading states animados |
| ServiceWorkerRegister | `sw-register.tsx` | Registra SW en produccion |

---

## Flujo del usuario

### Mobile (agente en campo)

```
Abre la app (PWA instalada)
    |
    v
/marketing/inbox (Inbox - primer tab)
    |
    ├── Ve mensaje de WhatsApp de Maria
    ├── Responde "Si, la propiedad esta disponible"
    ├── Toca tab "Inmuebles"
    |       |
    |       v
    |   /properties (lista de propiedades)
    |       |
    |       ├── Busca "Apto 302"
    |       ├── Abre detalle
    |       ├── Toca "Compartir" > "WhatsApp"
    |       └── Se abre WhatsApp con el mensaje pre-armado
    |
    ├── Toca tab "Agenda"
    |       |
    |       v
    |   /calendar (proximas citas)
    |       |
    |       └── Ve que tiene visita a las 3pm
    |
    └── Toca tab "Contactos"
            |
            v
        /contacts (lista)
            |
            ├── Busca "Carlos"
            ├── Toca el telefono > llama directo
            └── Ve las citas vinculadas
```

### Web (agente en oficina)

```
Abre propi.app en el navegador
    |
    v
/dashboard (panel principal)
    |
    ├── Ve KPIs: 1,250 contactos, 320 activas, 8 citas
    ├── Ve canales: IG conectado, FB conectado, WA conectado
    ├── Ve proximas citas
    ├── Usa calculadora de comisiones
    |
    ├── Click "Contactos" en sidebar
    |       |
    |       v
    |   /contacts > /contacts/new (crea contacto completo)
    |
    ├── Click "Propiedades" en sidebar
    |       |
    |       v
    |   /properties > /properties/new (crea propiedad con fotos, GPS, etc.)
    |
    ├── Click "Inbox" en sidebar
    |       |
    |       v
    |   /marketing/inbox (chat completo con sidebar de conversaciones)
    |
    ├── Click "Instagram" en sidebar
    |       |
    |       v
    |   /marketing/instagram > /marketing/instagram/publish (publica foto)
    |   /marketing/instagram/metrics (ve metricas)
    |
    ├── Click "Email" en sidebar
    |       |
    |       v
    |   /marketing/email > /marketing/email/new (crea campana HTML)
    |
    └── Click "Configuracion" en sidebar
            |
            v
        /marketing/settings (conecta tokens de Meta, ve SMTP)
```

---

## PWA: Archivos clave

| Archivo | Funcion |
|---------|---------|
| `public/manifest.json` | Nombre, iconos, start_url=/dashboard, display=standalone, theme=#0A2B1D |
| `public/sw.js` | Service worker manual: cache-first assets, network-first pages, offline fallback |
| `public/icons/icon-192.png` | Icono PWA 192x192 |
| `public/icons/icon-512.png` | Icono PWA 512x512 |
| `src/components/sw-register.tsx` | Registra SW en produccion, check updates cada 60min |
| `src/app/layout.tsx` | Viewport meta, themeColor, manifest link, appleWebApp meta |

### Service Worker estrategias

| Tipo de request | Estrategia | Razon |
|----------------|-----------|-------|
| `/_next/static/*` (JS, CSS) | Cache-first | Assets inmutables, versionados por hash |
| `/icons/*`, imagenes, fonts | Cache-first | Cambian raramente |
| Paginas HTML | Network-first + cache fallback | Siempre intenta datos frescos, sirve cache si offline |
| `/api/*`, `/sign-in`, `/sign-up` | Network-only | Nunca cachear auth ni API |
| Offline fallback | Sirve `/dashboard` cacheado | Cualquier ruta de app sin red muestra el ultimo dashboard |
