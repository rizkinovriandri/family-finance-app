import type { ComponentType } from "react";
import {
  IconArmchair,
  IconBabyCarriage,
  IconBallFootball,
  IconBarbell,
  IconBolt,
  IconBook,
  IconBriefcase2,
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconCar,
  IconCash,
  IconCoffee,
  IconCoin,
  IconCreditCard,
  IconCurrencyBitcoin,
  IconDeviceGamepad2,
  IconDeviceLaptop,
  IconDeviceTv,
  IconDroplet,
  IconFileInvoice,
  IconFolder,
  IconGasStation,
  IconGift,
  IconHeartbeat,
  IconHeartHandshake,
  IconHome,
  IconMovie,
  IconMusic,
  IconParking,
  IconPaw,
  IconPigMoney,
  IconPill,
  IconPlane,
  IconReceipt2,
  IconReceiptRefund,
  IconRepeat,
  IconShieldCheck,
  IconShirt,
  IconShoppingBag,
  IconStar,
  IconToolsKitchen2,
  IconTrendingUp,
  IconWallet,
  IconWashMachine,
  IconWifi,
  type IconProps,
} from "@tabler/icons-react";

export interface CategoryIconOption {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

function tabler(Icon: ComponentType<IconProps>): ComponentType<{ className?: string }> {
  return ({ className }) => <Icon className={className} stroke={1.75} />;
}

// Icon set untuk kategori transaksi/budget — dipilih user lewat IconPicker
// saat create/update di halaman Kelola Kategori. Pakai Tabler Icons
// (@tabler/icons-react).
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "food", label: "Makanan", Icon: tabler(IconToolsKitchen2) },
  { key: "transport", label: "Transportasi", Icon: tabler(IconCar) },
  { key: "bills", label: "Tagihan", Icon: tabler(IconReceipt2) },
  { key: "education", label: "Pendidikan", Icon: tabler(IconBook) },
  { key: "health", label: "Kesehatan", Icon: tabler(IconHeartbeat) },
  { key: "entertainment", label: "Hiburan", Icon: tabler(IconMovie) },
  { key: "shopping", label: "Belanja", Icon: tabler(IconShoppingBag) },
  { key: "debt", label: "Cicilan/Utang", Icon: tabler(IconCreditCard) },
  { key: "donation", label: "Donasi", Icon: tabler(IconGift) },
  { key: "home", label: "Rumah", Icon: tabler(IconHome) },
  { key: "salary", label: "Gaji", Icon: tabler(IconBriefcase2) },
  { key: "bonus", label: "Bonus", Icon: tabler(IconStar) },
  { key: "investment", label: "Investasi", Icon: tabler(IconTrendingUp) },
  { key: "gift", label: "Hadiah", Icon: tabler(IconGift) },
  { key: "bank", label: "Transfer", Icon: tabler(IconBuildingBank) },
  { key: "cash", label: "Tunai", Icon: tabler(IconCash) },
  { key: "wallet", label: "Dompet", Icon: tabler(IconWallet) },
  { key: "folder", label: "Umum", Icon: tabler(IconFolder) },
  { key: "fuel", label: "Bensin", Icon: tabler(IconGasStation) },
  { key: "parking", label: "Parkir", Icon: tabler(IconParking) },
  { key: "phone", label: "Pulsa/Data", Icon: tabler(IconWifi) },
  { key: "electricity", label: "Listrik", Icon: tabler(IconBolt) },
  { key: "water", label: "Air", Icon: tabler(IconDroplet) },
  { key: "rent", label: "Sewa", Icon: tabler(IconBuildingSkyscraper) },
  { key: "coffee", label: "Kopi/Jajan", Icon: tabler(IconCoffee) },
  { key: "pet", label: "Hewan Peliharaan", Icon: tabler(IconPaw) },
  { key: "baby", label: "Anak/Bayi", Icon: tabler(IconBabyCarriage) },
  { key: "travel", label: "Perjalanan", Icon: tabler(IconPlane) },
  { key: "fitness", label: "Olahraga", Icon: tabler(IconBarbell) },
  { key: "sport", label: "Hobi Olahraga", Icon: tabler(IconBallFootball) },
  { key: "pharmacy", label: "Obat", Icon: tabler(IconPill) },
  { key: "insurance", label: "Asuransi", Icon: tabler(IconShieldCheck) },
  { key: "subscription", label: "Langganan", Icon: tabler(IconRepeat) },
  { key: "laundry", label: "Cuci/Laundry", Icon: tabler(IconWashMachine) },
  { key: "clothes", label: "Pakaian", Icon: tabler(IconShirt) },
  { key: "electronics", label: "Elektronik", Icon: tabler(IconDeviceTv) },
  { key: "furniture", label: "Perabotan", Icon: tabler(IconArmchair) },
  { key: "music", label: "Musik", Icon: tabler(IconMusic) },
  { key: "game", label: "Game", Icon: tabler(IconDeviceGamepad2) },
  { key: "freelance", label: "Freelance", Icon: tabler(IconDeviceLaptop) },
  { key: "dividend", label: "Dividen", Icon: tabler(IconCoin) },
  { key: "crypto", label: "Kripto", Icon: tabler(IconCurrencyBitcoin) },
  { key: "savings", label: "Tabungan", Icon: tabler(IconPigMoney) },
  { key: "charity", label: "Amal/Sosial", Icon: tabler(IconHeartHandshake) },
  { key: "refund", label: "Refund", Icon: tabler(IconReceiptRefund) },
  { key: "invoice", label: "Tagihan/Faktur", Icon: tabler(IconFileInvoice) },
];

const iconByKey = new Map(CATEGORY_ICON_OPTIONS.map((o) => [o.key, o.Icon]));

export function getCategoryIconComponent(iconKey: string | null | undefined) {
  if (!iconKey) return null;
  return iconByKey.get(iconKey) ?? null;
}
