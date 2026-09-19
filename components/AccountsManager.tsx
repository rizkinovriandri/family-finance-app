"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type AccountWithBalance,
} from "@/lib/supabase/queries/accounts";
import { createBalanceAdjustment } from "@/lib/supabase/queries/transactions";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import {
  accountSchema,
  type AccountFormValues,
} from "@/lib/validation/account";
import {
  balanceAdjustmentSchema,
  type BalanceAdjustmentFormValues,
} from "@/lib/validation/transaction";
import { toLocalISODate } from "@/lib/utils/date";
import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUSES,
  CURRENCIES,
  isInvestmentAccountType as isInvestmentType,
} from "@/lib/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";
import { UserIcon, LineChartIcon, ChevronRightIcon } from "@/components/icons";
import { AccountTypeIcon } from "@/components/AccountTypeIcon";
import { Field } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import {
  InvestmentHoldingFields,
  EMPTY_HOLDING_FIELDS,
  type HoldingFieldsState,
} from "@/components/InvestmentHoldingFields";
import { holdingSchema } from "@/lib/validation/investment";
import { createHolding, getPortfolioValueByAccount } from "@/lib/supabase/queries/investments";
import { refreshStockPrices } from "@/lib/utils/refreshStockPrices";
import { computeNetWorth } from "@/lib/utils/networth";
import type { InvestmentCategory } from "@/lib/types/database";

type Member = { id: string; display_name: string };
type Tab = "Tabungan" | "Investasi";

// Jenis akun investasi (dari CLAUDE.md Bagian 5) yang punya padanan langsung
// ke kategori investment_holdings (Bagian 4). "Investasi Kripto" sengaja
// tidak dipetakan — belum masuk 4 kategori holding yang dirancang.
const ACCOUNT_TYPE_TO_CATEGORY: Partial<Record<string, InvestmentCategory>> = {
  "Investasi Saham": "saham",
  "Investasi Reksadana": "reksadana",
  "Investasi Obligasi": "obligasi_sukuk",
  "Investasi Emas": "emas",
};

