// Propi Service Worker v2
// Manual SW - no dependencies, no build tools needed.
// Strategies:
//   - Static assets (JS, CSS, fonts, images): cache-first (immutable)
//   - App pages (HTML): stale-while-revalidate (instant load + background update)
//   - API calls: network-only (never cache)
//   - Navigation fallback: cached dashboard shell

const CACHE_VERSION = "propi-v2";

// App shell + key pages to precache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/contacts",
  "/properties",
  "/calendar",
  "/documents",
  "/marketing/inbox",
  "/help",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache the app shell and key pages
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

  // Skip API routes, auth, external - never cache
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  // These have content hashes in filenames, so they're immutable
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // App pages: stale-while-revalidate
  // Show cached version INSTANTLY, then update cache in background
  // This makes navigation feel instant on repeat visits
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: if we have a cached version, it was already returned
          // If not, try fallback
          if (cached) return cached;
          // Fallback to cached dashboard for any app route
          if (
            url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/contacts") ||
            url.pathname.startsWith("/properties") ||
            url.pathname.startsWith("/calendar") ||
            url.pathname.startsWith("/documents") ||
            url.pathname.startsWith("/marketing") ||
            url.pathname.startsWith("/search") ||
            url.pathname.startsWith("/help")
          ) {
            return caches.match("/dashboard");
          }
          return caches.match("/");
        });

      // Return cached immediately if available, otherwise wait for network
      return cached || fetchPromise;
    })
  );
});

// Background sync: check for updates every 60 minutes
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
