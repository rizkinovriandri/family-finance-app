import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership, getFamilyInviteCode } from "@/lib/supabase/queries/families";
import { LogoutButton } from "@/components/LogoutButton";
import { InviteCodeCard } from "@/components/InviteCodeCard";
import { InstallHint } from "@/components/InstallHint";
import { FolderIcon, InfoIcon, CalendarIcon, ChevronRightIcon } from "@/components/icons";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const initials = parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  return initials.toUpperCase();
}

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = await getMyFamilyMembership(supabase);
  const inviteCode = membership
    ? await getFamilyInviteCode(supabase, membership.family_id)
    : null;
  const displayName = membership?.display_name ?? "-";

  return (
    <div className="px-4 pt-8 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold text-text-primary">Profil & Pengaturan</h1>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-semibold shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="min-w-0">
          <p className="text-text-primary font-medium truncate">{displayName}</p>
          <p className="text-sm text-text-secondary truncate">{user?.email}</p>
        </div>
      </div>

      {inviteCode && <InviteCodeCard inviteCode={inviteCode} />}

      <InstallHint />

      <div className="rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden">
        <Link
          href="/categories"
          className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle"
        >
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <FolderIcon className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 text-text-primary text-sm">Kelola Kategori</span>
          <ChevronRightIcon className="w-4 h-4 text-text-muted shrink-0" />
        </Link>

        <Link
          href="/start-date"
          className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle"
        >
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 text-text-primary text-sm">Tanggal Awal</span>
          <ChevronRightIcon className="w-4 h-4 text-text-muted shrink-0" />
        </Link>

        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <InfoIcon className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 text-text-primary text-sm">Tentang Aplikasi</span>
          <span className="text-xs text-text-muted">Keuangan Keluarga v0.1.0</span>
        </div>
      </div>

      <LogoutButton />
    </div>
  );
}
