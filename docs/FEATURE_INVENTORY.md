# Feature Inventory — Propi CRM

**Fecha:** Mayo 2026  
**Fuente:** Auditoría completa del codebase + landing page (`/`)  
**Leyenda:** ✅ en landing · ❌ no está en landing · 🔒 feature flag (ENABLE_META_INBOX)

---

## 1. CRM Core

### 1.1 Contactos (`/contacts`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Lista con búsqueda por nombre, email, teléfono | ✅ Landing |
| Tags de colores para segmentar (comprador, vendedor, arrendatario…) | ✅ Landing |
| Fuente de origen (Instagram, WhatsApp, referido, portal, walk-in…) | ✅ Landing |
| Tap-to-call directo desde la lista (swipe izquierdo) | ✅ Landing |
| Preferencias de búsqueda: tipo, ciudad, operación, presupuesto máximo | ❌ No en landing |
| Notas privadas por contacto | ❌ No en landing |
| Timeline de actividad (historial de todo lo que pasó con ese contacto) | ❌ No en landing |
| Importar desde CSV | ❌ No en landing |
| Importar desde vCard (.vcf) | ❌ No en landing |
| Importar directamente del teléfono (Contact Picker API, Chrome Android) | ❌ No en landing |
| Fecha de cumpleaños con notificación automática | ❌ No en landing |
| Vista detalle con citas y documentos vinculados | ❌ No en landing |

### 1.2 Propiedades (`/properties`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Inventario de apartamentos, casas, terrenos, comerciales, oficinas, bodegas | ✅ Landing |
| Precio en USD o VES | ✅ Landing |
| Galería de fotos con upload directo (almacenadas en MinIO privado) | ✅ Landing |
| Filtros combinables: tipo, operación, estado, precio | ✅ Landing |
| GPS / coordenadas (latitud/longitud) | ❌ No en landing |
| Estados de gestión: borrador, activa, reservada, vendida, arrendada, inactiva | ❌ No en landing |
| Precio de cierre y comisión pactada al cerrar | ❌ No en landing |
| Publicar/despublicar con un toggle (status público) | ❌ No en landing |
| Página pública sin login (`/p/{id}`) para compartir por WhatsApp | ❌ No en landing |
| Comparables automáticos dentro de la propiedad | ❌ No en landing |
| Propiedades compatibles (Matches) dentro del detalle | ❌ No en landing |
| Enviar ficha por email a contacto | ❌ No en landing |
| Swipe-to-reveal en mobile: compartir y editar | ❌ No en landing |

### 1.3 Calendario & Citas (`/calendar`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Crear cita con título, descripción, fecha, hora de fin | ✅ Landing |
| Vincular cita a contacto y a propiedad | ✅ Landing |
| Vista semanal del dashboard con próximas citas | ✅ Landing |
| Vista de lista o calendario (toggle) | ❌ No en landing |
| Estados: programada, confirmada, completada, cancelada, no-show | ❌ No en landing |
| Notificación automática de citas próximas | ❌ No en landing |

### 1.4 Tareas (`/tasks`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Crear recordatorio con fecha límite | ❌ No en landing |
| Vincular a contacto o propiedad | ❌ No en landing |
| Tareas vencidas con alerta en el dashboard | ❌ No en landing |
| Widget de tareas pendientes en el dashboard | ❌ No en landing |
| Notificación automática cuando vence una tarea | ❌ No en landing |

### 1.5 Pipeline (`/pipeline`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Vista Kanban con columnas por etapa del lead | ❌ No en landing |
| Etapas: Nuevo → Contactado → Calificado → Mostrando → Oferta → Cerrado → Perdido | ❌ No en landing |
| Drag & drop entre columnas (desktop) | ❌ No en landing |
| Long-press + drag (mobile) | ❌ No en landing |
| Búsqueda dentro del Kanban | ❌ No en landing |
| Actualización de etapa sincronizada al contacto | ❌ No en landing |

### 1.6 Documentos (`/documents`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Upload de contratos, escrituras, avalúos, planos, facturas | ✅ Landing |
| Vinculación a contacto y a propiedad | ✅ Landing |
| Descarga segura (proxy autenticado, MinIO privado) | ✅ Landing |
| Tipos: contrato, ID, escritura, avalúo, plano, factura, otro | ❌ No en landing |
| Control de cuota de almacenamiento por usuario | ❌ No en landing |

### 1.7 Búsqueda Global (`/search`)
✅ **Mencionado en landing (implícito)**

| Sub-feature | Estado |
|-------------|--------|
| Busca en contactos, propiedades y citas simultáneamente | ✅ Landing (implícito) |
| Barra de búsqueda en el header (mobile y desktop) | ❌ No en landing |

---

## 2. Inteligencia de Mercado

