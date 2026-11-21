/* SAED service worker - installable app + fast reloads. Deliberately conservative:
 *   - Only same-origin GET requests are ever handled. The API (even when proxied under /api), media, admin, docs and
 *     config.js are NEVER cached, so no private data (lessons, letters, profiles) is stored on the device.
 *   - Hashed build assets (/assets/*) are cache-first (their names change with every release).
 *   - Page navigations are network-first; when offline the visitor gets /offline.html.
 *   - A new version waits until the user taps "Refresh" (the app posts SKIP_WAITING) so nobody loses work mid-form.
 */
const VERSION = "saed-pwa-v2.5.2";      // bumping this purges every older cache on activation
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ["/offline.html", "/pwa-192.png", "/pwa-512.png", "/manifest.webmanifest"];
// A response may only be stored if it really is the file: a host that answers missing files with index.html (SPA fallback,
// HTTP 200) must never get its HTML cached under an image/script URL, or the file would stay "missing" after it is uploaded.
const storable = (res) => res && res.ok && res.type !== "opaque" && !/text\/html/i.test((res.headers && res.headers.get("content-type")) || "");
const NEVER = /^\/(api|media|admin|docs|redoc|static)\/|^\/(config\.js|sw\.js)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, ASSETS]);
    for (const key of await caches.keys()) if (key.startsWith("saed-pwa-") && !keep.has(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || NEVER.test(url.pathname)) return;     // let the browser handle it

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (storable(res)) cache.put(req, res.clone());
      return res;
    })());
    return;
  }
  // icons, manifest, fonts, images shipped with the app: serve cached copy, refresh in the background
  if (/\.(png|jpe?g|svg|ico|webp|woff2?|webmanifest)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req);
      const refresh = fetch(req).then((res) => { if (storable(res)) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || refresh;
    })());
  }
});
