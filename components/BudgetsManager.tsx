"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createBudget,
  deleteBudget,
  listBudgetsForMonth,
  updateBudget,
  type BudgetWithRealization,
} from "@/lib/supabase/queries/budgets";
import { budgetSchema, type BudgetFormValues } from "@/lib/validation/budget";
import { getCategoryStyle } from "@/lib/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/queries/categories";

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
  categories,
  initialBudgets,
  initialMonth,
}: {
  familyId: string;
  categories: Category[];
  initialBudgets: BudgetWithRealization[];
  initialMonth: string;
}) {
  const [monthDate, setMonthDate] = useState(new Date(initialMonth + "T00:00:00"));
  const [budgets, setBudgets] = useState(initialBudgets);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetWithRealization | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter(
    (c) => !budgetedCategoryIds.has(c.id)
  );

  async function loadMonth(date: Date) {
    const supabase = createClient();
    setBudgets(await listBudgetsForMonth(supabase, familyId, date));
  }

  function shiftMonth(delta: number) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
    setMonthDate(next);
    setShowForm(false);
    setEditing(null);
    loadMonth(next);
  }

  function openCreateForm() {
    setEditing(null);
    setCategoryId(availableCategories[0]?.id ?? "");
    setTargetAmount(0);
    setNotes("");
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function openEditForm(budget: BudgetWithRealization) {
    setEditing(budget);
    setCategoryId(budget.categoryId);
    setTargetAmount(budget.targetAmount);
    setNotes(budget.notes ?? "");
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values: BudgetFormValues = { category_id: categoryId, target_amount: targetAmount, notes };
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
        await createBudget(supabase, familyId, monthDate, result.data);
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

      {budgets.length === 0 && !showForm && (
        <p className="text-sm text-text-muted text-center mt-6">
          Belum ada anggaran bulan ini.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {budgets.map((b) => {
          const style = getCategoryStyle(b.categoryName);
          const barPercentage = Math.min(b.percentage, 100);
          return (
            <div
              key={b.id}
              className="rounded-xl bg-bg-surface border border-border-subtle p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-semibold text-sm"
                  style={{ backgroundColor: style.mutedBg, color: style.bright }}
                >
                  {b.categoryName.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {b.categoryName}
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
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-bg-page mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    b.status === "Melebihi" ? "bg-danger" : "bg-success"
                  }`}
                  style={{ width: `${barPercentage}%` }}
                />
              </div>

              <div className="flex gap-3 mt-2">
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-4"
        >
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
                onChange={(e) => setCategoryId(e.target.value)}
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
      )}

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
