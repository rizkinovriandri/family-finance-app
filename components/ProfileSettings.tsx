"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  updateAvatarUrl,
  updateDisplayName,
  updateFamilyName,
  uploadAvatar,
} from "@/lib/supabase/queries/families";
import { getInitials } from "@/lib/utils/avatar";
import { ChevronLeftIcon, CameraIcon } from "@/components/icons";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB — cukup untuk foto profil, tidak membebani storage.
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfileSettings({
  userId,
  memberId,
  familyId,
  initialDisplayName,
  initialFamilyName,
  initialAvatarUrl,
}: {
  userId: string;
  memberId: string;
  familyId: string;
  initialDisplayName: string;
  initialFamilyName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [familyName, setFamilyName] = useState(initialFamilyName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedDisplayName = displayName.trim();
  const trimmedFamilyName = familyName.trim();
  const isUnchanged =
    trimmedDisplayName === initialDisplayName && trimmedFamilyName === initialFamilyName;
  const isInvalid = trimmedDisplayName.length === 0 || trimmedFamilyName.length === 0;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya bisa pilih file yang sama lagi kalau mau upload ulang
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Format foto harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Ukuran foto maksimal 2MB.");
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const url = await uploadAvatar(supabase, userId, file);
      await updateAvatarUrl(supabase, memberId, url);
      setAvatarUrl(url);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    if (isInvalid) {
      setError("Nama tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (trimmedDisplayName !== initialDisplayName) {
        await updateDisplayName(supabase, memberId, trimmedDisplayName);
      }
      if (trimmedFamilyName !== initialFamilyName) {
        await updateFamilyName(supabase, familyId, trimmedFamilyName);
      }
      router.push("/more");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-2">
        <Link
          href="/more"
          className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary shrink-0"
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary">Edit Profil</h1>
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col items-center gap-3">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL publik dinamis dari Supabase Storage
            <img
              src={avatarUrl}
              alt="Foto profil"
              className="w-20 h-20 rounded-full object-cover bg-bg-page"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(displayName)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            aria-label="Ganti foto profil"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center border-2 border-bg-surface disabled:opacity-60"
          >
            <CameraIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <p className="text-xs text-text-muted">
          {avatarUploading ? "Mengunggah foto..." : "JPG, PNG, atau WEBP, maks. 2MB"}
        </p>
        {avatarError && <p className="text-sm text-danger text-center">{avatarError}</p>}
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-4">
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Nama Kamu</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl bg-bg-page border border-border-subtle px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-accent"
            placeholder="mis. Andri"
          />
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">Nama Keluarga</label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl bg-bg-page border border-border-subtle px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-accent"
            placeholder="mis. Keluarga Andri"
          />
          <p className="text-xs text-text-muted mt-1.5">
            Perubahan ini berlaku untuk semua anggota keluarga.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading || isUnchanged || isInvalid}
        className="rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}
