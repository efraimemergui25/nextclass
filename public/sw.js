const CACHE_NAME = 'nextclass-v5';

self.addEventListener('message', (e) => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
const PRECACHE_URLS = ['/', '/catalog', '/contact', '/manifest.json', '/offline.html'];

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

    // Never intercept external requests — let browser handle images/CDN directly
    if (isFirebase || isExternal) return;

    // SPA navigation: serve index.html for all same-origin navigations
    if (request.mode === 'navigate') {
        e.respondWith(
            fetch(request).catch(() =>
                caches.match('/').then(r => r || caches.match('/offline.html'))
            )
        );
        return;
    }

    e.respondWith(
        caches.match(request).then(cached => {
            const networkFetch = fetch(request).then(res => {
                if (res.ok && !isExternal) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            }).catch(() => cached || caches.match('/offline.html'));
            return cached || networkFetch;
        })
    );
});
