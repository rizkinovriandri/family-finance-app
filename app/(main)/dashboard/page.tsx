import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { CreateFamilyForm } from "@/components/CreateFamilyForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const membership = await getMyFamilyMembership(supabase);

  if (!membership) {
    return (
      <div className="px-4 pt-8">
        <CreateFamilyForm />
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 flex flex-col gap-4">
      <div>
        <p className="text-sm text-text-secondary">Halo, {membership.display_name}</p>
        <h1 className="text-2xl font-semibold text-text-primary">Beranda</h1>
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary">Total saldo semua akun</p>
        <p className="text-3xl font-bold text-text-primary mt-1">Rp 0</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm text-text-secondary">Pemasukan bulan ini</p>
          <p className="text-xl font-semibold text-success mt-1">Rp 0</p>
        </div>
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm text-text-secondary">Pengeluaran bulan ini</p>
          <p className="text-xl font-semibold text-danger mt-1">Rp 0</p>
        </div>
      </div>

      <p className="text-sm text-text-muted text-center mt-4">
        Belum ada akun & transaksi — fitur ini menyusul.
      </p>
    </div>
  );
}
