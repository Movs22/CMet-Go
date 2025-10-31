const CACHE_NAME = "cmetgo-v1.06";
const ASSETS = [
  "/CMet-Go/",
  "/CMet-Go/index.html",
  "/CMet-Go/app.js",
  "/CMet-Go/manifest.json",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];


const API_BASE = "https://api.carrismetropolitana.pt/v2"; // update this to the real API domain
const STOPS_URL = `${API_BASE}/stops`;
const LINES_URL = `${API_BASE}/lines`;
const ARRIVALS_URL_PREFIX = `${API_BASE}/arrivals/by_stop`;


// Install event: cache assets
self.addEventListener('install', event => {
  self.skipWaiting(); 
});

// Fetch event: serve cached assets if offline
self.addEventListener("fetch", event => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.hostname.includes("tile.openstreetmap.org")) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (url.href === STOPS_URL || url.href === LINES_URL) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.href.startsWith(ARRIVALS_URL_PREFIX)) {
        event.respondWith(staleWhileRevalidate(request, 24 * 60 * 60 * 1000));
        return;
    }

    event.respondWith(cacheFirst(request));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    ).then(() => self.clients.claim())
  );
});


async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  cache.put(request, fresh.clone());
  return fresh;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("{}", { status: 503 });
  }
}

async function staleWhileRevalidate(request, maxAge) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("date");
    if (dateHeader && Date.now() - new Date(dateHeader).getTime() < maxAge) {
      // return cached if still fresh
      fetchAndUpdate(request, cache); // update in background
      return cached;
    }
  }

  // fallback to network
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cached || new Response("{}", { status: 503 });
  }
}

async function fetchAndUpdate(request, cache) {
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
  } catch (err) {
    console.warn("Background update failed:", err);
  }
}