const EMPTY_FORM: AccountFormValues = {
  name: "",
  account_type: "Tabungan",
  institution: "",
  account_identifier: "",
  owner_member_id: "",
  currency: "IDR",
  opening_balance: 0,
  status: "Aktif",
  priority_goal: "",
  notes: "",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountsManager({
  familyId,
  members,
  initialAccounts,
  initialPortfolioValueByAccount,
}: {
  familyId: string;
  members: Member[];
  initialAccounts: AccountWithBalance[];
  initialPortfolioValueByAccount: Record<string, number>;
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [portfolioValueByAccount, setPortfolioValueByAccount] = useState(
    initialPortfolioValueByAccount
  );
  const [tab, setTab] = useState<Tab>("Tabungan");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCurrentBalance, setEditingCurrentBalance] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AccountFormValues>(EMPTY_FORM);
  const [holdingName, setHoldingName] = useState("");
  const [holdingFields, setHoldingFields] = useState<HoldingFieldsState>(EMPTY_HOLDING_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [adjustingAccount, setAdjustingAccount] = useState<AccountWithBalance | null>(null);
  const [adjustForm, setAdjustForm] = useState<BalanceAdjustmentFormValues>({
    target_balance: 0,
    family_member_id: "",
    date: toLocalISODate(new Date()),
    notes: "",
  });
  const [adjustFieldErrors, setAdjustFieldErrors] = useState<Record<string, string>>({});
  const [adjustSubmitError, setAdjustSubmitError] = useState<string | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const memberNameById = new Map(members.map((m) => [m.id, m.display_name]));

  // Net worth per mata uang — dipisah karena tidak ada konversi kurs di app
  // ini, jadi Rp dan mis. USD tidak bisa asal dijumlah jadi satu angka.
  const netWorthByCurrency = useMemo(
    () => computeNetWorth(accounts, portfolioValueByAccount),
    [accounts, portfolioValueByAccount]
  );

  const primaryNetWorth = netWorthByCurrency.find((c) => c.currency === "IDR") ?? netWorthByCurrency[0];
  const otherNetWorth = netWorthByCurrency.filter((c) => c !== primaryNetWorth);
  // Persentase dihitung dari total aset kotor (bukan net worth) supaya tetap
  // masuk akal 0-100% walau ada liabilitas yang mengurangi net worth.
  const grossAset = primaryNetWorth ? primaryNetWorth.tabungan + primaryNetWorth.investasi : 0;
  const tabunganPct =
    primaryNetWorth && grossAset > 0
      ? Math.round((primaryNetWorth.tabungan / grossAset) * 100)
      : 0;
  const investasiPct =
    primaryNetWorth && grossAset > 0
      ? Math.round((primaryNetWorth.investasi / grossAset) * 100)
      : 0;

  const filteredAccounts = accounts.filter(
    (a) => isInvestmentType(a.account_type) === (tab === "Investasi")
  );
  const availableTypes = ACCOUNT_TYPES.filter(
    (t) => isInvestmentType(t) === (tab === "Investasi")
  );
  const isInvestmentForm = isInvestmentType(form.account_type);
  const holdingCategory = ACCOUNT_TYPE_TO_CATEGORY[form.account_type];

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
  // Saldo dihitung dari transaksi (view account_balances), jadi ikut
  // resync begitu ada transaksi baru/berubah/terhapus di family ini.
  useRealtimeTable("transactions", familyId, syncAccounts);
  // Nilai akun investasi dihitung dari holding, bukan transaksi kas — ikut
  // resync begitu holding di Portofolio berubah.
  useRealtimeTable("investment_holdings", familyId, syncPortfolioValue);

  // Begitu halaman Akun dibuka, update harga semua holding Saham dari Yahoo
  // Finance di background (tidak perlu tombol manual). Realtime subscription
  // di atas otomatis menangkap hasilnya dan me-refresh nilai portofolio.
  useEffect(() => {
    const supabase = createClient();
    refreshStockPrices(supabase, familyId).catch(() => {
      // Diamkan — kegagalan refresh harga (mis. offline/Yahoo down) tidak
      // boleh mengganggu penggunaan halaman Akun; harga lama tetap dipakai.
    });
  }, [familyId]);

  function openCreateForm() {
    setEditingId(null);
    setEditingCurrentBalance(null);
    setForm({
      ...EMPTY_FORM,
      account_type: tab === "Investasi" ? "Investasi Saham" : "Tabungan",
    });
    setHoldingName("");
    setHoldingFields(EMPTY_HOLDING_FIELDS);
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function openEditForm(account: AccountWithBalance) {
    setEditingId(account.id);
    setEditingCurrentBalance(account.current_balance);
    setForm({
      name: account.name,
      account_type: account.account_type,
      institution: account.institution ?? "",
      account_identifier: account.account_identifier ?? "",
      owner_member_id: account.owner_member_id ?? "",
      currency: account.currency,
      opening_balance: account.opening_balance,
      status: account.status,
      priority_goal: account.priority_goal ?? "",
      notes: account.notes ?? "",
    });
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = accountSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    // Akun investasi baru (bukan edit) sekaligus mengisi holding pertamanya —
    // field-nya divalidasi juga sebelum menyimpan apa pun, supaya tidak
    // kejadian akun sudah dibuat tapi holding-nya gagal simpan.
    const shouldCreateHolding = !editingId && isInvestmentForm && holdingCategory;
    let holdingValues = null;
    if (shouldCreateHolding) {
      const holdingResult = holdingSchema.safeParse({
        category: holdingCategory,
        name: holdingName,
        ...holdingFields,
      });
      if (!holdingResult.success) {
        const errors: Record<string, string> = {};
        for (const issue of holdingResult.error.issues) {
          errors[String(issue.path[0])] = issue.message;
        }
        setFieldErrors(errors);
        return;
      }
      holdingValues = holdingResult.data;
    }

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (editingId) {
        await updateAccount(supabase, editingId, result.data);
        await syncAccounts();
        setShowForm(false);
      } else {
        const created = await createAccount(supabase, familyId, result.data);
        if (holdingValues) {
          await createHolding(supabase, familyId, created.id, holdingValues);
        }
        setShowForm(false);
        if (isInvestmentForm) {
          // Arahkan ke Portofolio — kalau holding pertama sudah diisi, akan
          // langsung terlihat di sana; kalau belum (mis. Investasi Kripto,
          // belum ada kategori holding yang cocok), user bisa tambah manual.
          router.push(`/accounts/${created.id}/holdings`);
          return;
        }
        await syncAccounts();
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal menyimpan akun."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm("Hapus akun ini? Transaksi yang terhubung juga akan terhapus.")) {
      return;
    }
    const supabase = createClient();
    await deleteAccount(supabase, accountId);
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  }

  function openAdjustForm(account: AccountWithBalance) {
    setAdjustingAccount(account);
    setAdjustForm({
      target_balance: account.current_balance,
      family_member_id: members[0]?.id ?? "",
      date: toLocalISODate(new Date()),
      notes: "",
    });
    setAdjustFieldErrors({});
    setAdjustSubmitError(null);
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingAccount) return;

    const result = balanceAdjustmentSchema.safeParse(adjustForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setAdjustFieldErrors(errors);
      return;
    }

    setAdjustFieldErrors({});
    setAdjustSubmitError(null);
    setAdjustLoading(true);
    try {
      const supabase = createClient();
      await createBalanceAdjustment(
        supabase,
        familyId,
        adjustingAccount.id,
        adjustingAccount.current_balance,
        result.data
      );
      await syncAccounts();
      setAdjustingAccount(null);
    } catch (err) {
      setAdjustSubmitError(
        err instanceof Error ? err.message : "Gagal menyimpan penyesuaian saldo."
      );
    } finally {
      setAdjustLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-text-primary">Akun</h1>

      {primaryNetWorth && (
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm text-text-secondary">Total Kekayaan Bersih</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatCurrency(primaryNetWorth.total, primaryNetWorth.currency)}
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
                    Tabungan {formatCurrency(primaryNetWorth.tabungan, primaryNetWorth.currency)}
                  </span>
                  <span className="text-text-muted shrink-0">({tabunganPct}%)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  <span className="truncate">
                    Investasi {formatCurrency(primaryNetWorth.investasi, primaryNetWorth.currency)}
                  </span>
                  <span className="text-text-muted shrink-0">({investasiPct}%)</span>
                </span>
              </div>
            </>
          )}

          {primaryNetWorth.liabilitas > 0 && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-text-secondary">Liabilitas (Utang/Kartu Kredit)</span>
              <span className="text-danger font-medium">
                -{formatCurrency(primaryNetWorth.liabilitas, primaryNetWorth.currency)}
              </span>
            </div>
          )}

          {otherNetWorth.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border-subtle">
              <p className="text-xs text-text-muted">Mata uang lain</p>
              {otherNetWorth.map((c) => (
                <div key={c.currency} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{c.currency}</span>
                  <span className="text-text-primary font-medium">
                    {formatCurrency(c.total, c.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex rounded-xl bg-bg-surface border border-border-subtle p-1">
        {(["Tabungan", "Investasi"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${
              tab === t ? "bg-accent text-white" : "text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredAccounts.length === 0 && !showForm && (
        <p className="text-sm text-text-muted text-center mt-6">
          {tab === "Investasi"
            ? "Belum ada akun investasi."
            : "Belum ada akun. Tambah akun pertama kamu."}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filteredAccounts.map((account) => {
          const displayValue = isInvestmentType(account.account_type)
            ? (portfolioValueByAccount[account.id] ?? 0)
            : account.current_balance;
          return (
          <div
            key={account.id}
            className="rounded-xl bg-bg-surface border border-border-subtle p-3 flex items-center gap-3"
          >
            <AccountTypeIcon accountType={account.account_type} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-primary truncate">
                  {account.name}
                </p>
                <p className="text-sm font-semibold text-text-primary shrink-0">
                  {formatCurrency(displayValue, account.currency)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs text-text-secondary truncate">
                  {account.account_type}
                  {account.institution ? ` · ${account.institution}` : ""}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {account.owner_member_id &&
                    memberNameById.get(account.owner_member_id) && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-text-secondary">
                        <UserIcon className="w-3 h-3" />
                        {memberNameById.get(account.owner_member_id)}
                      </span>
                    )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      account.status === "Aktif"
                        ? "bg-success/15 text-success"
                        : "bg-text-muted/15 text-text-muted"
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
              </div>

              {isInvestmentType(account.account_type) && (
                <Link
                  href={`/accounts/${account.id}/holdings`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-accent/10 text-accent px-2.5 py-1.5 mt-2"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <LineChartIcon className="w-3.5 h-3.5" />
                    Lihat Portofolio
                  </span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              )}

              <div className="flex gap-3 mt-1">
                <Link
                  href={`/accounts/${account.id}/history`}
                  className="text-xs text-accent"
                >
                  Riwayat
                </Link>
                {!isInvestmentType(account.account_type) && (
                  <button
                    onClick={() => openAdjustForm(account)}
                    className="text-xs text-accent"
                  >
                    Sesuaikan Saldo
                  </button>
                )}
                <button
                  onClick={() => openEditForm(account)}
                  className="text-xs text-accent"
                >
                  Ubah
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-xs text-danger"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-primary">
            {editingId ? "Ubah akun" : `Tambah akun ${tab}`}
          </h2>

          <Field label="Nama akun" error={fieldErrors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder={
                isInvestmentForm ? 'mis. "RDN Mirae Asset", "Bibit"' : 'mis. "BCA Tabungan"'
              }
            />
          </Field>

          <Field label="Jenis akun" error={fieldErrors.account_type}>
            <select
              value={form.account_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  account_type: e.target.value as AccountFormValues["account_type"],
                })
              }
              className="input"
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          {!editingId && isInvestmentForm && holdingCategory && (
            <>
              <p className="text-xs text-text-muted -mt-1">
                Isi holding pertama untuk akun ini sekalian — bisa tambah lagi nanti di
                Portofolio.
              </p>

              <Field label="Nama instrumen" error={fieldErrors.name}>
                <input
                  value={holdingName}
                  onChange={(e) => setHoldingName(e.target.value)}
                  className="input"
                  placeholder='mis. "BBCA", "ORI023", "Manulife Dana Saham"'
                />
              </Field>

              <InvestmentHoldingFields
                category={holdingCategory}
                value={holdingFields}
                onChange={setHoldingFields}
                errors={fieldErrors}
              />
            </>
          )}

          {!editingId && isInvestmentForm && !holdingCategory && (
            <p className="text-xs text-text-muted -mt-1">
              Jenis akun ini belum punya form holding khusus — buat akunnya dulu, isi
              detail investasinya nanti lewat halaman Portofolio.
            </p>
          )}

          {!isInvestmentForm && (
            <Field label="Institusi/Bank (opsional)" error={fieldErrors.institution}>
              <input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                className="input"
                placeholder='mis. "Bank BCA"'
              />
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="No. Rekening (opsional)" error={fieldErrors.account_identifier}>
              <input
                value={form.account_identifier}
                onChange={(e) => setForm({ ...form, account_identifier: e.target.value })}
                className="input"
              />
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="Pemilik" error={fieldErrors.owner_member_id}>
              <select
                value={form.owner_member_id}
                onChange={(e) =>
                  setForm({ ...form, owner_member_id: e.target.value })
                }
                className="input"
              >
                <option value="">-</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="Mata uang" error={fieldErrors.currency}>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currency: e.target.value as AccountFormValues["currency"],
                  })
                }
                className="input"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {!isInvestmentForm && editingId && editingCurrentBalance !== null && (
            <div className="rounded-xl bg-bg-page px-3.5 py-2.5 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Saldo saat ini</span>
              <span className="text-text-primary font-medium">
                {formatCurrency(editingCurrentBalance, form.currency)}
              </span>
            </div>
          )}

          {!isInvestmentForm && (
            <Field label="Saldo awal" error={fieldErrors.opening_balance}>
              <CurrencyInput
                value={form.opening_balance}
                currency={form.currency}
                onChange={(opening_balance) =>
                  setForm({ ...form, opening_balance })
                }
              />
              <p className="text-xs text-text-muted mt-1.5">
                {editingId
                  ? "Saldo sebelum transaksi pertama tercatat — bukan saldo saat ini. Mengubah ini akan ikut mengubah saldo saat ini (di atas), karena saldo saat ini = saldo awal + akumulasi transaksi."
                  : "Saldo saat akun ini mulai dipakai, sebelum ada transaksi apa pun."}
              </p>
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="Status" error={fieldErrors.status}>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as AccountFormValues["status"],
                  })
                }
                className="input"
              >
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="Tujuan menabung (opsional)" error={fieldErrors.priority_goal}>
              <input
                value={form.priority_goal}
                onChange={(e) => setForm({ ...form, priority_goal: e.target.value })}
                className="input"
                placeholder='mis. "Dana darurat", "DP rumah"'
              />
            </Field>
          )}

          {!isInvestmentForm && (
            <Field label="Catatan (opsional)" error={fieldErrors.notes}>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                rows={2}
              />
            </Field>
          )}

          {submitError && <p className="text-sm text-danger">{submitError}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-border-subtle py-3 text-text-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={adjustingAccount !== null} onClose={() => setAdjustingAccount(null)}>
        {adjustingAccount && (
          <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-text-primary">
              Sesuaikan Saldo — {adjustingAccount.name}
            </h2>
            <p className="text-xs text-text-muted -mt-1">
              Selisihnya akan dicatat otomatis sebagai transaksi Pemasukan/Pengeluaran
              berkategori &quot;Penyesuaian Saldo&quot;, bukan mengubah Saldo Awal.
            </p>

            <div className="rounded-xl bg-bg-page px-3.5 py-2.5 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Saldo saat ini</span>
              <span className="text-text-primary font-medium">
                {formatCurrency(adjustingAccount.current_balance, adjustingAccount.currency)}
              </span>
            </div>

            <Field label="Saldo seharusnya" error={adjustFieldErrors.target_balance}>
              <CurrencyInput
                value={adjustForm.target_balance}
                currency={adjustingAccount.currency}
                onChange={(target_balance) =>
                  setAdjustForm({ ...adjustForm, target_balance })
                }
              />
            </Field>

            {adjustForm.target_balance !== adjustingAccount.current_balance && (
              <p
                className={`text-xs -mt-1 ${
                  adjustForm.target_balance > adjustingAccount.current_balance
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                Akan dicatat sebagai{" "}
                {adjustForm.target_balance > adjustingAccount.current_balance
                  ? "Pemasukan"
                  : "Pengeluaran"}{" "}
                sebesar{" "}
                {formatCurrency(
                  Math.abs(adjustForm.target_balance - adjustingAccount.current_balance),
                  adjustingAccount.currency
                )}
              </p>
            )}

            <Field label="Tanggal" error={adjustFieldErrors.date}>
              <input
                type="date"
                value={adjustForm.date}
                onChange={(e) => setAdjustForm({ ...adjustForm, date: e.target.value })}
                className="input"
              />
            </Field>

            <Field label="Dicatat oleh" error={adjustFieldErrors.family_member_id}>
              <select
                value={adjustForm.family_member_id}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, family_member_id: e.target.value })
                }
                className="input"
              >
                <option value="">-</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Catatan (opsional)" error={adjustFieldErrors.notes}>
              <textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                className="input"
                rows={2}
                placeholder="mis. Koreksi setelah rekonsiliasi rekening"
              />
            </Field>

            {adjustSubmitError && <p className="text-sm text-danger">{adjustSubmitError}</p>}

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setAdjustingAccount(null)}
                className="flex-1 rounded-xl border border-border-subtle py-3 text-text-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={adjustLoading || adjustForm.target_balance === adjustingAccount.current_balance}
                className="flex-1 rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
              >
                {adjustLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {!showForm && (
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-accent py-3 text-white font-medium"
        >
          + Tambah Akun {tab}
        </button>
      )}
    </div>
  );
}
