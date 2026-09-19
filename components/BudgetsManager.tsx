"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createBudget,
  deleteBudget,
  duplicateBudgetsToNextMonth,
  listBudgetsForMonth,
  statusFor,
  updateBudget,
  type BudgetWithRealization,
} from "@/lib/supabase/queries/budgets";
import { budgetSchema, type BudgetFormValues } from "@/lib/validation/budget";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Modal } from "@/components/Modal";
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/queries/categories";
import type { Subcategory } from "@/lib/supabase/queries/subcategories";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { formatCycleLabel, shiftCycle } from "@/lib/utils/date";

const CATEGORY_LEVEL_OPTION_ID = "";
const CATEGORY_LEVEL_LABEL = "Kategori Utama (semua sub kategori)";

function budgetKey(categoryId: string, subcategoryId: string | null) {
  return `${categoryId}:${subcategoryId ?? ""}`;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLE: Record<BudgetWithRealization["status"], string> = {
  Aman: "bg-success/15 text-success",
  Waspada: "bg-accent/15 text-accent",
  Melebihi: "bg-danger/15 text-danger",
};

export function BudgetsManager({
  familyId,
  monthStartDay,
  categories,
  subcategories,
  initialBudgets,
  initialMonth,
}: {
  familyId: string;
  monthStartDay: number;
  categories: Category[];
  subcategories: Subcategory[];
  initialBudgets: BudgetWithRealization[];
  initialMonth: string;
}) {
  const [monthDate, setMonthDate] = useState(new Date(initialMonth + "T00:00:00"));
  const [budgets, setBudgets] = useState(initialBudgets);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetWithRealization | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState(CATEGORY_LEVEL_OPTION_ID);
  const [targetAmount, setTargetAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const monthLabel = formatCycleLabel(monthDate, monthStartDay);

  // Kategori ditampilkan sebagai satu baris induk (ringkasan), rincian per
  // budget (level kategori "Kategori Utama" + tiap sub kategori) baru
  // muncul saat di-expand. Kalau ada budget level kategori, ringkasannya
  // pakai nilai itu langsung (realisasi-nya sudah roll-up semua transaksi
  // di kategori itu apa pun sub kategorinya — lihat budget_realizations).
  // Kalau tidak ada, ringkasan dijumlah dari semua budget sub kategorinya.
  const categoryGroups = useMemo(() => {
    const byCategory = new Map<string, BudgetWithRealization[]>();
    for (const b of budgets) {
      const list = byCategory.get(b.categoryId) ?? [];
      list.push(b);
      byCategory.set(b.categoryId, list);
    }

    return Array.from(byCategory.entries())
      .map(([catId, entries]) => {
        const categoryLevel = entries.find((e) => e.subcategoryId === null);
        const summaryTarget = categoryLevel
          ? categoryLevel.targetAmount
          : entries.reduce((sum, e) => sum + e.targetAmount, 0);
        const summaryRealisasi = categoryLevel
          ? categoryLevel.realisasi
          : entries.reduce((sum, e) => sum + e.realisasi, 0);
        const summaryPercentage =
          summaryTarget > 0 ? Math.round((summaryRealisasi / summaryTarget) * 100) : 0;

        const sortedEntries = [...entries].sort((a, b) => {
          if (a.subcategoryId === null) return -1;
          if (b.subcategoryId === null) return 1;
          return (a.subcategoryName ?? "").localeCompare(b.subcategoryName ?? "");
        });

        return {
          categoryId: catId,
          categoryName: entries[0].categoryName,
          categoryIcon: entries[0].categoryIcon,
          entries: sortedEntries,
          summaryTarget,
          summaryRealisasi,
          summaryPercentage,
          summaryStatus: statusFor(summaryPercentage),
        };
      })
      .sort((a, b) => b.summaryPercentage - a.summaryPercentage);
  }, [budgets]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  // Budget yang lagi diedit dikecualikan dari daftar "sudah dipakai" supaya
  // sub kategori/level yang sedang dipakainya sendiri tetap muncul sebagai
  // pilihan (bukan cuma opsi yang belum dipakai budget LAIN).
  const budgetedKeys = new Set(
    budgets.filter((b) => b.id !== editing?.id).map((b) => budgetKey(b.categoryId, b.subcategoryId))
  );

  // Kategori masih "tersedia" untuk dibuatkan budget baru selama masih ada
  // slot kosong — baik level kategori (rollup semua sub kategori) maupun
  // salah satu sub kategorinya — yang belum dipakai bulan ini.
  const availableCategories = expenseCategories.filter((c) => {
    const subs = subcategories.filter((s) => s.categoryId === c.id);
    const totalSlots = 1 + subs.length;
    const usedSlots = budgets.filter((b) => b.categoryId === c.id).length;
    return usedSlots < totalSlots;
  });

  const categorySubcategories = subcategories.filter((s) => s.categoryId === categoryId);
  const subcategoryOptions = [
    { id: CATEGORY_LEVEL_OPTION_ID, name: CATEGORY_LEVEL_LABEL },
    ...categorySubcategories,
  ].filter((opt) => !budgetedKeys.has(budgetKey(categoryId, opt.id || null)));

  function handleCategoryIdChange(id: string) {
    setCategoryId(id);
    const subs = subcategories.filter((s) => s.categoryId === id);
    const options = [{ id: CATEGORY_LEVEL_OPTION_ID, name: CATEGORY_LEVEL_LABEL }, ...subs].filter(
      (opt) => !budgetedKeys.has(budgetKey(id, opt.id || null))
    );
    setSubcategoryId(options[0]?.id ?? CATEGORY_LEVEL_OPTION_ID);
  }

  async function loadMonth(date: Date) {
    const supabase = createClient();
    setBudgets(await listBudgetsForMonth(supabase, familyId, date, monthStartDay));
  }

  useRealtimeTable("budgets", familyId, () => loadMonth(monthDate));
  // Realisasi dihitung dari transaksi (view budget_realizations), jadi ikut
  // resync begitu ada transaksi baru/berubah/terhapus di family ini.
  useRealtimeTable("transactions", familyId, () => loadMonth(monthDate));

  function shiftMonth(delta: number) {
    const next = shiftCycle(monthDate, delta);
    setMonthDate(next);
    setShowForm(false);
    setEditing(null);
    loadMonth(next);
  }

  async function handleDuplicate() {
    if (budgets.length === 0 || duplicating) return;

    const nextMonthDate = shiftCycle(monthDate, 1);
    const nextMonthLabel = formatCycleLabel(nextMonthDate, monthStartDay);

    if (
      !confirm(
        `Duplikasi ${budgets.length} anggaran ke ${nextMonthLabel}? Kategori yang sudah punya anggaran di bulan itu akan dilewati.`
      )
    ) {
      return;
    }

    setDuplicating(true);
    try {
      const supabase = createClient();
      const result = await duplicateBudgetsToNextMonth(
        supabase,
        familyId,
        monthDate,
        monthStartDay
      );
      setMonthDate(nextMonthDate);
      setShowForm(false);
      setEditing(null);
      await loadMonth(nextMonthDate);

      if (result.inserted === 0) {
        alert(`Semua kategori sudah punya anggaran di ${nextMonthLabel}.`);
      } else if (result.skipped > 0) {
        alert(
          `${result.inserted} anggaran diduplikasi ke ${nextMonthLabel}, ${result.skipped} dilewati (sudah ada).`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menduplikasi anggaran.");
    } finally {
      setDuplicating(false);
    }
  }

  function openCreateForm() {
    setEditing(null);
    const firstCategoryId = availableCategories[0]?.id ?? "";
    handleCategoryIdChange(firstCategoryId);
    setTargetAmount(0);
    setNotes("");
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function openEditForm(budget: BudgetWithRealization) {
    setEditing(budget);
    setCategoryId(budget.categoryId);
    setSubcategoryId(budget.subcategoryId ?? CATEGORY_LEVEL_OPTION_ID);
    setTargetAmount(budget.targetAmount);
    setNotes(budget.notes ?? "");
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values: BudgetFormValues = {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      target_amount: targetAmount,
      notes,
    };
    const result = budgetSchema.safeParse(values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (editing) {
        await updateBudget(supabase, editing.id, result.data);
      } else {
        await createBudget(supabase, familyId, monthDate, result.data, monthStartDay);
      }
      await loadMonth(monthDate);
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan anggaran.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus anggaran ini?")) return;
    const supabase = createClient();
    await deleteBudget(supabase, id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-text-primary">Budget</h1>

      <div className="flex items-center justify-between rounded-xl bg-bg-surface border border-border-subtle px-3 py-2">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">{monthLabel}</span>
        <button
          onClick={() => shiftMonth(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
          aria-label="Bulan berikutnya"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {budgets.length > 0 && (
        <button
          onClick={handleDuplicate}
          disabled={duplicating}
          className="flex items-center justify-center gap-2 text-sm text-accent disabled:opacity-60"
        >
          <CopyIcon className="w-4 h-4" />
          {duplicating ? "Menduplikasi..." : "Duplikasi ke bulan berikutnya"}
        </button>
      )}

      {budgets.length === 0 && !showForm && (
        <p className="text-sm text-text-muted text-center mt-6">
          Belum ada anggaran bulan ini.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {categoryGroups.map((g) => {
          const expanded = expandedCategoryId === g.categoryId;
          const barPercentage = Math.min(g.summaryPercentage, 100);
          return (
            <div
              key={g.categoryId}
              className="rounded-xl bg-bg-surface border border-border-subtle p-3 flex flex-col gap-3"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedCategoryId((prev) => (prev === g.categoryId ? null : g.categoryId))
                }
                className="flex items-center gap-3 text-left"
              >
                <CategoryIcon name={g.categoryName} icon={g.categoryIcon} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {g.categoryName}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[g.summaryStatus]}`}
                    >
                      {g.summaryStatus}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatRupiah(g.summaryRealisasi)} / {formatRupiah(g.summaryTarget)}
                  </p>
                </div>
                <ChevronRightIcon
                  className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              <div className="h-1.5 rounded-full bg-bg-page overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    g.summaryStatus === "Melebihi" ? "bg-danger" : "bg-success"
                  }`}
                  style={{ width: `${barPercentage}%` }}
                />
              </div>

              {expanded && (
                <div className="pl-11 flex flex-col gap-3 border-t border-border-subtle pt-3">
                  {g.entries.map((b) => {
                    const entryBarPercentage = Math.min(b.percentage, 100);
                    return (
                      <div key={b.id}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {b.subcategoryName ?? "Kategori Utama"}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[b.status]}`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {formatRupiah(b.realisasi)} / {formatRupiah(b.targetAmount)}
                        </p>
                        <div className="h-1 rounded-full bg-bg-page mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.status === "Melebihi" ? "bg-danger" : "bg-success"
                            }`}
                            style={{ width: `${entryBarPercentage}%` }}
                          />
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          <button onClick={() => openEditForm(b)} className="text-xs text-accent">
                            Ubah
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="text-xs text-danger">
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-text-primary">
            {editing ? "Ubah anggaran" : "Buat anggaran baru"}
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Kategori</label>
            {editing ? (
              <p className="text-text-primary">{editing.categoryName}</p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => handleCategoryIdChange(e.target.value)}
                className="input"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.category_id && (
              <p className="text-xs text-danger">{fieldErrors.category_id}</p>
            )}
          </div>

          {subcategoryOptions.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">Rincian</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="input"
              >
                {subcategoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Target bulanan</label>
            <CurrencyInput value={targetAmount} onChange={setTargetAmount} />
            {fieldErrors.target_amount && (
              <p className="text-xs text-danger">{fieldErrors.target_amount}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-secondary">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={2}
            />
          </div>

          {submitError && <p className="text-sm text-danger">{submitError}</p>}

          <div className="flex gap-3">
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

      {!showForm && availableCategories.length > 0 && (
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-accent py-3 text-white font-medium"
        >
          + Buat Anggaran Baru
        </button>
      )}
    </div>
  );
}
