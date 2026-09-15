"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Beranda" },
  { href: "/transactions", label: "Transaksi" },
  { href: "/budgets", label: "Budget" },
  { href: "/reports", label: "Laporan" },
  { href: "/more", label: "Lainnya" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border-subtle bg-bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <ul className="flex justify-between px-2">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
