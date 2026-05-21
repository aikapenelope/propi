// Propi Service Worker v6
//
// Caching strategies:
//   Static assets (_next/static, icons, fonts)  → cache-first (immutable hashed names)
//   App pages (HTML)                             → network-first (always fresh, offline fallback)
//   API calls                                    → network-only (never cache)
//   /api/images (property photos)               → stale-while-revalidate, 7-day TTL
//   Offline                                      → dedicated offline.html

const CACHE_VERSION = "propi-v6";

// Maximum age for cached property images.
// After 7 days the cache entry is considered stale and a fresh copy is
// fetched in the background (stale-while-revalidate).  The stale copy is
// still served immediately so the user never waits.
const IMAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Precache: offline page + app shell entry point + icons
const PRECACHE_URLS = [
  "/offline.html",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ────────────────────────────────────────────────────────────────

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

// ── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip API routes (except images), auth routes, and cross-origin requests
  if (
    (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/images/")) ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // ── Static assets: cache-first ───────────────────────────────────────────
  // _next/static files have content hashes in their names — they are
  // effectively immutable.  Serve from cache immediately; fetch on miss.
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

  // ── Property images: stale-while-revalidate with 7-day TTL ───────────────
  //
  // Previous behaviour: cache-first with no expiry.  This caused stale
  // property photos to persist indefinitely after an agent uploaded a
  // replacement image.
  //
  // New behaviour (stale-while-revalidate):
  //   1. Serve the cached copy immediately (fast) if it exists and is fresh.
  //   2. In parallel, fetch a new copy from the server and update the cache.
  //   3. If the cached copy is older than IMAGE_MAX_AGE_MS (7 days), fetch
  //      synchronously (blocking) instead of using the stale copy.
  //
  // Freshness is tracked via a custom "x-sw-cached-at" response header that
  // records the timestamp when the response was stored.
  if (url.pathname.startsWith("/api/images/")) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);

        if (cached) {
          const cachedAt = cached.headers.get("x-sw-cached-at");
          const age = cachedAt ? Date.now() - parseInt(cachedAt, 10) : Infinity;
          const isFresh = age < IMAGE_MAX_AGE_MS;

          // Revalidate in background (even when fresh), so the cache stays
          // up-to-date for the next request.
          const revalidate = fetch(request)
            .then((fresh) => {
              if (fresh && fresh.status === 200) {
                const headers = new Headers(fresh.headers);
                headers.set("x-sw-cached-at", String(Date.now()));
                cache.put(
                  request,
                  new Response(fresh.clone().body, {
                    status: fresh.status,
                    statusText: fresh.statusText,
                    headers,
                  })
                );
              }
              return fresh;
            })
            .catch(() => null);

          // Serve stale copy immediately if still fresh; wait for network if expired.
          if (isFresh) {
            return cached;
          }
          // Expired: wait for network response (may be null on failure)
          const fresh = await revalidate;
          return fresh || cached; // fall back to expired cache if network fails
        }

        // Not cached: fetch, store with timestamp, and return.
        const response = await fetch(request).catch(() => null);
        if (response && response.status === 200) {
          const headers = new Headers(response.headers);
          headers.set("x-sw-cached-at", String(Date.now()));
          cache.put(
            request,
            new Response(response.clone().body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            })
          );
        }
        return response;
      })
    );
    return;
  }

  // ── App pages (HTML): network-first with offline fallback ─────────────────
  // Always try the network first so users see fresh data.  Fall back to cache
  // only when offline, and show the dedicated offline page as last resort.
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
          return caches.match("/offline.html");
        });
      })
  );
});

// ── Messages ─────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
