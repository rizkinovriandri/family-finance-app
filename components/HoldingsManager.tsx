"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  createHolding,
  deleteHolding,
  listHoldingsForAccount,
  updateHolding,
  type Holding,
} from "@/lib/supabase/queries/investments";
import { holdingSchema, type HoldingFormValues } from "@/lib/validation/investment";
import { INVESTMENT_CATEGORIES } from "@/lib/constants/enums";
import type { InvestmentCategory } from "@/lib/types/database";
import {
  InvestmentHoldingFields,
  EMPTY_HOLDING_FIELDS,
  QUANTITY_UNIT,
  type HoldingFieldsState,
} from "@/components/InvestmentHoldingFields";
import { Field } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { ChevronLeftIcon } from "@/components/icons";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(value);
}

export function HoldingsManager({
  familyId,
  accountId,
  accountName,
  initialHoldings,
}: {
  familyId: string;
  accountId: string;
  accountName: string;
  initialHoldings: Holding[];
}) {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const [category, setCategory] = useState<InvestmentCategory>("saham");
  const [name, setName] = useState("");
  const [fields, setFields] = useState<HoldingFieldsState>(EMPTY_HOLDING_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const supabase = createClient();
    setHoldings(await listHoldingsForAccount(supabase, accountId));
  }

  useRealtimeTable("investment_holdings", familyId, refresh);

  const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalCostBasis;
  const totalGainLossPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  function openCreateForm() {
    setEditing(null);
    setCategory("saham");
    setName("");
    setFields(EMPTY_HOLDING_FIELDS);
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function openEditForm(h: Holding) {
    setEditing(h);
    setCategory(h.category);
    setName(h.name);
    setFields({
      platform: h.platform ?? "",
      purchase_date: h.purchaseDate,
      quantity: h.quantity,
      purchase_price: h.purchasePrice,
      current_price: h.currentPrice,
      notes: h.notes ?? "",
      fund_manager: h.fundManager ?? "",
      fund_type: h.fundType ?? EMPTY_HOLDING_FIELDS.fund_type,
      issuer: h.issuer ?? "",
      bond_type: h.bondType ?? EMPTY_HOLDING_FIELDS.bond_type,
      coupon_rate: h.couponRate ?? 0,
      coupon_frequency: h.couponFrequency ?? EMPTY_HOLDING_FIELDS.coupon_frequency,
      maturity_date: h.maturityDate ?? "",
      ticker_code: h.tickerCode ?? "",
      gold_type: h.goldType ?? EMPTY_HOLDING_FIELDS.gold_type,
    });
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = holdingSchema.safeParse({ category, name, ...fields });
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
      const values = result.data as HoldingFormValues;
      if (editing) {
        await updateHolding(supabase, editing.id, values);
      } else {
        await createHolding(supabase, familyId, accountId, values);
      }
      await refresh();
      closeForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan holding.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(h: Holding) {
    if (!confirm(`Hapus holding "${h.name}"?`)) return;
    const supabase = createClient();
    await deleteHolding(supabase, h.id);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href="/accounts"
          className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary shrink-0"
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary truncate">
          Portofolio · {accountName}
        </h1>
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary">Total Nilai Investasi</p>
        <p className="text-2xl font-bold text-text-primary mt-1">
          {formatRupiah(totalCurrentValue)}
        </p>
        {totalCostBasis > 0 && (
          <p className={`text-xs font-medium mt-1 ${totalGainLoss >= 0 ? "text-success" : "text-danger"}`}>
            {totalGainLoss >= 0 ? "+" : ""}
            {formatRupiah(totalGainLoss)} ({totalGainLoss >= 0 ? "+" : ""}
            {totalGainLossPct.toFixed(1)}%)
          </p>
        )}
      </div>

      {holdings.length === 0 && (
        <p className="text-sm text-text-muted text-center mt-6">
          Belum ada holding investasi di akun ini.
        </p>
      )}

      {INVESTMENT_CATEGORIES.map((cat) => {
        const items = holdings.filter((h) => h.category === cat.value);
        if (items.length === 0) return null;
        return (
          <div key={cat.value} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary">{cat.label}</p>
            {items.map((h) => (
              <div
                key={h.id}
                className="rounded-xl bg-bg-surface border border-border-subtle p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{h.name}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {formatNumber(h.quantity)} {QUANTITY_UNIT[h.category]}
                      {h.platform ? ` · ${h.platform}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatRupiah(h.currentValue)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        h.gainLoss >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {h.gainLoss >= 0 ? "+" : ""}
                      {h.gainLossPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => openEditForm(h)} className="text-xs text-accent">
                    Ubah
                  </button>
                  <button onClick={() => handleDelete(h)} className="text-xs text-danger">
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <Modal open={showForm} onClose={closeForm}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-text-primary">
            {editing ? "Ubah holding" : "Tambah holding"}
          </h2>

          <Field label="Kategori" error={fieldErrors.category}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InvestmentCategory)}
              className="input"
              disabled={!!editing}
            >
              {INVESTMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nama instrumen" error={fieldErrors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder='mis. "BBCA", "ORI023", "Manulife Dana Saham"'
            />
          </Field>

          <InvestmentHoldingFields
            category={category}
            value={fields}
            onChange={setFields}
            errors={fieldErrors}
          />

          {submitError && <p className="text-sm text-danger">{submitError}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={closeForm}
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

      <button
        onClick={openCreateForm}
        className="rounded-xl bg-accent py-3 text-white font-medium"
      >
        + Tambah Holding
      </button>
    </div>
  );
}
