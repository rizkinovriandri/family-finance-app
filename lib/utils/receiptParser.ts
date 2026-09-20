export interface ParsedReceipt {
  merchant: string | null;
  amount: number | null;
  date: string | null; // ISO yyyy-mm-dd
  categoryName: string | null;
}

// Kata kunci per kategori pengeluaran (Bagian 5 CLAUDE.md) — dipakai buat
// menebak kategori dari nama toko/isi teks struk. Bukan daftar lengkap,
// cuma heuristik umum; kalau tidak match apa pun, kategori dibiarkan kosong
// supaya user pilih manual.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Makanan & Minuman": [
    "restoran", "resto", "warung", "cafe", "kafe", "rumah makan", "kfc",
    "mcdonald", "mcd", "burger", "pizza", "richeese", "coffee", "kopi",
    "starbucks", "bakery", "roti", "soto", "bakso", "sate", "nasi padang",
    "mie", "chicken", "geprek", "boba",
  ],
  "Transportasi": [
    "spbu", "pertamina", "shell", "bensin", "pertalite", "pertamax",
    "gojek", "grab", "gocar", "grabcar", "taxi", "parkir", "tol", "mrt",
    "krl", "transjakarta",
  ],
  "Tagihan & Utilitas": [
    "pln", "pdam", "indihome", "telkomsel", "indosat", "xl axiata",
    "smartfren", "tri ", "wifi", "listrik", "internet", "pulsa", "pascabayar",
  ],
  "Kesehatan": [
    "apotek", "rumah sakit", "klinik", "dokter", "farmasi", "kimia farma",
    "guardian", "century", "puskesmas", "laboratorium",
  ],
  "Belanja": [
    "indomaret", "alfamart", "alfamidi", "supermarket", "hypermart",
    "carrefour", "giant", "mall", "matahari", "uniqlo", "h&m", "transmart",
    "ace hardware", "informa",
  ],
  "Hiburan": [
    "bioskop", "cinema", "cinepolis", "xxi", "cgv", "netflix", "spotify",
    "karaoke",
  ],
};

const MONTH_NAMES: Record<string, string> = {
  jan: "01", januari: "01",
  feb: "02", februari: "02",
  mar: "03", maret: "03",
  apr: "04", april: "04",
  mei: "05", may: "05",
  jun: "06", juni: "06",
  jul: "07", juli: "07",
  agu: "08", agustus: "08", aug: "08",
  sep: "09", september: "09",
  okt: "10", oktober: "10", oct: "10",
  nov: "11", november: "11",
  des: "12", desember: "12", dec: "12",
};

// "12.500" / "Rp 12.500" / "12.500,00" (format Indonesia: titik = ribuan,
// koma = desimal) -> 12500. Dibulatkan ke rupiah penuh (tanpa desimal).
function parseIndoNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    const parts = normalized.split(",");
    normalized =
      parts.length === 2 && parts[1].length <= 2
        ? normalized.replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (normalized.includes(".")) {
    const parts = normalized.split(".");
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      normalized = normalized.replace(/\./g, "");
    }
  }

  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function extractAmount(lines: string[]): number | null {
  const totalLineKeywords = ["grand total", "total bayar", "total harga", "total"];
  for (const keyword of totalLineKeywords) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!lower.includes(keyword)) continue;
      const match = line.match(/[\d.,]+/g);
      if (!match) continue;
      const amount = parseIndoNumber(match[match.length - 1]);
      if (amount) return amount;
    }
  }

  // Fallback: angka terbesar yg kelihatan seperti nominal rupiah (>= 100)
  // di seluruh teks, mengasumsikan total biasanya jumlah terbesar di struk.
  let largest: number | null = null;
  for (const line of lines) {
    const matches = line.match(/[\d.,]+/g);
    if (!matches) continue;
    for (const m of matches) {
      const amount = parseIndoNumber(m);
      if (amount && amount >= 100 && (largest === null || amount > largest)) {
        largest = amount;
      }
    }
  }
  return largest;
}

function extractDate(text: string): string | null {
  // dd/mm/yyyy atau dd-mm-yyyy
  const numeric = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (numeric) {
    const day = numeric[1].padStart(2, "0");
    const month = numeric[2].padStart(2, "0");
    let year = numeric[3];
    if (year.length === 2) year = `20${year}`;
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // "15 Sep 2026" / "15 September 2026"
  const named = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (named) {
    const month = MONTH_NAMES[named[2].toLowerCase()];
    if (month) {
      return `${named[3]}-${month}-${named[1].padStart(2, "0")}`;
    }
  }

  return null;
}

function guessCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return null;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const merchant = lines[0]?.slice(0, 80) ?? null;
  const amount = extractAmount(lines);
  const date = extractDate(rawText);
  const categoryName = guessCategory(rawText);

  return { merchant, amount, date, categoryName };
}
