/* Change the number in CACHE every time you publish an update. */
const CACHE = 'apricode-v11';
const FILES = ['./', './index.html', './flappy.html', './connect4.html', './mergefruits.html', './spot.html', './checkers.html', './fx.js', './theme.css', './pwa.js', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const OK = new Set(FILES.map(f => new URL(f, self.location).pathname));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // Only handle Apricode's own files. /MergeFruits/ and anything else goes straight to the network.
  if (r.method !== 'GET' || u.origin !== self.location.origin || !OK.has(u.pathname)) return;
  // Network first (always the newest version when online), saved copy when offline.
  e.respondWith(
    fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then(h => h || caches.match('./index.html')))
  );
});
