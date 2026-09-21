"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createTransaction,
  createTransfer,
  updateTransaction,
  type TransactionWithDetails,
} from "@/lib/supabase/queries/transactions";
import {
  transactionSchema,
  transferSchema,
} from "@/lib/validation/transaction";
import { PAYMENT_METHODS } from "@/lib/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { SubcategoryPicker } from "@/components/SubcategoryPicker";
import { Field } from "@/components/FormField";
import { CameraIcon, PhotoIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/queries/categories";
import type { Subcategory } from "@/lib/supabase/queries/subcategories";
import { toLocalISODate } from "@/lib/utils/date";

type Account = { id: string; name: string };
type Member = { id: string; display_name: string };
type TxType = "Pengeluaran" | "Pemasukan" | "Transfer";

function todayISO() {
  return toLocalISODate(new Date());
}

export function TransactionForm({
  familyId,
  accounts,
  members,
  categories,
  subcategories,
  defaultMemberId,
  defaultAccountId,
  editing,
  initialType,
  initialCategoryId,
  onSaved,
  onCancel,
}: {
  familyId: string;
  accounts: Account[];
  members: Member[];
  categories: Category[];
  subcategories: Subcategory[];
  defaultMemberId: string;
  defaultAccountId?: string;
  editing?: TransactionWithDetails | null;
  initialType?: TxType;
  initialCategoryId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [txType, setTxType] = useState<TxType>(
    editing ? (editing.type as TxType) : initialType ?? "Pengeluaran"
  );
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ?? initialCategoryId ?? ""
  );
  const [subcategoryId, setSubcategoryId] = useState(editing?.subcategoryId ?? "");
  const [accountId, setAccountId] = useState(
    editing?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? ""
  );
  const [fromAccountId, setFromAccountId] = useState(
    defaultAccountId ?? accounts[0]?.id ?? ""
  );
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== defaultAccountId)?.id ?? accounts[0]?.id ?? ""
  );
  const [memberId, setMemberId] = useState(defaultMemberId);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>(
    "Tunai"
  );
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [description, setDescription] = useState(editing?.description ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const receiptCameraInputRef = useRef<HTMLInputElement>(null);
  const receiptGalleryInputRef = useRef<HTMLInputElement>(null);

  const relevantCategories = categories.filter((c) =>
    txType === "Pemasukan" ? c.type === "income" : c.type === "expense"
  );
  const relevantSubcategories = subcategories.filter((s) => s.categoryId === categoryId);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setSubcategoryId("");
  }

  async function handleScanReceipt(file: File) {
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await fetch("/api/scan-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "Gagal memindai struk.");
        return;
      }

      if (data.amount) setAmount(data.amount);
      if (data.date) setDate(data.date);
      if (data.merchant) setDescription(data.merchant);
      if (data.categoryName) {
        const match = categories.find(
          (c) => c.type === "expense" && c.name === data.categoryName
        );
        if (match) handleCategoryChange(match.id);
      }
    } catch {
      setScanError("Gagal memindai struk. Coba lagi nanti.");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    const supabase = createClient();

    if (txType === "Transfer") {
      const result = transferSchema.safeParse({
        amount,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        family_member_id: memberId,
        date,
        notes,
      });
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      try {
        await createTransfer(supabase, familyId, result.data);
        onSaved();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan transfer.");
        setLoading(false);
      }
      return;
    }

    const result = transactionSchema.safeParse({
      type: txType,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      account_id: accountId,
      family_member_id: memberId,
      payment_method: paymentMethod,
      date,
      description,
      notes,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateTransaction(supabase, editing.id, result.data);
      } else {
        await createTransaction(supabase, familyId, result.data);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-text-primary">
        {editing ? "Ubah transaksi" : "Tambah transaksi"}
      </h2>

      {!editing && (
        <div className="flex rounded-xl bg-bg-page p-1">
          {(["Pengeluaran", "Pemasukan", "Transfer"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTxType(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                txType === t ? "bg-accent text-white" : "text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {!editing && txType === "Pengeluaran" && (
        <div className="flex flex-col gap-1.5">
          <input
            ref={receiptCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleScanReceipt(file);
            }}
          />
          <input
            ref={receiptGalleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleScanReceipt(file);
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => receiptCameraInputRef.current?.click()}
              disabled={scanning}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-3 text-sm text-accent disabled:opacity-60"
            >
              <CameraIcon className="w-4 h-4" />
              {scanning ? "Memindai..." : "Scan Struk"}
            </button>
            <button
              type="button"
              onClick={() => receiptGalleryInputRef.current?.click()}
              disabled={scanning}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-3 text-sm text-accent disabled:opacity-60"
            >
              <PhotoIcon className="w-4 h-4" />
              Pilih dari Galeri
            </button>
          </div>
          {scanError && <p className="text-xs text-danger">{scanError}</p>}
        </div>
      )}

      <Field label="Jumlah" error={fieldErrors.amount}>
        <CurrencyInput value={amount} onChange={setAmount} />
      </Field>

      {txType === "Transfer" ? (
        <>
          <Field label="Dari akun" error={fieldErrors.from_account_id}>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="input"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ke akun" error={fieldErrors.to_account_id}>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="input"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <>
          <Field label="Kategori" error={fieldErrors.category_id}>
            <CategoryPicker
              categories={relevantCategories}
              value={categoryId}
              onChange={handleCategoryChange}
            />
          </Field>

          {relevantSubcategories.length > 0 && (
            <Field label="Sub kategori (opsional)">
              <SubcategoryPicker
                subcategories={relevantSubcategories}
                value={subcategoryId}
                onChange={setSubcategoryId}
              />
            </Field>
          )}

          <Field label="Akun" error={fieldErrors.account_id}>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Metode pembayaran" error={fieldErrors.payment_method}>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as (typeof PAYMENT_METHODS)[number])
              }
              className="input"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Deskripsi (opsional)" error={fieldErrors.description}>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="mis. Makan siang"
            />
          </Field>
        </>
      )}

      <Field label="Anggota" error={fieldErrors.family_member_id}>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="input"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tanggal" error={fieldErrors.date}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Catatan (opsional)" error={fieldErrors.notes}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows={2}
        />
      </Field>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
