import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionType } from "@/lib/types/database";
import { BALANCE_ADJUSTMENT_CATEGORY_NAME, getCategoryStyle } from "@/lib/constants/enums";
import { getCycleRange, getCycleStart, shiftCycle, toLocalISODate } from "@/lib/utils/date";
import type {
  BalanceAdjustmentFormValues,
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

export async function getMonthlySummary(
  supabase: Client,
  familyId: string,
  monthStartDay: number,
  anchorDate: Date = new Date()
): Promise<MonthlySummary> {
  const { start, end } = getCycleRange(getCycleStart(anchorDate, monthStartDay), monthStartDay);

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
  const adjustmentCategoryIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    // Transfer antar akun (2 baris berpasangan) dan penyesuaian saldo bukan
    // pemasukan/pengeluaran sungguhan — tidak dihitung di ringkasan bulanan.
    if (t.transfer_pair_id) continue;
    if (adjustmentCategoryIds.has(t.category_id)) continue;

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
  monthStartDay: number,
  monthsCount = 6
): Promise<MonthlyTrendPoint[]> {
  const currentCycleStart = getCycleStart(new Date(), monthStartDay);
  const rangeStart = shiftCycle(currentCycleStart, -(monthsCount - 1));
  const rangeEndExclusive = shiftCycle(currentCycleStart, 1);

  const [{ data, error }, { data: categories, error: catError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("date, type, amount, category_id, transfer_pair_id")
      .eq("family_id", familyId)
      .gte("date", toLocalISODate(rangeStart))
      .lt("date", toLocalISODate(rangeEndExclusive)),
    supabase.from("categories").select("id, name"),
  ]);

  if (error) throw error;
  if (catError) throw catError;

  const adjustmentCategoryIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  const buckets = Array.from({ length: monthsCount }, (_, i) => ({
    cycleStart: shiftCycle(rangeStart, i),
    income: 0,
    expense: 0,
  }));

  for (const t of data) {
    // Transfer antar akun dan penyesuaian saldo bukan pemasukan/pengeluaran
    // sungguhan — lihat catatan di getMonthlySummary.
    if (t.transfer_pair_id) continue;
    if (adjustmentCategoryIds.has(t.category_id)) continue;

    const txCycleStart = getCycleStart(new Date(t.date + "T00:00:00"), monthStartDay);
    const bucketIndex =
      (txCycleStart.getFullYear() - rangeStart.getFullYear()) * 12 +
      (txCycleStart.getMonth() - rangeStart.getMonth());
    const bucket = buckets[bucketIndex];
    if (!bucket) continue;
    if (t.type === "Pemasukan") bucket.income += t.amount;
    else if (t.type === "Pengeluaran") bucket.expense += t.amount;
  }

  return buckets.map((b) => ({
    monthLabel: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(b.cycleStart),
    income: b.income,
    expense: b.expense,
  }));
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
  categoryIcon: string | null;
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
    supabase.from("categories").select("id, name, icon"),
    supabase.from("accounts").select("id, name").eq("family_id", familyId),
    supabase.from("family_members").select("id, display_name").eq("family_id", familyId),
  ]);

  if (error) throw error;
  if (catError) throw catError;
  if (accError) throw accError;
  if (memError) throw memError;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
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
    categoryName: categoryById.get(t.category_id)?.name ?? "Lainnya",
    categoryIcon: categoryById.get(t.category_id)?.icon ?? null,
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

// Koreksi saldo akun TANPA mengedit opening_balance (yang gampang bikin
// bingung — lihat riwayat perbaikan form Ubah Akun). Selisih antara saldo
// saat ini dan saldo yang seharusnya dicatat sebagai transaksi normal
// (Pemasukan kalau kurang, Pengeluaran kalau lebih), pakai kategori khusus
// "Penyesuaian Saldo" — konsisten dengan aturan CLAUDE.md Bagian 5 bahwa
// saldo akun selalu turunan dari akumulasi transaksi.
export async function createBalanceAdjustment(
  supabase: Client,
  familyId: string,
  accountId: string,
  currentBalance: number,
  input: BalanceAdjustmentFormValues
) {
  const diff = input.target_balance - currentBalance;
  if (diff === 0) {
    throw new Error("Saldo sudah sesuai — tidak ada penyesuaian yang diperlukan.");
  }
  const type: "Pemasukan" | "Pengeluaran" = diff > 0 ? "Pemasukan" : "Pengeluaran";
  const categoryType = diff > 0 ? "income" : "expense";

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("type", categoryType)
    .eq("name", BALANCE_ADJUSTMENT_CATEGORY_NAME)
    .limit(1)
    .maybeSingle();
  if (catError) throw catError;
  if (!category) {
    throw new Error("Kategori Penyesuaian Saldo tidak ditemukan.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const { error } = await supabase.from("transactions").insert({
    family_id: familyId,
    date: input.date,
    type,
    category_id: category.id,
    account_id: accountId,
    description: "Penyesuaian saldo",
    amount: Math.abs(diff),
    family_member_id: input.family_member_id,
    payment_method: "Lainnya",
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) throw error;
}
