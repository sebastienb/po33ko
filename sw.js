const CACHE_NAME = "po33ko-v20260619-2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./po33-primer.html",
  "./po33-studio.html",
  "./manifest.webmanifest"
];

function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  return url.toString();
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const key = cacheKey(event.request);
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(key);
      if (cached) return cached;
      if (event.request.mode === "navigate") return cache.match("./po33-primer.html");
      return Response.error();
    }
  })());
});
