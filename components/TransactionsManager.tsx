"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  deleteTransaction,
  listTransactions,
  type TransactionWithDetails,
} from "@/lib/supabase/queries/transactions";
import { getCategoryStyle } from "@/lib/constants/enums";
import { TransactionForm } from "@/components/TransactionForm";
import type { Category } from "@/lib/supabase/queries/categories";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

type Account = { id: string; name: string };
type Member = { id: string; display_name: string };
type Tab = "Semua" | "Pemasukan" | "Pengeluaran";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRowDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function dateGroupLabel(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Hari ini";
  if (date.getTime() === yesterday.getTime()) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function TransactionsManager({
  familyId,
  accounts,
  members,
  categories,
  defaultMemberId,
  initialTransactions,
  filterAccountId,
  title = "Transaksi",
  backHref,
  defaultAccountId,
}: {
  familyId: string;
  accounts: Account[];
  members: Member[];
  categories: Category[];
  defaultMemberId: string;
  initialTransactions: TransactionWithDetails[];
  filterAccountId?: string;
  title?: string;
  backHref?: string;
  defaultAccountId?: string;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [tab, setTab] = useState<Tab>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TransactionWithDetails | null>(null);

  const usedCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of transactions) {
      if (filterAccountId && t.accountId !== filterAccountId) continue;
      map.set(t.categoryId, t.categoryName);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [transactions, filterAccountId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filterAccountId && t.accountId !== filterAccountId) return false;
      if (tab !== "Semua" && t.type !== tab) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        (t.description ?? "").toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.accountName.toLowerCase().includes(q)
      );
    });
  }, [transactions, tab, categoryFilter, search, filterAccountId]);

  const grouped = useMemo(() => {
    const groups = new Map<string, TransactionWithDetails[]>();
    for (const t of filtered) {
      const label = dateGroupLabel(t.date);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(t);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  async function syncTransactions() {
    const supabase = createClient();
    setTransactions(await listTransactions(supabase, familyId));
  }

  useRealtimeTable("transactions", familyId, syncTransactions);

  async function refresh() {
    await syncTransactions();
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(t: TransactionWithDetails) {
    const confirmMsg = t.transferPairId
      ? "Hapus transfer ini? Kedua sisi transaksi (keluar & masuk) akan terhapus."
      : "Hapus transaksi ini?";
    if (!confirm(confirmMsg)) return;

    const supabase = createClient();
    await deleteTransaction(supabase, t.id, t.transferPairId);
    setTransactions((prev) =>
      prev.filter((x) => x.id !== t.id && x.id !== t.transferPairId)
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-muted text-center mt-6">
          Tambah akun dulu sebelum mencatat transaksi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary shrink-0"
              aria-label="Kembali"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Link>
          )}
          <h1 className="text-2xl font-semibold text-text-primary truncate">{title}</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shrink-0"
        >
          + Tambah
        </button>
      </div>

      {showForm && (
        <TransactionForm
          familyId={familyId}
          accounts={accounts}
          members={members}
          categories={categories}
          defaultMemberId={defaultMemberId}
          defaultAccountId={defaultAccountId}
          editing={editing}
          onSaved={refresh}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari transaksi..."
        className="input"
      />

      <div className="flex rounded-xl bg-bg-surface border border-border-subtle p-1">
        {(["Semua", "Pemasukan", "Pengeluaran"] as Tab[]).map((t) => (
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

      {usedCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          <button
            onClick={() => setCategoryFilter("")}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border shrink-0 ${
              categoryFilter === ""
                ? "border-accent bg-accent/10 text-text-primary"
                : "border-border-subtle text-text-secondary"
            }`}
          >
            Semua Kategori
          </button>
          {usedCategories.map((c) => {
            const style = getCategoryStyle(c.name);
            const active = categoryFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border shrink-0 ${
                  active
                    ? "border-accent bg-accent/10 text-text-primary"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: style.bright }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {grouped.length === 0 && (
        <p className="text-sm text-text-muted text-center mt-6">
          Belum ada transaksi.
        </p>
      )}

      {grouped.map(([label, items]) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <div className="flex flex-col gap-2">
            {items.map((t) => {
              const style = getCategoryStyle(t.categoryName);
              const isIncome = t.type === "Pemasukan";
              return (
                <div
                  key={t.id}
                  className="rounded-xl bg-bg-surface border border-border-subtle p-3 flex items-center gap-3"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold"
                    style={{ backgroundColor: style.mutedBg, color: style.bright }}
                  >
                    {t.categoryName.charAt(0)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {t.description || t.categoryName}
                      </p>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-semibold ${
                            isIncome ? "text-success" : "text-danger"
                          }`}
                        >
                          {isIncome ? "+" : "-"} {formatRupiah(t.amount)}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {formatRowDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {filterAccountId
                        ? `${t.categoryName} · ${t.memberName}`
                        : `${t.categoryName} · ${t.accountName} · ${t.memberName}`}
                    </p>

                    <div className="flex gap-3 mt-1">
                      {!t.transferPairId && (
                        <button
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                          className="text-xs text-accent"
                        >
                          Ubah
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t)}
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
        </div>
      ))}
    </div>
  );
}
