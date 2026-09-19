"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { listAccounts, type AccountWithBalance } from "@/lib/supabase/queries/accounts";
import { getPortfolioValueByAccount } from "@/lib/supabase/queries/investments";
import { computeNetWorth } from "@/lib/utils/networth";
import { AccountTypeIcon } from "@/components/AccountTypeIcon";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function NetWorthView({
  familyId,
  initialAccounts,
  initialPortfolioValueByAccount,
}: {
  familyId: string;
  initialAccounts: AccountWithBalance[];
  initialPortfolioValueByAccount: Record<string, number>;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [portfolioValueByAccount, setPortfolioValueByAccount] = useState(
    initialPortfolioValueByAccount
  );

  async function syncAccounts() {
    const supabase = createClient();
    setAccounts(await listAccounts(supabase, familyId));
  }

  async function syncPortfolioValue() {
    const supabase = createClient();
    const map = await getPortfolioValueByAccount(supabase, familyId);
    setPortfolioValueByAccount(Object.fromEntries(map));
  }

  useRealtimeTable("accounts", familyId, syncAccounts);
  useRealtimeTable("transactions", familyId, syncAccounts);
  useRealtimeTable("investment_holdings", familyId, syncPortfolioValue);

  const netWorthByCurrency = computeNetWorth(accounts, portfolioValueByAccount);
  const primary = netWorthByCurrency.find((c) => c.currency === "IDR") ?? netWorthByCurrency[0];
  const others = netWorthByCurrency.filter((c) => c !== primary);

  if (!primary || (primary.asetAccounts.length === 0 && primary.liabilitasAccounts.length === 0)) {
    return (
      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6 text-center">
        <p className="text-sm text-text-secondary">
          Belum ada akun untuk dihitung kekayaan bersihnya.{" "}
          <Link href="/accounts" className="text-accent">
            Tambah akun
          </Link>
          .
        </p>
      </div>
    );
  }

  const grossAset = primary.tabungan + primary.investasi;
  const tabunganPct = grossAset > 0 ? Math.round((primary.tabungan / grossAset) * 100) : 0;
  const investasiPct = grossAset > 0 ? Math.round((primary.investasi / grossAset) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary">Total Kekayaan Bersih</p>
        <p
          className={`text-2xl font-bold mt-1 ${
            primary.total < 0 ? "text-danger" : "text-text-primary"
          }`}
        >
          {formatCurrency(primary.total, primary.currency)}
        </p>

        {grossAset > 0 && (
          <>
            <div className="h-1.5 rounded-full bg-bg-page mt-3 overflow-hidden flex">
              <div className="h-full bg-accent" style={{ width: `${tabunganPct}%` }} />
              <div className="h-full bg-success" style={{ width: `${investasiPct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <span className="truncate">
                  Tabungan {formatCurrency(primary.tabungan, primary.currency)}
                </span>
                <span className="text-text-muted shrink-0">({tabunganPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <span className="truncate">
                  Investasi {formatCurrency(primary.investasi, primary.currency)}
                </span>
                <span className="text-text-muted shrink-0">({investasiPct}%)</span>
              </span>
            </div>
          </>
        )}

        {primary.liabilitas > 0 && (
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-text-secondary">Liabilitas (Utang/Kartu Kredit)</span>
            <span className="text-danger font-medium">
              -{formatCurrency(primary.liabilitas, primary.currency)}
            </span>
          </div>
        )}

        {others.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border-subtle">
            <p className="text-xs text-text-muted">Mata uang lain</p>
            {others.map((c) => (
              <div key={c.currency} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{c.currency}</span>
                <span
                  className={`font-medium ${c.total < 0 ? "text-danger" : "text-text-primary"}`}
                >
                  {formatCurrency(c.total, c.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {primary.asetAccounts.length > 0 && (
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Aset</p>
          <div className="flex flex-col gap-3">
            {primary.asetAccounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <AccountTypeIcon accountType={a.accountType} className="w-9 h-9" />
                <p className="flex-1 min-w-0 text-sm text-text-primary truncate">{a.name}</p>
                <p className="text-sm font-medium text-text-primary shrink-0">
                  {formatCurrency(a.value, primary.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {primary.liabilitasAccounts.length > 0 && (
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Liabilitas</p>
          <div className="flex flex-col gap-3">
            {primary.liabilitasAccounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <AccountTypeIcon accountType={a.accountType} className="w-9 h-9" />
                <p className="flex-1 min-w-0 text-sm text-text-primary truncate">{a.name}</p>
                <p className="text-sm font-medium text-danger shrink-0">
                  -{formatCurrency(a.value, primary.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
