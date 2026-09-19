import type { AccountWithBalance } from "@/lib/supabase/queries/accounts";
import type { AccountType } from "@/lib/types/database";
import { isInvestmentAccountType, isLiabilityAccountType } from "@/lib/constants/enums";

export interface NetWorthAccountEntry {
  id: string;
  name: string;
  accountType: AccountType;
  value: number;
}

export interface NetWorthBreakdown {
  currency: string;
  tabungan: number;
  investasi: number;
  liabilitas: number;
  total: number;
  asetAccounts: NetWorthAccountEntry[];
  liabilitasAccounts: NetWorthAccountEntry[];
}

// Kekayaan bersih = total aset (tabungan + investasi) - total liabilitas
// (Kartu Kredit, Pinjaman/Utang). Dipisah per mata uang karena tidak ada
// konversi kurs di app ini. Akun "Ditutup" tidak dihitung — bukan kekayaan
// aktif lagi.
export function computeNetWorth(
  accounts: AccountWithBalance[],
  portfolioValueByAccount: Record<string, number>
): NetWorthBreakdown[] {
  const map = new Map<
    string,
    {
      tabungan: number;
      investasi: number;
      liabilitas: number;
      asetAccounts: NetWorthAccountEntry[];
      liabilitasAccounts: NetWorthAccountEntry[];
    }
  >();

  for (const a of accounts) {
    if (a.status === "Ditutup") continue;
    const isInvestment = isInvestmentAccountType(a.account_type);
    const isLiability = isLiabilityAccountType(a.account_type);
    const value = isInvestment ? (portfolioValueByAccount[a.id] ?? 0) : a.current_balance;

    const entry = map.get(a.currency) ?? {
      tabungan: 0,
      investasi: 0,
      liabilitas: 0,
      asetAccounts: [],
      liabilitasAccounts: [],
    };

    if (isLiability) {
      entry.liabilitas += value;
      entry.liabilitasAccounts.push({
        id: a.id,
        name: a.name,
        accountType: a.account_type,
        value,
      });
    } else {
      if (isInvestment) entry.investasi += value;
      else entry.tabungan += value;
      entry.asetAccounts.push({
        id: a.id,
        name: a.name,
        accountType: a.account_type,
        value,
      });
    }

    map.set(a.currency, entry);
  }

  return Array.from(map.entries())
    .map(([currency, v]) => ({
      currency,
      tabungan: v.tabungan,
      investasi: v.investasi,
      liabilitas: v.liabilitas,
      total: v.tabungan + v.investasi - v.liabilitas,
      asetAccounts: v.asetAccounts.sort((a, b) => b.value - a.value),
      liabilitasAccounts: v.liabilitasAccounts.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => (a.currency === "IDR" ? -1 : b.currency === "IDR" ? 1 : 0));
}
