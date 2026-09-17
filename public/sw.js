const CACHE_NAME = "keuangan-keluarga-v2";
const APP_SHELL = ["/manifest.webmanifest", "/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Halaman: network-first, biar data selalu segar; fallback ke cache
  // kalau offline (tidak bisa jamin data terbaru, tapi app tetap bisa dibuka).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/dashboard")))
    );
    return;
  }

  // Hanya aset statis ber-hash (JS/CSS bundle Next.js) dan app shell yang aman
  // di-cache-first — keduanya immutable per URL. Request lain (mis. fetch RSC
  // internal Next.js saat navigasi lewat <Link>) dibiarkan lewat ke network
  // apa adanya, supaya service worker tidak menyajikan payload router yang basi
  // dan bikin navigasi client-side diam-diam gagal.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") || APP_SHELL.includes(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
