/// <reference lib="webworker" />

// ─── Flow State Service Worker ─────────────────────────────
// Provides: offline shell caching, API response caching, background sync

const CACHE_NAME = 'flowstate-v1';
const STATIC_CACHE = 'flowstate-static-v1';
const API_CACHE = 'flowstate-api-v1';
const SYNC_STORE = 'flowstate-sync';

// Pages / assets to cache for offline shell
const STATIC_ASSETS = [
  '/',
  '/analytics',
  '/eod',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ─── Install: cache the app shell ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-critical — some paths may not exist in dev
        console.warn('[SW] Some static assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches & stale sync entries ─────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== SYNC_STORE)
            .map((k) => caches.delete(k))
        )
      ),
      // Purge stale sync entries
      purgeOldSyncEntries(),
    ])
  );
  self.clients.claim();
});

async function purgeOldSyncEntries() {
  try {
    const cache = await caches.open(SYNC_STORE);
    const keys = await cache.keys();
    for (const key of keys) {
      const response = await cache.match(key);
      if (!response) { await cache.delete(key); continue; }
      try {
        const entry = await response.json();
        if (Date.now() - entry.timestamp > MAX_SYNC_AGE_MS || (entry.retries || 0) >= MAX_SYNC_RETRIES) {
          console.log('[SW] Purging stale sync entry:', key.url);
          await cache.delete(key);
        }
      } catch {
        await cache.delete(key);
      }
    }
  } catch (err) {
    console.warn('[SW] Error purging sync entries:', err);
  }
}

// ─── Fetch strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension URLs
  if (request.method !== 'GET') {
    // For POST/PUT mutations: try network, if offline queue for sync
    if (
      (request.method === 'POST' || request.method === 'PUT') &&
      url.pathname.startsWith('/api/')
    ) {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          // Queue for background sync
          await queueForSync(request);
          return new Response(
            JSON.stringify({ success: true, queued: true, message: 'Queued for sync' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
    }
    return;
  }

  // API requests: network-first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // Static / page requests: cache-first, fall back to network
  event.respondWith(cacheFirstStatic(request));
});

// ─── Network-first for API ─────────────────────────────────
async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    // Cache successful GET responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ success: false, offline: true, message: 'You are offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── Cache-first for static assets ─────────────────────────
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and nothing cached — return offline page for navigations
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

// ─── Background sync queue ─────────────────────────────────
async function queueForSync(request) {
  try {
    const body = await request.clone().text();
    const entry = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };

    // Put in IndexedDB (simplified via cache storage as a workaround)
    const cache = await caches.open(SYNC_STORE);
    const key = `${request.url}?_sync_${Date.now()}`;
    await cache.put(
      new Request(key),
      new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    // Register background sync if available
    if (self.registration && 'sync' in self.registration) {
      await self.registration.sync.register('flowstate-sync');
    }
  } catch (err) {
    console.error('[SW] Failed to queue for sync:', err);
  }
}

// ─── Background sync handler ───────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'flowstate-sync') {
    event.waitUntil(replaySyncQueue());
  }
});

const MAX_SYNC_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SYNC_RETRIES = 5;

async function replaySyncQueue() {
  const cache = await caches.open(SYNC_STORE);
  const keys = await cache.keys();

  for (const key of keys) {
    try {
      const response = await cache.match(key);
      if (!response) continue;

      const entry = await response.json();

      // Drop entries that are too old
      if (Date.now() - entry.timestamp > MAX_SYNC_AGE_MS) {
        console.warn('[SW] Dropping stale sync entry:', key.url);
        await cache.delete(key);
        continue;
      }

      // Drop entries that have exceeded max retries
      const retries = entry.retries || 0;
      if (retries >= MAX_SYNC_RETRIES) {
        console.warn('[SW] Max retries reached, dropping:', key.url);
        await cache.delete(key);
        continue;
      }

      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });

      await cache.delete(key);
    } catch {
      // Increment retry count
      try {
        const response = await cache.match(key);
        if (response) {
          const entry = await response.json();
          entry.retries = (entry.retries || 0) + 1;
          await cache.put(
            key,
            new Response(JSON.stringify(entry), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      } catch (_) { /* ignore */ }
      console.warn('[SW] Sync retry failed for:', key.url);
    }
  }
}

// ─── Periodic online check — replay queue when back online ──
self.addEventListener('message', (event) => {
  if (event.data === 'REPLAY_SYNC') {
    replaySyncQueue();
  }
  if (event.data === 'PURGE_STALE') {
    purgeOldSyncEntries();
  }
});
