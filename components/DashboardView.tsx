"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EyeIcon,
  GearIcon,
  BellIcon,
  LightbulbIcon,
  ChevronRightIcon,
  HomeIcon,
} from "@/components/icons";
import { DonutChart } from "@/components/DonutChart";
import type { CategorySlice } from "@/lib/supabase/queries/transactions";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
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

export function DashboardView({
  displayName,
  familyName,
  totalBalance,
  accountsCount,
  totalIncome,
  totalExpense,
  categories,
}: {
  displayName: string;
  familyName: string;
  totalBalance: number;
  accountsCount: number;
  totalIncome: number;
  totalExpense: number;
  categories: CategorySlice[];
}) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg text-text-primary">
            {getGreeting()}, {displayName} 👋
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
          {balanceVisible ? formatRupiah(totalBalance) : "Rp ••••••••"}
        </p>
      </Link>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm text-text-secondary">Pemasukan</p>
          <p className="text-lg font-semibold text-success mt-1">
            {balanceVisible ? formatRupiah(totalIncome) : "••••••"}
          </p>
        </div>
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
          <p className="text-sm text-text-secondary">Pengeluaran</p>
          <p className="text-lg font-semibold text-danger mt-1">
            {balanceVisible ? formatRupiah(totalExpense) : "••••••"}
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
