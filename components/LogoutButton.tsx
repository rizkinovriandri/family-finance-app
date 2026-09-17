"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/queries/auth";
import { LogOutIcon } from "@/components/icons";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 rounded-2xl bg-bg-surface border border-border-subtle px-4 py-3.5 text-danger"
    >
      <span className="w-9 h-9 rounded-full bg-danger/15 flex items-center justify-center shrink-0">
        <LogOutIcon className="w-4.5 h-4.5" />
      </span>
      <span className="font-medium">Keluar</span>
    </button>
  );
}
