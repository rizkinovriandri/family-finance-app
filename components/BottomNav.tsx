"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconChartLine,
  IconHome,
  IconLayoutGrid,
  IconListDetails,
  IconWallet,
} from "@tabler/icons-react";

const TABS = [
  { href: "/dashboard", label: "Beranda", icon: IconHome },
  { href: "/accounts", label: "Akun", icon: IconWallet },
  { href: "/transactions", label: "Transaksi", icon: IconListDetails },
  { href: "/budgets", label: "Budget", icon: IconChartBar },
  { href: "/reports", label: "Laporan", icon: IconChartLine },
  { href: "/more", label: "Lainnya", icon: IconLayoutGrid },
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
                <Icon className="w-5 h-5" stroke={1.75} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
