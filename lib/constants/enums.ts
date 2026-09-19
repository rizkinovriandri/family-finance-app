// Sentralisasi enum & pilihan dropdown — jangan hardcode ulang di komponen.
// Sumber: CLAUDE.md Bagian 5 (Daftar Enum).

export const ACCOUNT_TYPES = [
  "Tabungan",
  "Giro",
  "Deposito",
  "Investasi Saham",
  "Investasi Reksadana",
  "Investasi Obligasi",
  "Investasi Emas",
  "Investasi Kripto",
  "Dana Pensiun",
  "E-Wallet",
  "Kas Tunai",
  "Kartu Kredit",
  "Pinjaman/Utang",
  "Lainnya",
] as const;

export const ACCOUNT_STATUSES = ["Aktif", "Nonaktif", "Ditutup"] as const;

// Akun bertipe "Investasi *" nilainya dihitung dari holding di Portofolio
// (investment_holdings), bukan dari saldo transaksi kas seperti akun biasa.
export function isInvestmentAccountType(accountType: string) {
  return accountType.startsWith("Investasi");
}

// Akun bertipe ini adalah utang, bukan aset — dikurangkan (bukan
// dijumlahkan) saat menghitung kekayaan bersih (net worth).
const LIABILITY_ACCOUNT_TYPES = new Set(["Kartu Kredit", "Pinjaman/Utang"]);

export function isLiabilityAccountType(accountType: string) {
  return LIABILITY_ACCOUNT_TYPES.has(accountType);
}

export const INVESTMENT_CATEGORIES = [
  { value: "reksadana", label: "Reksadana" },
  { value: "obligasi_sukuk", label: "Obligasi/Sukuk" },
  { value: "saham", label: "Saham" },
  { value: "emas", label: "Emas" },
] as const;

export const FUND_TYPES = [
  "Pasar Uang",
  "Pendapatan Tetap",
  "Campuran",
  "Saham",
  "Indeks",
] as const;

export const BOND_TYPES = [
  "Obligasi Pemerintah",
  "Obligasi Korporasi",
  "Sukuk Ritel",
] as const;

export const COUPON_FREQUENCIES = ["Bulanan", "Triwulanan", "Semesteran", "Tahunan"] as const;

export const GOLD_TYPES = ["Fisik/Batangan", "Digital/Tabungan Emas"] as const;

export const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "JPY"] as const;

export const TRANSACTION_TYPES = [
  "Pemasukan",
  "Pengeluaran",
  "Transfer Antar Akun",
] as const;

export const PAYMENT_METHODS = [
  "Tunai",
  "Transfer Bank",
  "Kartu Debit",
  "Kartu Kredit",
  "E-Wallet",
  "Autodebet",
  "Qris",
  "Lainnya",
] as const;

export const INCOME_CATEGORIES = [
  "Gaji",
  "Bonus/THR",
  "Hasil Investasi",
  "Hadiah/Pemberian",
  "Pendapatan Lainnya",
] as const;

export const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan & Utilitas",
  "Pendidikan",
  "Kesehatan",
  "Hiburan",
  "Belanja",
  "Cicilan/Utang",
  "Donasi/Sedekah",
  "Perawatan Rumah",
  "Pengeluaran Lainnya",
] as const;

// Gaya warna kategori (docs/design-system.md Bagian 2).
// mutedBg = latar ikon saat tidak aktif, bright = warna glyph/chart/aktif.
export const CATEGORY_STYLES: Record<string, { mutedBg: string; bright: string }> = {
  "Makanan & Minuman": { mutedBg: "#3A1620", bright: "#F86673" },
  "Transportasi": { mutedBg: "#072751", bright: "#8AC7FD" },
  "Belanja": { mutedBg: "#222149", bright: "#AC6FF0" },
  "Hiburan": { mutedBg: "#242150", bright: "#A57AE4" },
  "Tagihan & Utilitas": { mutedBg: "#0B2A4A", bright: "#4FA0F0" },
  "Kesehatan": { mutedBg: "#2E1F26", bright: "#F0554F" },
  "Pendidikan": { mutedBg: "#12332E", bright: "#3ECFAE" },
  "Perawatan Rumah": { mutedBg: "#1E2938", bright: "#8896A8" },
};

export const DEFAULT_CATEGORY_STYLE = { mutedBg: "#1E2938", bright: "#8896A8" };

export function getCategoryStyle(categoryName: string) {
  return CATEGORY_STYLES[categoryName] ?? DEFAULT_CATEGORY_STYLE;
}
