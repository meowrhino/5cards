/* ========================================
   sw.js — service worker

   el objetivo es que la app y el archivo de reglas funcionen sin
   conexion: se juega en bares, trenes y sitios sin cobertura, y un
   archivo que solo existe con internet no es un archivo.

   estrategia:
   - app shell (html/css/js): cache primero, red de refuerzo
   - reglas (data/): cache primero, actualizacion en segundo plano
   ======================================== */

const CACHE = '5cards-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'vendor/anime.min.js',
  'data/fournier/index.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      /* addAll falla entero si un recurso falla: se añaden de uno en uno */
      .then(cache => Promise.allSettled(SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);

      /* cache primero para que abra al instante; la red refresca detras */
      return cached || network;
    })
  );
});
