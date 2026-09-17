import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Proxy server-side ke endpoint Yahoo Finance yang tidak resmi (tidak ada
// API key) — dipakai lewat server supaya tidak kena CORS dari browser, dan
// dibatasi ke user yang sudah login supaya server kita tidak jadi open proxy
// publik. Endpoint ini tidak didukung resmi oleh Yahoo, jadi bisa saja
// berubah/berhenti bekerja sewaktu-waktu tanpa pemberitahuan.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "Kode saham wajib diisi" }, { status: 400 });
  }

  // Saham Indonesia di Yahoo Finance pakai suffix ".JK" (Bursa Efek
  // Indonesia/Jakarta). Kalau user sudah masukkan suffix sendiri (mis. untuk
  // saham luar negeri), tidak ditambah lagi.
  const symbol = ticker.includes(".") ? ticker : `${ticker}.JK`;

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Kode saham "${ticker}" tidak ditemukan.` },
        { status: 404 }
      );
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;

    if (typeof price !== "number") {
      return NextResponse.json(
        { error: `Harga untuk "${ticker}" tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      price,
      currency: meta?.currency ?? "IDR",
      symbol,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil harga dari Yahoo Finance. Coba lagi nanti." },
      { status: 502 }
    );
  }
}
