# Visual Roadmap — PWA Quality & Cross-Device Robustness

**Generado:** Mayo 2026  
**Alcance:** Análisis forense del codebase contrastado contra el estado real del código.  
**Metodología:** Cada ítem fue verificado leyendo los archivos fuente antes de incluirse. Los puntos descartados se anotan al final de cada sprint con la razón.

---

## Índice

- [Sprint 1 — CSS Foundations](#sprint-1--css-foundations)
- [Sprint 2 — Touch & Scroll](#sprint-2--touch--scroll)
- [Sprint 3 — Forms & Input UX](#sprint-3--forms--input-ux)
- [Sprint 4 — PWA / iOS Meta](#sprint-4--pwa--ios-meta)
- [Sprint 5 — Service Worker](#sprint-5--service-worker)
- [Sprint 6 — Performance & Streaming](#sprint-6--performance--streaming)
- [Descartados / No aplican](#descartados--no-aplican)

---

## Sprint 1 — CSS Foundations

**Alcance:** Cambios solo en `globals.css` y CSS de componentes. Sin tocar lógica de React.  
**Riesgo:** Mínimo — solo visual/rendering.

---

### 1.1 · `color-scheme` no declarado

**Estado actual:** `globals.css` no declara `color-scheme` en ningún selector.

**Impacto:** Los controles nativos del browser (scrollbars, `<select>`, `<input type="date">`, `<input type="number">` spinners) usan el `color-scheme` del sistema operativo, no el del app. En Android Chrome en dark mode del sistema, algunos controles aparecen con fondo blanco sobre el fondo oscuro del app. En iOS Safari, el teclado numérico puede mostrar fondo incorrecto.

**Causa raíz:** La spec CSS `color-scheme` indica al browser qué esquema de colores soporta el documento. Sin esto, el browser puede renderizar controles nativos en un esquema diferente al que visualmente presenta el app.

**Solución:**
```css
/* globals.css — agregar en :root */
:root {
  color-scheme: dark;
}

/* Cuando el usuario activa el tema claro */
.light {
  color-scheme: light;
}
```

**Archivos:** `src/app/globals.css`  
**Líneas cambiadas:** ~4 líneas

---

### 1.2 · `will-change: transform` permanente en `.card-shadow`

**Estado actual:** `globals.css` línea 107:
```css
.card-shadow {
  will-change: transform; /* ← siempre activo */
}
```

**Impacto:** `will-change: transform` promueve cada elemento a su propia capa del compositor GPU. En páginas con muchas cards (lista de propiedades, contactos con 50+ items, dashboard), cada card ocupa su propio framebuffer en VRAM. En Android gama media-baja (Snapdragon 665, Samsung A12, Redmi 9 — muy comunes en LATAM) esto agota la VRAM disponible y causa jank visible durante el scroll.

**Causa raíz:** `will-change` fue pensado para activarse *justo antes* de una animación. Dejarlo activo permanentemente niega su propósito — el browser ya promovió el layer, no hay nada que "preparar".

**Solución:** Mover `will-change` a `:hover` y usar `@media (hover: hover)` para que solo se active en dispositivos con cursor real (no touch):

```css
.card-shadow {
  /* will-change removido del estado base */
  transition: transform 0.2s ease;
  contain: layout style paint;
}

/* Solo preparar el layer cuando hay intención real de animar (desktop con cursor) */
@media (hover: hover) {
  .card-shadow:hover {
    will-change: transform;
  }
}
```

**Archivos:** `src/app/globals.css`  
**Líneas cambiadas:** ~6 líneas

---

## Sprint 2 — Touch & Scroll

**Alcance:** Mejoras en la capa de gestos táctiles. Afecta `SwipeAction` y `PullToRefresh`.  
**Riesgo:** Bajo — cambios quirúrgicos en los componentes de gestos.

---

### 2.1 · `touch-action: pan-y` faltante en `SwipeAction`

**Estado actual:** El div swipeable en `swipe-action.tsx` (línea ~195) no tiene `touchAction`:
```tsx
<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  style={{
    transform: `translateX(${offset}px)`,
    transition: isSwiping ? "none" : "transform 0.25s ease-out",
    /* ← falta touchAction: "pan-y" */
  }}
>
```

**Nota:** `globals.css` ya tiene `touch-action: pan-y` en el selector `main` para `@media (pointer: coarse)`. Esto aplica al contenedor grande pero NO al elemento individual del swipe. El browser necesita la declaración en el elemento que recibe los eventos táctiles para optimizar la decisión scroll-vs-swipe.

**Impacto:** Sin `touch-action: pan-y`, el browser Chrome en Android (especialmente Samsung Internet) inicia un timer de ~100ms para determinar si el gesto es scroll vertical o swipe horizontal. Esto crea un lag perceptible al inicio de cada swipe. En iOS Safari el comportamiento es más robusto porque el browser ya tiene el handler de touch registrado, pero aun así el `touch-action` mejora la respuesta.

**Causa raíz:** `touch-action: pan-y` le dice al browser explícitamente que el eje horizontal es manejado por JavaScript, permitiéndole iniciar el scroll vertical de forma nativa sin esperar al resultado del handler.

**Solución:**
```tsx
<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  style={{
    transform: `translateX(${offset}px)`,
    transition: isSwiping ? "none" : "transform 0.25s ease-out",
    // Tells the browser that vertical pan is native-handled, horizontal
    // is JavaScript-controlled. Eliminates the ~100ms disambiguation
    // delay on Android Chrome / Samsung Internet before swipe starts.
    touchAction: "pan-y",
  }}
>
```

**Archivos:** `src/components/ui/swipe-action.tsx`  
**Líneas cambiadas:** 1 línea

---

### 2.2 · `will-change: transform` estático en `PullToRefresh`

**Estado actual:** `pull-to-refresh.tsx` línea 189:
```tsx
<div ref={contentRef} style={{ willChange: "transform" }}>
```

**Impacto:** El `will-change: transform` está activo permanentemente, no solo durante el gesto de pull. Esto crea una nueva stacking context de forma persistente, lo que tiene dos efectos negativos:
1. Los elementos `position: fixed` (TopBar, MobileNav) que visualmente están "encima" del contenido se vuelven parte de un stacking context diferente — si algún z-index no coincide exactamente, pueden aparecer debajo del contenido.
2. El contenido de la página ocupa su propia capa de compositor GPU permanentemente, ~8-15MB en páginas con muchas imágenes.

**Causa raíz:** `will-change` debe activarse solo cuando el elemento está a punto de ser animado y desactivarse cuando la animación termina.

**Solución:** Activar/desactivar `will-change` por DOM directo en las refs de los event handlers, sin causar re-renders:

```tsx
// En handleTouchStart — cuando el gesto inicia:
const handleTouchStart = (e: TouchEvent) => {
  if (window.scrollY > 0 || refreshing) return;
  startY.current = e.touches[0].clientY;
  pulling.current = true;
  if (contentRef.current) {
    contentRef.current.style.willChange = "transform";
    contentRef.current.style.transition = "";
  }
};

// En resetDOM — cuando el gesto termina:
const resetDOM = useCallback(() => {
  if (contentRef.current) {
    contentRef.current.style.transition = "transform 0.3s ease-out";
    contentRef.current.style.transform = "";
    contentRef.current.style.willChange = "auto"; // ← liberar layer
    // ...
  }
}, []);
```

Y en el JSX, quitar el `willChange` del inline style:
```tsx
<div ref={contentRef}>  {/* sin style={{ willChange: "transform" }} */}
```

**Archivos:** `src/components/ui/pull-to-refresh.tsx`  
**Líneas cambiadas:** ~8 líneas

---

## Sprint 3 — Forms & Input UX

**Alcance:** Correcciones sistemáticas en inputs de formularios. Afecta 4 archivos.  
**Riesgo:** Bajo — solo visual/atributos HTML.

---

### 3.1 · Inputs con `text-sm` (14px) causan auto-zoom en iOS Safari

**Estado actual:** Todos los inputs de formularios usan `text-sm` (14px):

| Archivo | Inputs afectados |
|---------|-----------------|
| `contacts/page.tsx` | Búsqueda de contactos |
| `properties/page.tsx` | Búsqueda de propiedades |
| `contact-form.tsx` | name, email, phone, company, prefCity, prefBudgetMax, birthDate, notes |
| `property-form.tsx` | title, price, area, bedrooms, bathrooms, etc. |

**Impacto:** iOS Safari hace auto-zoom en cualquier `<input>` con `font-size < 16px` cuando recibe foco. El viewport hace zoom in de forma brusca, luego zoom out al perder foco. En un PWA instalado esto es particularmente molesto porque no hay chrome del browser que lo mitigue. Afecta a todos los iPhones.

**Causa raíz:** Comportamiento de iOS Safari por diseño para mejorar legibilidad. La única forma de prevenirlo es asegurar `font-size >= 16px` en el elemento enfocado.

**Solución:** Aplicar `text-base md:text-sm` en todos los inputs:
- Mobile (< 768px): `text-base` = 16px → sin zoom
- Desktop (≥ 768px): `text-sm` = 14px → diseño denso preservado

Para aplicar de forma consistente sin tocar cada clase individualmente, definir una clase utilitaria en `globals.css`:

```css
/* Utility: input size that prevents iOS Safari auto-zoom while keeping
   desktop density. Apply to all interactive inputs, selects, textareas. */
.input-base {
  font-size: 1rem;    /* 16px — prevents iOS zoom */
}
@media (min-width: 768px) {
  .input-base {
    font-size: 0.875rem; /* 14px — desktop density */
  }
}
```

Y reemplazar `text-sm` → `input-base` en los inputs de los 4 archivos.

**Archivos:** `src/app/globals.css`, `src/app/(app)/contacts/page.tsx`, `src/app/(app)/properties/page.tsx`, `src/components/contacts/contact-form.tsx`, `src/components/properties/property-form.tsx`  
**Líneas cambiadas:** ~30 líneas (sistemático, patron idéntico en cada input)

---

### 3.2 · `autocomplete` ausente en todos los formularios

**Estado actual:** Ningún `<input>` tiene `autocomplete` attribute. Grep confirmó cero matches.

**Impacto:** Sin `autocomplete`, el browser y el gestor de contraseñas/datos del OS no saben cómo categorizar los campos. En iOS Safari y Android Chrome:
- El autofill puede rellenar el campo "empresa" con un nombre, el campo "precio" con un teléfono, etc.
- En el formulario de contacto, el campo `phone` sin `autocomplete="tel"` puede recibir autofill de email en algunos Android.
- En iOS, el campo de búsqueda puede activar el historial de búsqueda del usuario en lugar del historial del app.

**Solución:** Agregar `autocomplete` apropiado a cada input:

```tsx
// contact-form.tsx
<input name="name"    autocomplete="name" ... />
<input name="email"   autocomplete="email" ... />
<input name="phone"   autocomplete="tel" ... />
<input name="company" autocomplete="organization" ... />

// Campos de búsqueda
<input type="search" autocomplete="off" ... />

// Campos numéricos/específicos del app (no queremos autofill aquí)
<input name="price"  autocomplete="off" ... />
<input name="area"   autocomplete="off" ... />
```

**Archivos:** `src/components/contacts/contact-form.tsx`, `src/components/properties/property-form.tsx`, `src/app/(app)/contacts/page.tsx`, `src/app/(app)/properties/page.tsx`  
**Líneas cambiadas:** ~20 líneas

---

### 3.3 · Imágenes de propiedades sin `loading="lazy"`

**Estado actual:** `properties/page.tsx` línea 171:
```tsx
<img
  src={`/api/images/${coverImage.key}`}
  alt={property.title}
  className="h-full w-full object-cover ..."
  /* ← sin loading="lazy" */
/>
```

El `image-carousel.tsx` ya lo hace correctamente (`loading={i === 0 ? "eager" : "lazy"}`). El problema es la lista de propiedades.

**Impacto:** Con 20+ propiedades en la lista, el browser intenta descargar todas las imágenes simultáneamente al cargar la página. En conexiones 4G lentas (o WiFi congestionado) esto degrada el LCP (Largest Contentful Paint) y puede bloquear el render del contenido visible. En Android gama baja con CPU limitada, el decode simultáneo de múltiples imágenes causa jank.

**Solución:**
```tsx
{propertyList.map((property, index) => {
  const coverImage = property.images[0];
  return (
    <img
      src={`/api/images/${coverImage.key}`}
      alt={property.title}
      // First 2 cards are likely above the fold — eager load them.
      // The rest are below the fold — lazy load to defer network requests.
      loading={index < 2 ? "eager" : "lazy"}
      decoding="async"
      className="h-full w-full object-cover ..."
    />
  );
})}
```

**Archivos:** `src/app/(app)/properties/page.tsx`  
**Líneas cambiadas:** ~3 líneas

---

## Sprint 4 — PWA / iOS Meta

**Alcance:** Configuración del manifiesto, meta tags iOS, tema. Archivos de configuración y layout.  
**Riesgo:** Medio — cambios en `layout.tsx` y `manifest.json` afectan el comportamiento del PWA en instalación.

---

### 4.1 · `statusBarStyle: "default"` crea franja blanca bajo el notch en iOS

**Estado actual:** `layout.tsx` línea 34:
```tsx
appleWebApp: {
  capable: true,
  statusBarStyle: "default",  // ← franja opaca
  title: "Propi",
},
```

**Impacto:** Con `statusBarStyle: "default"`, iOS muestra la barra de estado con fondo opaco (blanco/negro según el tema del OS). En Propi con tema dark (`background: #090A0F`), esto crea una franja visiblemente diferente bajo el notch o la Dynamic Island en iPhone 12+. Rompe la inmersión visual del PWA.

**Causa raíz:** `"default"` = status bar opaca que no se integra con el contenido del app.  
`"black-translucent"` = status bar transparente, el contenido del app se extiende bajo ella. Requiere compensar con `padding-top: env(safe-area-inset-top)` para que el contenido no quede tapado.

**Solución:**

En `layout.tsx`:
```tsx
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "Propi",
},
```

En `globals.css` — agregar padding-top para compensar en standalone mode:
```css
@media (display-mode: standalone) {
  body {
    padding-top: env(safe-area-inset-top);
  }
}
```

Y en `app-shell.tsx` — el `TopBar` ya es `position: fixed` con `top-0`, así que no necesita cambios. El `AppShell` ya maneja el `pb-20` para el bottom nav. El `pt-16 md:pt-24` en el main content también sigue siendo correcto.

**Cuidado:** Cambiar a `black-translucent` sin el padding haría que el contenido quede tapado por la barra de estado (notch). Ambos cambios deben ir juntos en el mismo PR.

**Archivos:** `src/app/layout.tsx`, `src/app/globals.css`  
**Líneas cambiadas:** ~6 líneas

---

### 4.2 · `manifest.json` — `"purpose": "any maskable"` combinado

**Estado actual:** `public/manifest.json`:
```json
{
  "src": "/icons/icon-192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any maskable"
}
```

**Impacto:** En Android, las PWA usan el ícono `maskable` para los Adaptive Icons (el ícono se recorta en formas: círculo, squircle, teardrop, etc. según el launcher). Un ícono `maskable` correcto tiene el contenido principal dentro del 80% central (safe zone). Si el logo de Propi tiene elementos en los bordes, aparecerá recortado en Android.

Adicionalmente, Chrome Lighthouse y el auditor de PWA de Google flagea `"any maskable"` combinado como subóptimo — recomienda entradas separadas para mayor compatibilidad.

**Solución:** Crear un ícono dedicado `maskable` (con safe zone de 80%) y separar las entradas:

```json
"icons": [
  {
    "src": "/icons/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/icon-192-maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "/icons/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/icon-512-maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

Los íconos maskable deben tener el logo centrado con ~20% de padding de fondo de color por todos los lados. Herramienta recomendada: https://maskable.app

**Archivos:** `public/manifest.json` + 2 nuevos archivos PNG  
**Complejidad:** Requiere crear los PNGs con el diseñador / generarlos programáticamente.

---

### 4.3 · Tema dark/light no persiste entre sesiones

**Estado actual:** `top-bar.tsx`:
```tsx
function toggleTheme() {
  document.documentElement.classList.toggle("light");
}
```

Solo modifica el DOM. No persiste en `localStorage`. Al reabrir el PWA (o refrescar la página), siempre carga dark.

**Impacto:** El usuario cambia al modo claro, cierra la app, la reabre y vuelve al dark. Esto es particularmente molesto en iOS donde el PWA instalado "duerme" y al volver la pantalla hace un flash del tema incorrecto.

**Causa adicional (FOUC):** Si la preferencia se lee solo en JavaScript (useEffect), hay un flash: la página carga en dark, React hidrata, el useEffect lee localStorage, aplica light → flash visible.

**Solución correcta (no-FOUC):**

En `layout.tsx` — inline script en `<head>` que aplica la clase ANTES del primer paint:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    try {
      var t = localStorage.getItem('propi-theme');
      if (t === 'light') document.documentElement.classList.add('light');
    } catch(e) {}
  })();
` }} />
```

En `top-bar.tsx`:
```tsx
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light");
  try {
    localStorage.setItem("propi-theme", isLight ? "light" : "dark");
  } catch (e) { /* localStorage unavailable (private browsing) */ }
}
```

El `try/catch` alrededor de `localStorage` es necesario — en iOS Safari en modo privado, `localStorage.setItem` lanza una excepción.

**Archivos:** `src/app/layout.tsx`, `src/components/layout/top-bar.tsx`  
**Líneas cambiadas:** ~15 líneas

---

### 4.4 · `maximumScale: 1, userScalable: false` — violación de accesibilidad

**Estado actual:** `layout.tsx`:
```tsx
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
};
```

**Impacto:** WCAG 2.1 Success Criterion 1.4.4 (nivel AA) requiere que el texto sea escalable al 200% sin pérdida de contenido o funcionalidad. `user-scalable=no` viola este criterio. Aunque iOS 10+ ignora esto para pinch-to-zoom iniciado por el usuario, el double-tap zoom sí queda bloqueado. En Android Chrome 100+, esta configuración también es ignorada.

**Causa por la que se añadió:** Prevenir el zoom automático de iOS en inputs. Con el fix del Sprint 3 (todos los inputs a 16px), ya no es necesario.

**Solución:**
```tsx
export const viewport: Viewport = {
  themeColor: "#0A2B1D",
  width: "device-width",
  initialScale: 1,
  // maximumScale and userScalable removed — iOS auto-zoom on inputs is
  // prevented by ensuring all <input> elements have font-size >= 16px.
  // Removing these restrictions restores WCAG 2.1 SC 1.4.4 compliance.
};
```

**Dependencia:** Sprint 3 debe completarse ANTES de este fix para que no vuelva el zoom en inputs.

**Archivos:** `src/app/layout.tsx`  
**Líneas cambiadas:** 2 líneas (eliminar)

---

## Sprint 5 — Service Worker

**Alcance:** Correcciones en el Service Worker y su registro. Mejora la fiabilidad del comportamiento offline y de actualizaciones.  
**Riesgo:** Medio — los cambios en el SW afectan el cache de todos los usuarios. Requiere incrementar `CACHE_VERSION`.

---

### 5.1 · Cache de imágenes nunca expira

**Estado actual:** `public/sw.js` línea 86-99:
```js
// Image proxy: cache-first (property photos don't change)
if (url.pathname.startsWith("/api/images/")) {
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;  // ← sirve cache sin verificar edad
      return fetch(request).then((response) => {
        // ...cachea y devuelve
      });
    })
  );
}
```

**Impacto:** Si un agente sube una foto nueva a una propiedad (reemplazando la existente), los usuarios que ya cachearon la foto anterior seguirán viendo la versión vieja indefinidamente hasta que cambien el CACHE_VERSION manualmente o limpien el cache del browser.

**Solución:** Estrategia `stale-while-revalidate` con timestamp. Cachear la imagen pero siempre intentar una actualización en background. Si la imagen tiene más de 7 días en cache, forzar revalidación:

```js
const IMAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

