"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpWithPassword } from "@/lib/supabase/queries/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUpWithPassword(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Cek email kamu</h1>
        <p className="text-sm text-text-secondary">
          Kami sudah mengirim link konfirmasi ke <strong>{email}</strong>. Setelah
          dikonfirmasi, kamu bisa masuk dan membuat atau bergabung ke keluarga.
        </p>
        <Link href="/login" className="text-accent text-sm mt-2">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Daftar</h1>
        <p className="text-sm text-text-secondary mt-1">
          Buat akun untuk mulai mencatat keuangan keluarga.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-text-primary outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Daftar"}
      </button>

      <p className="text-sm text-text-secondary text-center">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-accent">
          Masuk
        </Link>
      </p>
    </form>
  );
}
