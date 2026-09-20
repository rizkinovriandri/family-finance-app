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

// Kategori transaksi khusus dari fitur "Sesuaikan Saldo" (bukan pemasukan/
// pengeluaran sungguhan) — dikecualikan dari semua chart & laporan supaya
// tidak mendistorsi angka Pemasukan/Pengeluaran bulanan, sama seperti
// transfer antar akun.
export const BALANCE_ADJUSTMENT_CATEGORY_NAME = "Penyesuaian Saldo";

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
  "Cicilan/Utang": { mutedBg: "#3A2A12", bright: "#F0A63E" },
  "Donasi/Sedekah": { mutedBg: "#3A1A2A", bright: "#F06FA0" },
};

export const DEFAULT_CATEGORY_STYLE = { mutedBg: "#1E2938", bright: "#8896A8" };

export function getCategoryStyle(categoryName: string) {
  return CATEGORY_STYLES[categoryName] ?? DEFAULT_CATEGORY_STYLE;
}

// bg-surface (app/globals.css --color-bg-surface) — dasar campuran solid di
// bawah, supaya tint kategori tetap kebaca tanpa transparansi (opacity 100%).
const SURFACE_BASE = { r: 0x0f, g: 0x2a, b: 0x42 };

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function toHex(n: number) {
  return Math.round(n).toString(16).padStart(2, "0");
}

// Warna solid (bukan rgba) hasil campur `bright` kategori ke SURFACE_BASE —
// dipakai utk latar kartu/box yang perlu tetap kebaca & full opacity di atas
// bg-page/bg-surface (keduanya gelap & dekat ke beberapa `mutedBg`, jadi
// mutedBg sendiri gampang blending kalau dipakai sebagai latar box, bukan
// cuma latar ikon kecil).
export function getCategoryTint(categoryName: string, ratio = 0.16) {
  const { bright } = getCategoryStyle(categoryName);
  const c = hexToRgb(bright);
  const r = c.r * ratio + SURFACE_BASE.r * (1 - ratio);
  const g = c.g * ratio + SURFACE_BASE.g * (1 - ratio);
  const b = c.b * ratio + SURFACE_BASE.b * (1 - ratio);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
