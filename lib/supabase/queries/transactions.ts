import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionType } from "@/lib/types/database";
import { getCategoryStyle } from "@/lib/constants/enums";
import { toLocalISODate } from "@/lib/utils/date";
import type {
  TransactionFormValues,
  TransferFormValues,
} from "@/lib/validation/transaction";

type Client = SupabaseClient<Database>;

export interface CategorySlice {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  categories: CategorySlice[];
}

function monthRange(monthStart: Date) {
  const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  return { start: toLocalISODate(start), end: toLocalISODate(end) };
}

export async function getMonthlySummary(
  supabase: Client,
  familyId: string,
  monthStart: Date = new Date()
): Promise<MonthlySummary> {
  const { start, end } = monthRange(monthStart);

  const [{ data: transactions, error: txError }, { data: categories, error: catError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount, category_id, transfer_pair_id")
        .eq("family_id", familyId)
        .gte("date", start)
        .lt("date", end),
      supabase.from("categories").select("id, name"),
    ]);

  if (txError) throw txError;
  if (catError) throw catError;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    // Transfer antar akun (2 baris berpasangan) bukan pemasukan/pengeluaran
    // asli — cuma perpindahan uang antar akun sendiri, jadi tidak dihitung
    // di ringkasan bulanan.
    if (t.transfer_pair_id) continue;

    if (t.type === "Pemasukan") {
      totalIncome += t.amount;
    } else if (t.type === "Pengeluaran") {
      totalExpense += t.amount;
      expenseByCategory.set(
        t.category_id,
        (expenseByCategory.get(t.category_id) ?? 0) + t.amount
      );
    }
  }

  const categorySlices: CategorySlice[] = Array.from(expenseByCategory.entries())
    .map(([categoryId, amount]) => {
      const categoryName = categoryNameById.get(categoryId) ?? "Lainnya";
      return {
        categoryId,
        categoryName,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color: getCategoryStyle(categoryName).bright,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { totalIncome, totalExpense, categories: categorySlices };
}

export interface MonthlyTrendPoint {
  monthLabel: string;
  income: number;
  expense: number;
}

export async function getMonthlyTrend(
  supabase: Client,
  familyId: string,
  monthsCount = 6
): Promise<MonthlyTrendPoint[]> {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const rangeEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data, error } = await supabase
    .from("transactions")
    .select("date, type, amount, transfer_pair_id")
    .eq("family_id", familyId)
    .gte("date", toLocalISODate(rangeStart))
    .lt("date", toLocalISODate(rangeEndExclusive));

  if (error) throw error;

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { income: 0, expense: 0 });
  }

  for (const t of data) {
    // Transfer antar akun bukan pemasukan/pengeluaran asli — lihat catatan
    // di getMonthlySummary.
    if (t.transfer_pair_id) continue;

    const d = new Date(t.date + "T00:00:00");
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;
    if (t.type === "Pemasukan") bucket.income += t.amount;
    else if (t.type === "Pengeluaran") bucket.expense += t.amount;
  }

  return Array.from(buckets.entries()).map(([key, v]) => {
    const [year, month] = key.split("-").map(Number);
    const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
      new Date(year, month, 1)
    );
    return { monthLabel, income: v.income, expense: v.expense };
  });
}

export interface TransactionWithDetails {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  notes: string | null;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  memberName: string;
  transferPairId: string | null;
}

export async function listTransactions(
  supabase: Client,
  familyId: string
): Promise<TransactionWithDetails[]> {
  const [
    { data: transactions, error },
    { data: categories, error: catError },
    { data: accounts, error: accError },
    { data: members, error: memError },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("family_id", familyId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name"),
    supabase.from("accounts").select("id, name").eq("family_id", familyId),
    supabase.from("family_members").select("id, display_name").eq("family_id", familyId),
  ]);

  if (error) throw error;
  if (catError) throw catError;
  if (accError) throw accError;
  if (memError) throw memError;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
  const memberNameById = new Map(members.map((m) => [m.id, m.display_name]));

  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    amount: t.amount,
    description: t.description,
    notes: t.notes,
    categoryId: t.category_id,
    categoryName: categoryNameById.get(t.category_id) ?? "Lainnya",
    accountId: t.account_id,
    accountName: accountNameById.get(t.account_id) ?? "-",
    memberName: memberNameById.get(t.family_member_id) ?? "-",
    transferPairId: t.transfer_pair_id,
  }));
}

export async function createTransaction(
  supabase: Client,
  familyId: string,
  input: TransactionFormValues
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const { error } = await supabase.from("transactions").insert({
    family_id: familyId,
    date: input.date,
    type: input.type,
    category_id: input.category_id,
    account_id: input.account_id,
    description: input.description || null,
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: input.payment_method,
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) throw error;
}

export async function updateTransaction(
  supabase: Client,
  id: string,
  input: TransactionFormValues
) {
  const { error } = await supabase
    .from("transactions")
    .update({
      date: input.date,
      type: input.type,
      category_id: input.category_id,
      account_id: input.account_id,
      description: input.description || null,
      amount: input.amount,
      family_member_id: input.family_member_id,
      payment_method: input.payment_method,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(
  supabase: Client,
  id: string,
  transferPairId: string | null
) {
  const idsToDelete = transferPairId ? [id, transferPairId] : [id];
  const { error } = await supabase.from("transactions").delete().in("id", idsToDelete);
  if (error) throw error;
}

// Transfer dicatat sebagai 2 baris (Pengeluaran dari akun asal, Pemasukan ke
// akun tujuan) yang saling terhubung lewat transfer_pair_id — sesuai aturan
// bisnis di CLAUDE.md Bagian 5. FK transfer_pair_id butuh baris lain sudah
// ada dulu, jadi baris "keluar" di-insert tanpa pair, baru di-link belakangan
// setelah baris "masuk" berhasil dibuat.
export async function createTransfer(
  supabase: Client,
  familyId: string,
  input: TransferFormValues
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const { data: transferCategory, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("type", "transfer")
    .limit(1)
    .maybeSingle();
  if (catError) throw catError;
  if (!transferCategory) {
    throw new Error("Kategori Transfer Antar Akun tidak ditemukan");
  }

  const outId = crypto.randomUUID();
  const inId = crypto.randomUUID();

  const { error: outError } = await supabase.from("transactions").insert({
    id: outId,
    family_id: familyId,
    date: input.date,
    type: "Pengeluaran",
    category_id: transferCategory.id,
    account_id: input.from_account_id,
    description: "Transfer keluar",
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: "Transfer Bank",
    notes: input.notes || null,
    created_by: user.id,
  });
  if (outError) throw outError;

  const { error: inError } = await supabase.from("transactions").insert({
    id: inId,
    family_id: familyId,
    date: input.date,
    type: "Pemasukan",
    category_id: transferCategory.id,
    account_id: input.to_account_id,
    description: "Transfer masuk",
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: "Transfer Bank",
    notes: input.notes || null,
    transfer_pair_id: outId,
    created_by: user.id,
  });
  if (inError) {
    await supabase.from("transactions").delete().eq("id", outId);
    throw inError;
  }

  const { error: linkError } = await supabase
    .from("transactions")
    .update({ transfer_pair_id: inId })
    .eq("id", outId);
  if (linkError) throw linkError;
}
