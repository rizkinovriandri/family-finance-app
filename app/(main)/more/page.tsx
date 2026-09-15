import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { LogoutButton } from "@/components/LogoutButton";

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = await getMyFamilyMembership(supabase);

  return (
    <div className="px-4 pt-8 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-text-primary">Lainnya</h1>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary">Nama panggilan</p>
        <p className="text-text-primary font-medium mt-0.5">
          {membership?.display_name ?? "-"}
        </p>
        <p className="text-sm text-text-secondary mt-3">Email</p>
        <p className="text-text-primary font-medium mt-0.5">{user?.email}</p>
      </div>

      <Link
        href="/accounts"
        className="rounded-2xl bg-bg-surface border border-border-subtle p-4 text-text-primary"
      >
        Kelola akun
      </Link>

      <LogoutButton />
    </div>
  );
}
