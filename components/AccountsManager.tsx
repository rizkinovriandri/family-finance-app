"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createAccount,
  deleteAccount,
  updateAccount,
  type AccountWithBalance,
} from "@/lib/supabase/queries/accounts";
import {
  accountSchema,
  type AccountFormValues,
} from "@/lib/validation/account";
import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUSES,
  CURRENCIES,
} from "@/lib/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";

type Member = { id: string; display_name: string };

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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountsManager({
  familyId,
  members,
  initialAccounts,
}: {
  familyId: string;
  members: Member[];
  initialAccounts: AccountWithBalance[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AccountFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setShowForm(true);
  }

  function openEditForm(account: AccountWithBalance) {
    setEditingId(account.id);
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

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (editingId) {
        await updateAccount(supabase, editingId, result.data);
      } else {
        await createAccount(supabase, familyId, result.data);
      }

      const { listAccounts } = await import("@/lib/supabase/queries/accounts");
      setAccounts(await listAccounts(supabase, familyId));
      setShowForm(false);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Akun</h1>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          + Tambah
        </button>
      </div>

      {accounts.length === 0 && !showForm && (
        <p className="text-sm text-text-muted text-center mt-6">
          Belum ada akun. Tambah akun pertama kamu.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-2xl bg-bg-surface border border-border-subtle p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-primary font-medium">{account.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {account.account_type}
                  {account.institution ? ` · ${account.institution}` : ""}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  account.status === "Aktif"
                    ? "bg-success/15 text-success"
                    : "bg-text-muted/15 text-text-muted"
                }`}
              >
                {account.status}
              </span>
            </div>

            <p className="text-xl font-bold text-text-primary mt-3">
              {formatRupiah(account.current_balance)}
            </p>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => openEditForm(account)}
                className="text-sm text-accent"
              >
                Ubah
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="text-sm text-danger"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex flex-col gap-3"
        >
          <h2 className="text-lg font-medium text-text-primary">
            {editingId ? "Ubah akun" : "Tambah akun"}
          </h2>

          <Field label="Nama akun" error={fieldErrors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
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
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Institusi/Bank (opsional)" error={fieldErrors.institution}>
            <input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              className="input"
            />
          </Field>

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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <Field label="Saldo awal" error={fieldErrors.opening_balance}>
            <CurrencyInput
              value={form.opening_balance}
              onChange={(opening_balance) =>
                setForm({ ...form, opening_balance })
              }
            />
          </Field>

          <Field label="Catatan (opsional)" error={fieldErrors.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </Field>

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
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
