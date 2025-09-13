self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('your-cache-name').then(cache => {
      return cache.addAll([
        '/newEmpId.html',
        '/newEmpIdjs.js',
        '/images/newEmpId.png',
        '/newEmpId.json'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