if (url.pathname.startsWith("/api/images/")) {
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);

      // Check if cached response is still fresh
      if (cached) {
        const cachedDate = cached.headers.get("x-cached-at");
        const age = cachedDate ? Date.now() - parseInt(cachedDate, 10) : Infinity;
        if (age < IMAGE_MAX_AGE_MS) {
          // Fresh — serve from cache, revalidate in background
          fetch(request).then((fresh) => {
            if (fresh && fresh.status === 200) {
              const headers = new Headers(fresh.headers);
              headers.set("x-cached-at", String(Date.now()));
              cache.put(request, new Response(fresh.body, {
                status: fresh.status,
                headers,
              }));
            }
          });
          return cached;
        }
      }

      // Stale or not cached — fetch fresh
      const response = await fetch(request);
      if (response && response.status === 200) {
        const headers = new Headers(response.headers);
        headers.set("x-cached-at", String(Date.now()));
        cache.put(request, new Response(response.clone().body, {
          status: response.status,
          headers,
        }));
      }
      return response;
    })
  );
  return;
}
```

**Archivos:** `public/sw.js`  
**Líneas cambiadas:** ~25 líneas

---

### 5.2 · `setInterval` en ServiceWorkerRegister no se limpia

**Estado actual:** `sw-register.tsx`:
```tsx
useEffect(() => {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setInterval(() => reg.update(), 60 * 60 * 1000); // ← sin cleanup
      });
  }
}, []);
```

**Impacto:** Si por alguna razón el componente se desmonta y remonta (hot reload en desarrollo, o si el root layout se re-renderiza), se acumulan múltiples intervalos. Aunque en producción el root layout no se desmonta, es un memory leak y una violación del patrón de limpieza de efectos de React.

**Solución:**
```tsx
useEffect(() => {
  if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
    return;
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;

  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      // Check for SW updates every hour. Store the interval ID so it can
      // be cancelled if the component ever unmounts.
      intervalId = setInterval(() => reg.update(), 60 * 60 * 1000);
    })
    .catch((err) => {
      console.error("SW registration failed:", err);
    });

  return () => {
    if (intervalId !== null) clearInterval(intervalId);
  };
}, []);
```

**Archivos:** `src/components/sw-register.tsx`  
**Líneas cambiadas:** ~10 líneas

---

### 5.3 · `CACHE_VERSION` hardcodeado — cache no invalida en deploys

**Estado actual:** `public/sw.js` línea 9:
```js
const CACHE_VERSION = "propi-v5";
```

**Impacto:** Cuando se hace un deploy nuevo (nuevos hashes de assets en `_next/static/`), el SW sigue sirviendo la versión anterior del cache porque `CACHE_VERSION` no cambió. Solo se invalida cuando alguien recuerda manualmente cambiar esta constante.

**Solución:** Inyectar el build ID de Next.js en el SW durante el build. Next.js expone el build ID como variable de entorno o a través de `next.config.ts`.

En `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  // ...existing config...
  async generateBuildId() {
    // Use git commit hash if available, else timestamp
    const { execSync } = await import("child_process");
    try {
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return Date.now().toString();
    }
  },
};
```

En `public/sw.js` — reemplazar la constante hardcodeada por un placeholder que se reemplaza en el pipeline de CI:
```js
// BUILD_ID is replaced at build time by the CI pipeline or a Next.js
// custom build script. Never edit this manually.
const CACHE_VERSION = "propi-__BUILD_ID__";
```

Y en `package.json` scripts, agregar un paso post-build:
```json
"postbuild": "node scripts/inject-sw-build-id.js"
```

Donde `scripts/inject-sw-build-id.js` lee el `.next/BUILD_ID` y reemplaza el placeholder en el SW.

**Archivos:** `public/sw.js`, `next.config.ts`, `package.json`, nuevo archivo `scripts/inject-sw-build-id.js`  
**Complejidad:** Media — requiere un script de build auxiliar.

---

## Sprint 6 — Performance & Streaming

**Alcance:** Mejoras en el tiempo de carga percibido. Afecta el Dashboard principalmente.  
**Riesgo:** Bajo — Suspense en Server Components es additive, no cambia el comportamiento en caso de fallo.

---

### 6.1 · Dashboard espera 4 queries antes de renderizar nada

**Estado actual:** `app/(app)/dashboard/page.tsx`:
```tsx
export default async function DashboardPage() {
  const [stats, upcoming, todayTasks, recentActivities] = await Promise.all([
    getDashboardStats(),       // ← potencialmente la más lenta
    getUpcomingAppointments(4),
    getTodayTasksCount(),
    getRecentActivities(6),
  ]);
  // render todo en una vez
}
```

**Impacto:** El usuario ve una pantalla vacía hasta que las 4 queries completan. Si `getDashboardStats()` tarda 400ms (múltiples JOINs), el usuario espera 400ms con pantalla en blanco aunque `getTodayTasksCount()` termine en 20ms.

En conexiones lentas (4G intermitente) y en Android gama baja con base de datos con muchos registros, el TTFB percibido del dashboard puede ser de 800ms+.

**Solución:** Separar el dashboard en secciones con Suspense + loading skeletons individuales. Cada sección se streameará al browser tan pronto su query termine:

```tsx
// dashboard/page.tsx — renderiza el shell inmediatamente, streams las secciones
export default function DashboardPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header — no DB, renderiza instantáneo */}
      <DashboardHeader />

      {/* Metric cards — suspends on getDashboardStats */}
      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      {/* Bottom sections — each suspends independently */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <Suspense fallback={<CardSkeleton />}>
          <UpcomingAppointments />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <RecentActivity />
        </Suspense>
        <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 card-shadow">
          <TasksWidget />  {/* already client-side, no suspense needed */}
        </div>
      </div>
    </div>
  );
}
```

Cada `MetricCards`, `UpcomingAppointments`, `RecentActivity` sería un async Server Component que hace su propia query.

**Archivos:** `src/app/(app)/dashboard/page.tsx` — refactor en sub-components async  
**Complejidad:** Media — requiere dividir el componente de ~540 líneas en 3-4 sub-components.

---

## Descartados / No Aplican

Los siguientes puntos fueron evaluados y descartados tras verificar el código fuente actual:

| Ítem | Razón de descarte |
|------|------------------|
| Pipeline DnD en mobile | Pipeline no es accesible en mobile nav ni mobile sidebar. PR #236 ya lo removió de desktop sidebar también. No aplica. |
| `loading="lazy"` en `image-carousel.tsx` | Ya implementado correctamente: `loading={i === 0 ? "eager" : "lazy"}`. ✓ |
| `backdrop-blur` excesivo en MobileNav | Ya optimizado de `backdrop-blur-xl` → `backdrop-blur-md` (12px). Comentario en el código lo documenta explícitamente. No requiere cambio adicional. |
| `touch-action: pan-y` en `main` | Ya presente en `globals.css` bajo `@media (pointer: coarse)`. El elemento `main` ya tiene el comportamiento correcto. |
| NavLink no memoizado | Impacto medible es mínimo (~1ms de re-render por navigación). La complejidad del cambio no justifica el beneficio en este momento. |
| `force-dynamic` en todas las páginas | Correcta para un CRM donde los datos cambian constantemente. El cache de Next.js podría servir datos obsoletos. No se cambia. |

---

## Prioridad de Ejecución Recomendada

| Sprint | Impacto | Esfuerzo | Dispositivos beneficiados |
|--------|---------|---------|--------------------------|
| **1** — CSS Foundations | Alto | Muy bajo | Android gama baja, todos |
| **2** — Touch & Scroll | Alto | Bajo | Android Chrome/Samsung Internet |
| **3** — Forms & Input UX | Alto | Bajo | Todos los iPhone, iPad |
| **4** — PWA / iOS Meta | Medio | Medio | iPhone con app instalada |
| **5** — Service Worker | Medio | Medio | Todos (offline / updates) |
| **6** — Performance | Medio | Medio-Alto | Conexiones lentas, Android gama baja |

**Recomendación:** Ejecutar Sprint 1 → 2 → 3 en secuencia rápida (son CSS y atributos, bajo riesgo). Sprint 4 requiere que Sprint 3 esté completo (los inputs a 16px justifican quitar `userScalable: false`). Sprints 5 y 6 son independientes.
