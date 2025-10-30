const CACHE_NAME = "cmetgo-v1";
const ASSETS = [
  "/CMet-Go/",
  "/CMet-Go/index.html",
  "/CMet-Go/manifest.json",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];

// Install event: cache assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Fetch event: serve cached assets if offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
