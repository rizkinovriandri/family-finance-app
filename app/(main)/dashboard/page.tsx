import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyMembership } from "@/lib/supabase/queries/families";
import { listAccounts } from "@/lib/supabase/queries/accounts";
import { CreateFamilyForm } from "@/components/CreateFamilyForm";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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

  const accounts = await listAccounts(supabase, membership.family_id);
  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <div className="px-4 pt-8 flex flex-col gap-4">
      <div>
        <p className="text-sm text-text-secondary">Halo, {membership.display_name}</p>
        <h1 className="text-2xl font-semibold text-text-primary">Beranda</h1>
      </div>

      <Link
        href="/accounts"
        className="rounded-2xl bg-bg-surface border border-border-subtle p-4 block"
      >
        <p className="text-sm text-text-secondary">
          Total saldo · {accounts.length} akun
        </p>
        <p className="text-3xl font-bold text-text-primary mt-1">
          {formatRupiah(totalBalance)}
        </p>
      </Link>

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

      {accounts.length === 0 && (
        <p className="text-sm text-text-muted text-center mt-4">
          Belum ada akun.{" "}
          <Link href="/accounts" className="text-accent">
            Tambah akun pertama
          </Link>
        </p>
      )}

      <p className="text-sm text-text-muted text-center mt-2">
        Pencatatan transaksi menyusul.
      </p>
    </div>
  );
}
