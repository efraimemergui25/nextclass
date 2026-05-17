const CACHE_NAME = 'nextclass-v1';
const PRECACHE_URLS = ['/', '/catalog', '/contact', '/manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const { request } = e;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isFirebase = url.hostname.includes('firebase') || url.hostname.includes('googleapis.com');
    const isExternal = url.origin !== self.location.origin;

    if (isFirebase) return;
    if (isExternal && !request.destination === 'image') return;

    e.respondWith(
        caches.match(request).then(cached => {
            const networkFetch = fetch(request).then(res => {
                if (res.ok && !isExternal) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            }).catch(() => cached);
            return cached || networkFetch;
        })
    );
});