### 2.1 Propi Magic — Chat IA (`/market-analysis`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Chat en lenguaje natural: "¿Cuánto vale un aparta de 80m2 en Altamira?" | ✅ Landing |
| Respuesta con precio promedio, mediana, rango y resumen profesional copiable | ✅ Landing |
| Datos reales de MercadoLibre actualizados diariamente | ✅ Landing |
| Búsquedas guardadas — historial de todas las consultas | ❌ No en landing |

### 2.2 KPIs de Mercado (`/market-analysis/kpis`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Precio promedio y mediana por m² para Caracas, Valencia, Maracaibo | ❌ No en landing |
| Precio por m² desglosado por barrio/urbanización | ❌ No en landing |
| Tendencia de precios mes a mes (gráfico de línea) | ❌ No en landing |
| Inventario disponible por tipo de propiedad | ❌ No en landing |
| Distribución de precios (histograma) | ❌ No en landing |
| Nuevas publicaciones por semana | ❌ No en landing |
| Top vendedores del mercado | ❌ No en landing |
| Condición del inmueble (nuevo vs. usado) | ❌ No en landing |

### 2.3 Tasación de Mercado (`/valuation`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Herramienta independiente: no requiere propiedad en el CRM | ❌ No en landing |
| Ingresa tipo, ciudad, área, habitaciones, baños | ❌ No en landing |
| Devuelve comparables reales de MercadoLibre | ❌ No en landing |
| Precio sugerido, rango, propiedades similares | ❌ No en landing |
| Diseñada para mostrar al cliente en la primera reunión | ❌ No en landing |

---

## 3. Publicación y Portales

### 3.1 Publicar en Portales (dentro de `/properties/{id}`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Texto de publicación pre-generado (título, descripción, precio, características) | ✅ Landing |
| Copia al portapapeles con un tap | ✅ Landing |
| Abre MercadoLibre directamente con deep link | ✅ Landing |
| Abre Wasi directamente | ✅ Landing |
| Abre Facebook Marketplace directamente | ✅ Landing |
| Guarda los links de publicación por portal dentro de Propi | ❌ No en landing |

### 3.2 Compartir Propiedad
❌ **No está en landing como feature independiente**

| Sub-feature | Estado |
|-------------|--------|
| Botón "Compartir" genera link público `/p/{id}` | ❌ No en landing |
| Página pública con fotos, precio, características sin login | ❌ No en landing |
| Funciona en WhatsApp, Instagram Stories, Facebook | ❌ No en landing |

### 3.3 Portal Público del Agente (`/agente/{id}`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Página pública con foto del agente, nombre y todas sus propiedades activas | ❌ No en landing |
| Sin login requerido para verlo | ❌ No en landing |
| Cada propiedad enlaza a su página pública | ❌ No en landing |
| URL compartible: `propi.aikalabs.cc/agente/{id}` | ❌ No en landing |

---

## 4. Reportes y Analytics

### 4.1 Reportes Ejecutivos (`/reports`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Reporte PDF de 5 páginas descargable | ✅ Landing |
| Portada con logo y nombre del agente | ✅ Landing |
| Resumen ejecutivo con KPIs del período | ✅ Landing |
| Listado de transacciones cerradas | ✅ Landing |
| Estado del pipeline por etapa | ✅ Landing |
| Inventario activo | ✅ Landing |
| Filtro por período: mes, trimestre, año o rango custom | ❌ No en landing |
| Compartir métricas con broker por email (invitación con permisos granulares) | ❌ No en landing |

### 4.2 Ficha de Propiedad PDF
❌ **No está en landing como feature independiente**

| Sub-feature | Estado |
|-------------|--------|
| PDF individual por propiedad con fotos y datos | ❌ No en landing |
| Incluye branding del agente | ❌ No en landing |
| Descarga desde el detalle de la propiedad | ❌ No en landing |

### 4.3 Dashboard con Métricas (`/dashboard`)
✅ **Mencionado en landing (parcialmente)**

| Sub-feature | Estado |
|-------------|--------|
| Total de propiedades con gráfico de barras por tipo | ✅ Landing |
| Contactos últimos 6 meses con gráfico de área | ✅ Landing |
| Ventas cerradas vs. reservadas | ✅ Landing |
| Citas de la semana con gráfico de columnas por día | ✅ Landing |
| Próximas 4 citas | ✅ Landing |
| Actividad reciente | ✅ Landing |
| Widget de tareas pendientes | ❌ No en landing |
| Resumen rápido: activas, pipeline, ventas, citas | ❌ No en landing |

---

## 5. Herramientas Financieras

### 5.1 Simulador de Comisiones (`/commissions`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Calcula comisión bruta a partir del precio y el porcentaje | ❌ No en landing |
| Split con agencia configurable (ej. 50/50, 60/40) | ❌ No en landing |
| Comisión neta del agente | ❌ No en landing |
| IVA venezolano (16%) opcional | ❌ No en landing |
| Funciona para venta y alquiler | ❌ No en landing |
| Cálculo en tiempo real, sin tocar el servidor | ❌ No en landing |

