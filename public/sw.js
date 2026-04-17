// Propi Service Worker v4
// Strategies:
//   - Static assets (_next/static, icons, fonts): cache-first (immutable, hashed filenames)
//   - App pages (HTML): network-first (always fresh data, cache as offline fallback)
//   - API calls: network-only (never cache)
//   - /api/images: cache-first (property photos)
//   - Offline: dedicated offline.html page with retry button

const CACHE_VERSION = "propi-v4";

// Precache: offline page + app shell entry point + icons
const PRECACHE_URLS = [
  "/offline.html",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache essential files so they're available offline immediately
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

  // Skip API routes (except images), auth, external - never cache
  if (
    (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/images/")) ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Static assets (_next/static, icons, fonts): cache-first
  // These have content hashes in filenames so they're immutable
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2")
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

  // Image proxy: cache-first (property photos don't change)
  if (url.pathname.startsWith("/api/images/")) {
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

  // App pages (HTML): network-first with offline fallback
  // Always fetch fresh data from server. Only use cache when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline fallback: show dedicated offline page
          return caches.match("/offline.html");
        });
      })
  );
});

// Listen for skip waiting message from app
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
