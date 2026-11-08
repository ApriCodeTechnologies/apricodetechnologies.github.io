const CACHE='flappy-fly-v7';
const FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const OK=new Set(FILES.map(f=>new URL(f,self.location).pathname));
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  /* only handle Flappy Fly's own files; leave /MergeFruits/ and everything else to the network */
  if(r.method!=='GET'||u.origin!==self.location.origin||!OK.has(u.pathname))return;
  e.respondWith(fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res}).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));
});
