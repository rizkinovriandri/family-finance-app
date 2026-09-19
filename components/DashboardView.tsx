"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  EyeIcon,
  GearIcon,
  BellIcon,
  LightbulbIcon,
  ChevronRightIcon,
  HomeIcon,
  MinusCircleIcon,
} from "@/components/icons";
import { DonutChart } from "@/components/DonutChart";
import { TrendChart } from "@/components/TrendChart";
import type { CategorySlice, MonthlyTrendPoint } from "@/lib/supabase/queries/transactions";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 10) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function DashboardView({
  displayName,
  familyName,
  balances,
  accountsCount,
  totalIncome,
  totalExpense,
  categories,
  budgetTarget,
  budgetRealisasi,
  overBudgetCategories,
  trend,
}: {
  displayName: string;
  familyName: string;
  balances: { currency: string; total: number }[];
  accountsCount: number;
  totalIncome: number;
  totalExpense: number;
  categories: CategorySlice[];
  budgetTarget: number;
  budgetRealisasi: number;
  overBudgetCategories: string[];
  trend: MonthlyTrendPoint[];
}) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  // Salam & tanggal bergantung jam/zona waktu perangkat — dihitung ulang
  // di client setelah mount, supaya render awal server (yang biasanya di
  // UTC) tidak mismatch dengan browser user (WIB) saat hydration.
  const [greeting, setGreeting] = useState("Halo");
  const [today, setToday] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setToday(formatToday());
  }, []);

  const primaryBalance = balances.find((b) => b.currency === "IDR") ?? balances[0];
  const otherBalances = balances.filter((b) => b !== primaryBalance);
  const netBalance = totalIncome - totalExpense;
  const budgetPercentage =
    budgetTarget > 0 ? Math.round((budgetRealisasi / budgetTarget) * 100) : 0;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg text-text-primary">
            {greeting}, {displayName} 👋
          </p>
          <p className="text-sm text-text-secondary mt-0.5">{today}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent text-xs font-medium px-2.5 py-1 mt-2">
            <HomeIcon className="w-3.5 h-3.5" />
            Keluarga {familyName}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/more"
            className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary"
            aria-label="Pengaturan"
          >
            <GearIcon className="w-4.5 h-4.5" />
          </Link>
          <button
            className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary"
            aria-label="Notifikasi"
          >
            <BellIcon className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <Link
        href="/accounts"
        className="rounded-2xl bg-bg-surface border border-border-subtle p-4 block"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Total Saldo · {accountsCount} akun
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              setBalanceVisible((v) => !v);
            }}
            className="text-text-muted"
            aria-label={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
          >
            <EyeIcon className="w-5 h-5" off={!balanceVisible} />
          </button>
        </div>
        <p className="text-3xl font-bold text-text-primary mt-1">
          {balanceVisible
            ? formatCurrency(primaryBalance?.total ?? 0, primaryBalance?.currency ?? "IDR")
            : "Rp ••••••••"}
        </p>

        {otherBalances.length > 0 && (
          <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border-subtle">
            {otherBalances.map((b) => (
              <div key={b.currency} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{b.currency}</span>
                <span className="text-text-primary font-medium">
                  {balanceVisible ? formatCurrency(b.total, b.currency) : "••••••"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-3">
          <p className="text-xs text-text-secondary">Pemasukan</p>
          <p className="text-sm font-semibold text-success mt-1">
            {balanceVisible ? formatRupiah(totalIncome) : "••••••"}
          </p>
        </div>
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-3">
          <p className="text-xs text-text-secondary">Pengeluaran</p>
          <p className="text-sm font-semibold text-danger mt-1">
            {balanceVisible ? formatRupiah(totalExpense) : "••••••"}
          </p>
        </div>
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-3">
          <p className="text-xs text-text-secondary">Saldo Bersih</p>
          <p
            className={`text-sm font-semibold mt-1 ${
              netBalance >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {balanceVisible ? formatRupiah(netBalance) : "••••••"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm font-medium text-text-primary mb-3">
          Pengeluaran Bulan Ini
        </p>

        {categories.length > 0 ? (
          <>
            <DonutChart slices={categories} total={totalExpense} />
            <Link
              href="/reports"
              className="flex items-center gap-1 text-sm text-accent mt-3"
            >
              Lihat Detail <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            Belum ada transaksi pengeluaran bulan ini.
          </p>
        )}
      </div>

      <Link
        href="/budgets"
        className="rounded-2xl bg-bg-surface border border-border-subtle p-4 block"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-text-primary">Realisasi Anggaran</p>
          <span className="text-xs text-text-secondary">{budgetPercentage}%</span>
        </div>

        {budgetTarget > 0 ? (
          <>
            <div className="h-1.5 rounded-full bg-bg-page overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  budgetPercentage > 100 ? "bg-danger" : "bg-success"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {formatRupiah(budgetRealisasi)} dari {formatRupiah(budgetTarget)}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted">Belum ada anggaran bulan ini.</p>
        )}
      </Link>

      {overBudgetCategories.length > 0 && (
        <div className="rounded-2xl bg-danger/10 border border-danger/30 p-4 flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-danger/15 text-danger flex items-center justify-center shrink-0">
            <MinusCircleIcon className="w-4.5 h-4.5" />
          </span>
          <p className="text-sm text-text-secondary">
            <span className="text-danger font-medium">
              {overBudgetCategories.length} kategori melebihi anggaran:
            </span>{" "}
            {overBudgetCategories.join(", ")}
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-primary">Tren Bulanan</p>
          <div className="flex items-center gap-3 text-[10px] text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" /> Pemasukan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-danger" /> Pengeluaran
            </span>
          </div>
        </div>
        <TrendChart data={trend} />
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4 flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <LightbulbIcon className="w-4.5 h-4.5" />
        </span>
        <p className="text-sm text-text-secondary">
          Keuangan yang sehat, hidup yang lebih tenang.
        </p>
      </div>
    </div>
  );
}
