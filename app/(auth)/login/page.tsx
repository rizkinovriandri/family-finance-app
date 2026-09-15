"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithPassword,
  signInWithOAuth,
  resetPasswordForEmail,
} from "@/lib/supabase/queries/auth";
import {
  WalletIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  GoogleIcon,
  AppleIcon,
} from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    const { error } = await resetPasswordForEmail(email);
    setResetLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
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

      {showResetForm ? (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Lupa password
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Masukkan email kamu, kami kirim link untuk reset password.
            </p>
          </div>

          {resetSent ? (
            <p className="text-sm text-success text-center">
              Link reset password sudah dikirim ke {email}.
            </p>
          ) : (
            <>
              <InputWithIcon icon={<MailIcon className="w-5 h-5" />}>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-text-primary placeholder:text-text-muted"
                />
              </InputWithIcon>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={resetLoading}
                className="rounded-xl bg-accent py-3.5 text-white font-medium disabled:opacity-60"
              >
                {resetLoading ? "Mengirim..." : "Kirim link reset"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setShowResetForm(false);
              setResetSent(false);
              setError(null);
            }}
            className="text-sm text-accent text-center"
          >
            Kembali ke halaman masuk
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Masuk untuk melanjutkan pencatatan keuangan keluarga
            </p>
          </div>

          <InputWithIcon icon={<MailIcon className="w-5 h-5" />}>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none flex-1 text-text-primary placeholder:text-text-muted"
            />
          </InputWithIcon>

          <div className="flex flex-col gap-1.5">
            <InputWithIcon icon={<LockIcon className="w-5 h-5" />}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
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
            </InputWithIcon>

            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="text-sm text-accent text-right"
            >
              Lupa password?
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent py-3.5 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="flex items-center gap-3 text-text-muted text-xs">
            <div className="h-px flex-1 bg-border-subtle" />
            atau masuk dengan
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-subtle py-3 text-text-primary disabled:opacity-60"
          >
            <GoogleIcon className="w-5 h-5" />
            {oauthLoading === "google" ? "Menghubungkan..." : "Lanjut dengan Google"}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-subtle py-3 text-text-primary disabled:opacity-60"
          >
            <AppleIcon className="w-5 h-5" />
            {oauthLoading === "apple" ? "Menghubungkan..." : "Lanjut dengan Apple"}
          </button>

          <p className="text-sm text-text-secondary text-center">
            Belum punya akun?{" "}
            <Link href="/register" className="text-accent">
              Daftar
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg-surface border border-border-subtle px-4 py-3.5 focus-within:border-accent">
      <span className="text-text-muted">{icon}</span>
      {children}
    </div>
  );
}
