"use client";

import { useState } from "react";

export function InviteCodeCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API bisa gagal di beberapa browser/permission — abaikan,
      // kode tetap terlihat dan bisa disalin manual.
    }
  }

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
      <p className="text-sm text-text-secondary">Kode undangan keluarga</p>
      <p className="text-sm text-text-muted mt-0.5">
        Bagikan ke anggota keluarga lain supaya bisa gabung ke keluarga ini.
      </p>
      <div className="flex items-center justify-between mt-3 rounded-xl bg-bg-page border border-border-subtle px-4 py-3">
        <span className="font-mono text-lg tracking-widest text-text-primary">
          {inviteCode}
        </span>
        <button
          onClick={handleCopy}
          className="text-sm text-accent font-medium"
        >
          {copied ? "Tersalin!" : "Salin"}
        </button>
      </div>
    </div>
  );
}
