"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/queries/auth";

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
      className="w-full rounded-xl border border-border-subtle py-3 text-danger font-medium"
    >
      Keluar
    </button>
  );
}
