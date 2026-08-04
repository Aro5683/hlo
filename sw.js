const CACHE_NAME = 'hlo-master-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install & Cache Core Files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// 2. Activate & Clear Old Caches Immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim()) // Claim all clients immediately
  );
});

// 3. Network-First Strategy for HTML Page (Auto-updates when online)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Handle navigation/index.html requests with Network-First logic
  if (request.mode === 'navigate' || request.url.endsWith('index.html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If online, update cache with the new HTML version
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(request)) // If offline, fallback to cache
    );
    return;
  }

  // Cache-First with Network Fallback for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
