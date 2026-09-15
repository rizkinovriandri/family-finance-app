"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithPassword } from "@/lib/supabase/queries/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signInWithPassword(email, password);

    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Masuk</h1>
        <p className="text-sm text-text-secondary mt-1">
          Kelola keuangan keluarga bersama-sama.
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
        {loading ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-sm text-text-secondary text-center">
        Belum punya akun?{" "}
        <Link href="/register" className="text-accent">
          Daftar
        </Link>
      </p>
    </form>
  );
}
