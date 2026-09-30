const CACHE = 'combustivel-1785640000';
const FILES = ['./', './index.html', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  // NÃO chama clients.claim() — o SW só assume controle quando o usuário
  // clicar em "Atualizar agora" e a página recarregar naturalmente
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // Firebase Realtime DB nunca passa pelo cache (dados sempre ao vivo)
  if(e.request.url.indexOf('firebaseio.com') !== -1) return;
  e.respondWith(
    fetch(e.request).then(res => {
      // status 200 = mesmo domínio / CORS; 'opaque' = scripts de CDN (Firebase SDK,
      // ícones, Tesseract, SheetJS) — antes não eram guardados e o app não abria offline
      if(res && (res.status === 200 || res.type === 'opaque')){
        var clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
