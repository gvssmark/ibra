self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('newEmpId-cache-v1').then(cache => {
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