---

## 6. Matches — Motor de Compatibilidad (`/matches`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Cruza automáticamente propiedades activas con preferencias de contactos | ❌ No en landing |
| Muestra qué contactos son compatibles con cada propiedad | ❌ No en landing |
| Compatible por: tipo, operación, ciudad, presupuesto | ❌ No en landing |
| Acción rápida: llamar o enviar email al match directamente | ❌ No en landing |

---

## 7. Marketing Digital

### 7.1 Instagram (`/marketing/instagram`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Publicación asistida: abre Instagram con instrucciones | ✅ Landing |
| Inbox de DMs (requiere Meta API / feature flag) | 🔒 |
| Últimas 6 fotos del perfil (requiere Meta API) | 🔒 |
| Métricas de publicaciones (requiere Meta API) | 🔒 |

### 7.2 Facebook (`/marketing/facebook`)
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Publicación asistida: abre Facebook Business Suite | ✅ Landing |
| Publicar directamente en página de Facebook (requiere Meta API) | 🔒 |
| Insights de la página (requiere Meta API) | 🔒 |

### 7.3 Inbox Unificado de Meta (`/marketing/inbox`)
🔒 **Requiere feature flag — no en landing**

| Sub-feature | Estado |
|-------------|--------|
| Mensajes de Instagram + Facebook en una sola pantalla | 🔒 |
| Responder DMs directamente desde Propi | 🔒 |
| Estado de conversaciones (leído/no leído) | 🔒 |

### 7.4 TikTok (`/marketing/tiktok`)
❌ **No está en landing**

| Sub-feature | Estado |
|-------------|--------|
| Acceso rápido a TikTok con botón de lanzamiento | ❌ No en landing |
| Sin API de TikTok (requiere aprobación especial, en roadmap) | ❌ No en landing |

### 7.5 WhatsApp
✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Compartir propiedad vía WhatsApp con un tap desde la lista | ✅ Landing |
| Link directo con mensaje pre-redactado y foto | ✅ Landing |
| Plantilla configurable de mensaje | ❌ No en landing |

---

## 8. PWA — App Sin App Store

✅ **Mencionado en landing**

| Sub-feature | Estado |
|-------------|--------|
| Instalable desde Chrome (Android) y Safari (iOS) sin App Store | ✅ Landing |
| Funciona offline: contactos, propiedades y citas accesibles sin señal | ✅ Landing |
| Splash screen con animación al abrir | ❌ No en landing |
| Notificaciones push (tareas, citas, cumpleaños) | ❌ No en landing |
| Pull-to-refresh nativo | ❌ No en landing |
| Status bar inmersiva (iOS black-translucent) | ❌ No en landing |
| Shortcuts de pantalla de inicio (Tasación, Nueva Propiedad, Contactos, Agenda) | ❌ No en landing |

---

## 9. Sistema — Infraestructura Visible al Usuario

| Feature | Estado |
|---------|--------|
| Autenticación con Google o email/contraseña (Clerk) | ❌ No en landing (FAQ sí) |
| Modo claro / modo oscuro con persistencia | ❌ No en landing |
| Período de prueba de 7 días | ❌ No en landing |
| Modelo de precios por seat (usuario) | ❌ No en landing (FAQ sí) |
| Almacenamiento privado con cuota por usuario | ❌ No en landing |

---

## Resumen de Gaps — Features en el App Ausentes en el Landing

| # | Feature | Impacto comercial |
|---|---------|------------------|
| 1 | **Pipeline / Kanban de leads** | Alto — diferenciador de CRM |
| 2 | **KPIs de Mercado** | Alto — datos de toda la ciudad |
| 3 | **Tasación de Mercado** | Alto — herramienta para primera reunión con cliente |
| 4 | **Simulador de Comisiones** | Alto — relevante para todo agente |
| 5 | **Portal Público del Agente** | Alto — marketing personal del agente |
| 6 | **Matches automáticos** | Alto — diferenciador único |
| 7 | **Tareas con notificaciones** | Medio — gestión de negocio |
| 8 | **Ficha PDF individual de propiedad** | Medio — uso profesional |
| 9 | **Búsquedas guardadas (Propi Magic)** | Medio — retención de datos |
| 10 | **Compartir propiedad (página pública)** | Medio — uso diario |
| 11 | **Importar contactos (CSV, vCard, teléfono)** | Medio — onboarding |
| 12 | **Notas + timeline de actividad por contacto** | Medio — seguimiento |
| 13 | **TikTok** | Bajo — acceso rápido |
| 14 | **Modo oscuro/claro** | Bajo — polish |
| 15 | **PWA: splash, shortcuts, notificaciones** | Bajo — detalle técnico |
