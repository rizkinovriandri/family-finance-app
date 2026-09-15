"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return isIOS && !isStandalone;
}

function getServerSnapshot() {
  return false;
}

export function InstallHint() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!show) return null;

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
      <p className="text-sm font-medium text-text-primary">Install ke Layar Utama</p>
      <p className="text-sm text-text-secondary mt-1">
        Tap ikon Share (⎋) di Safari, lalu pilih &quot;Add to Home Screen&quot; supaya
        aplikasi ini bisa dibuka langsung dari layar utama HP kamu.
      </p>
    </div>
  );
}
