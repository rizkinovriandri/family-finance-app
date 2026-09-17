"use client";

import { useEffect } from "react";

// Bottom sheet mobile-first — geser naik dari bawah, konsisten dengan pola
// "layar penuh" utk form tambah/ubah di mockup, tanpa perlu route terpisah.
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-bg-page border-t border-border-subtle p-4 pb-6">
        {children}
      </div>
    </div>
  );
}
