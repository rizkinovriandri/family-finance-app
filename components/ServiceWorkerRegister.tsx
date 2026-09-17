"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Service worker sengaja tidak didaftarkan di development: chunk JS
    // Turbopack dev tidak content-hashed seperti production, jadi cache-first
    // di sw.js bisa menyajikan modul basi selamanya walau server sudah
    // di-restart — menyulitkan debugging tanpa manfaat (PWA offline tidak
    // relevan untuk dev server lokal).
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registrasi gagal (mis. browser tidak mendukung) — abaikan,
        // app tetap jalan normal tanpa fitur offline/installable.
      });
      return;
    }

    // Bersihkan service worker + cache dari sesi dev sebelumnya (sebelum
    // guard di atas ada) supaya browser tidak terus menyajikan bundle basi.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);

  return null;
}
