"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/queries/auth";
import { WalletIcon, LockIcon, EyeIcon } from "@/components/icons";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorDescription = searchParams.get("error_description");
  const linkError = errorDescription ? errorDescription.replace(/\+/g, " ") : null;

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (linkError) return;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Guard kalau event PASSWORD_RECOVERY sudah lewat sebelum listener
    // terpasang (mis. exchange code sudah selesai duluan).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [linkError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
          <WalletIcon className="w-7 h-7 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">
          Keuangan Keluarga
        </span>
      </div>

      {linkError ? (
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            Link tidak valid
          </h1>
          <p className="text-sm text-text-secondary">{linkError}</p>
          <a href="/login" className="text-accent text-sm">
            Kembali ke halaman masuk
          </a>
        </div>
      ) : done ? (
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            Password berhasil diubah
          </h1>
          <p className="text-sm text-text-secondary">Mengarahkan ke dashboard...</p>
        </div>
      ) : !ready ? (
        <p className="text-sm text-text-secondary text-center">
          Memverifikasi link reset password...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Buat password baru
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Masukkan password baru untuk akun kamu.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-bg-surface border border-border-subtle px-4 py-3.5 focus-within:border-accent">
            <span className="text-text-muted">
              <LockIcon className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none flex-1 text-text-primary placeholder:text-text-muted"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-text-muted"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              <EyeIcon className="w-5 h-5" off={showPassword} />
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent py-3.5 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan password baru"}
          </button>
        </form>
      )}
    </div>
  );
}
