"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  WalletIcon,
  ListIcon,
  BarChartIcon,
  LineChartIcon,
  GridIcon,
} from "@/components/icons";

const TABS = [
  { href: "/dashboard", label: "Beranda", icon: HomeIcon },
  { href: "/accounts", label: "Akun", icon: WalletIcon },
  { href: "/transactions", label: "Transaksi", icon: ListIcon },
  { href: "/budgets", label: "Budget", icon: BarChartIcon },
  { href: "/reports", label: "Laporan", icon: LineChartIcon },
  { href: "/more", label: "Lainnya", icon: GridIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-border-subtle bg-bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <ul className="flex justify-between px-1">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
