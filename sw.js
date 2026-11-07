// Keeps the check-in desk opening even when the venue internet drops.
// Only the check-in page and its two scripts are cached; everything else goes straight to the network.
const CACHE = "sg-checkin-v1";
const FILES = ["checkin", "assets/vendor/supabase-js-2.45.4.min.js", "assets/vendor/jsqr-1.4.0.min.js"];
const isOurs = (url) => url.origin === location.origin &&
  (/\/checkin(\.html)?$/.test(url.pathname) || url.pathname.includes("/assets/vendor/"));

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !isOurs(url)) return;
  const key = url.pathname.includes("/assets/vendor/") ? url.pathname : "checkin";
  if (key === "checkin") {
    // network first, so a new version shows up straight away; the saved copy if offline
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("checkin", copy)); }
      return r;
    }).catch(() => caches.match("checkin")));
  } else {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});
