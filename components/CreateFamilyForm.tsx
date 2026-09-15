"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFamilyWithOwner } from "@/lib/supabase/queries/families";

export function CreateFamilyForm() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      await createFamilyWithOwner(supabase, familyName, displayName);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat keluarga.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-4"
    >
      <div>
        <h2 className="text-lg font-medium text-text-primary">Buat ruang keluarga</h2>
        <p className="text-sm text-text-secondary mt-1">
          Ini jadi satu pool data bersama yang bisa diakses semua anggota keluarga.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary">Nama keluarga</label>
        <input
          required
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="mis. Keluarga Santoso"
          className="rounded-xl bg-bg-page border border-border-subtle px-4 py-3 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary">Nama panggilan kamu</label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="mis. Andri"
          className="rounded-xl bg-bg-page border border-border-subtle px-4 py-3 text-text-primary outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
      >
        {loading ? "Membuat..." : "Buat keluarga"}
      </button>
    </form>
  );
}
