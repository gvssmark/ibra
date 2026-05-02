const APP_CACHE = "app-shell-v1";

// List of core files for offline availability
const APP_ASSETS = [
  "addbook.html",
  "index.js",
  "sw.js",
  "images/ibra192.png",
  "images/ibra512.png",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old app shell caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== APP_CACHE && key.startsWith("app-shell")) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML/JS, cache-first for images/icons
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith(".html") || url.pathname.endsWith(".js")) {
    // Network first
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else if (url.pathname.endsWith(".png") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".ico")) {
    // Cache first for images
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  } else {
    // Default: try cache, then network
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
