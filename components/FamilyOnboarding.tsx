"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createFamilyWithOwner,
  joinFamilyByInviteCode,
} from "@/lib/supabase/queries/families";

type Mode = "create" | "join";

export function FamilyOnboarding() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (mode === "create") {
        await createFamilyWithOwner(supabase, familyName, displayName);
      } else {
        await joinFamilyByInviteCode(supabase, inviteCode, displayName);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses permintaan."
      );
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-4">
      <div className="flex rounded-xl bg-bg-page p-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "create" ? "bg-accent text-white" : "text-text-secondary"
          }`}
        >
          Buat Baru
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "join" ? "bg-accent text-white" : "text-text-secondary"
          }`}
        >
          Gabung dengan Kode
        </button>
      </div>

      <div>
        <h2 className="text-lg font-medium text-text-primary">
          {mode === "create" ? "Buat ruang keluarga" : "Gabung ke keluarga"}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {mode === "create"
            ? "Ini jadi satu pool data bersama yang bisa diakses semua anggota keluarga."
            : "Minta kode undangan dari anggota keluarga yang sudah terdaftar (lihat di halaman Lainnya mereka)."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "create" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Nama keluarga</label>
            <input
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="mis. Keluarga Santoso"
              className="input"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Kode undangan</label>
            <input
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="mis. K7XQ2M9P"
              maxLength={8}
              className="input font-mono tracking-widest uppercase"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary">Nama panggilan kamu</label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="mis. Andri"
            className="input"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
        >
          {loading
            ? "Memproses..."
            : mode === "create"
              ? "Buat keluarga"
              : "Gabung ke keluarga"}
        </button>
      </form>
    </div>
  );
}
