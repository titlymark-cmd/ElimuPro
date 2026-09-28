// Deliberately minimal: this app is mostly live, authenticated,
// server-rendered data (fees, marks, attendance) that must never be
// served stale, so this service worker does NOT cache pages or API
// responses. All it does is (a) let the browser register something so
// installability criteria are met, and (b) show a real offline page
// instead of the browser's default error when navigation fails with no
// network. Nothing here fabricates offline functionality this app
// doesn't actually have.
const CACHE_NAME = "elimupro-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error()))
  );
});
