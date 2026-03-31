// Propi Service Worker v1
// Manual SW - no dependencies, no build tools needed.
// Strategies:
//   - App shell (HTML): network-first with cache fallback
//   - Static assets (JS, CSS, fonts, images): cache-first
//   - API calls: network-only (never cache)
//   - Navigation: network-first

const CACHE_VERSION = "propi-v1";

// App shell files to precache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: route requests to the right strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API routes, webhooks, clerk - never cache
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // HTML pages / navigation: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page responses
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback to cached dashboard for any app route
          if (url.pathname.startsWith("/dashboard") ||
              url.pathname.startsWith("/contacts") ||
              url.pathname.startsWith("/properties") ||
              url.pathname.startsWith("/calendar") ||
              url.pathname.startsWith("/documents") ||
              url.pathname.startsWith("/marketing") ||
              url.pathname.startsWith("/search")) {
            return caches.match("/dashboard");
          }
          return caches.match("/");
        });
      })
  );
});
