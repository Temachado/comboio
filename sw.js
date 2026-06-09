// Cache version — updated on every deploy to force refresh
const CACHE = 'combustivel-1781004293';
const FILES = ['./manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // HTML: always network-first, never serve stale version
  if (e.request.mode === 'navigate' ||
      e.request.url.endsWith('.html') ||
      e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Assets: cache-first
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          var clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
  );
});

// Auto-reload clients when new SW activates
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
