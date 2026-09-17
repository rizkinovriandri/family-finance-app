import type { ComponentType } from "react";
import {
  BankIcon,
  BookIcon,
  BriefcaseIcon,
  CarIcon,
  CashIcon,
  CreditCardIcon,
  FilmIcon,
  FolderIcon,
  GiftIcon,
  HeartIcon,
  HomeIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  StarIcon,
  TrendUpIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/icons";

export interface CategoryIconOption {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

// Icon set untuk kategori transaksi/budget — dipilih user lewat IconPicker
// saat create/update di halaman Kelola Kategori.
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "food", label: "Makanan", Icon: UtensilsIcon },
  { key: "transport", label: "Transportasi", Icon: CarIcon },
  { key: "bills", label: "Tagihan", Icon: ReceiptIcon },
  { key: "education", label: "Pendidikan", Icon: BookIcon },
  { key: "health", label: "Kesehatan", Icon: HeartIcon },
  { key: "entertainment", label: "Hiburan", Icon: FilmIcon },
  { key: "shopping", label: "Belanja", Icon: ShoppingBagIcon },
  { key: "debt", label: "Cicilan/Utang", Icon: CreditCardIcon },
  { key: "donation", label: "Donasi", Icon: GiftIcon },
  { key: "home", label: "Rumah", Icon: HomeIcon },
  { key: "salary", label: "Gaji", Icon: BriefcaseIcon },
  { key: "bonus", label: "Bonus", Icon: StarIcon },
  { key: "investment", label: "Investasi", Icon: TrendUpIcon },
  { key: "gift", label: "Hadiah", Icon: GiftIcon },
  { key: "bank", label: "Transfer", Icon: BankIcon },
  { key: "cash", label: "Tunai", Icon: CashIcon },
  { key: "wallet", label: "Dompet", Icon: WalletIcon },
  { key: "folder", label: "Umum", Icon: FolderIcon },
];

const iconByKey = new Map(CATEGORY_ICON_OPTIONS.map((o) => [o.key, o.Icon]));

export function getCategoryIconComponent(iconKey: string | null | undefined) {
  if (!iconKey) return null;
  return iconByKey.get(iconKey) ?? null;
}
