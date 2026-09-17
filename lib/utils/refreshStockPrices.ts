import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { listSahamHoldings, updateHoldingCurrentPrice } from "@/lib/supabase/queries/investments";
import { fetchStockPrice } from "@/lib/utils/stockPrice";

// Update current_price semua holding kategori Saham milik keluarga dari
// Yahoo Finance. Dipanggil otomatis begitu halaman Akun dibuka (lihat
// AccountsManager) — bukan lagi tombol manual. Kegagalan per-ticker (mis.
// kode saham salah/API down) sengaja tidak menghentikan yang lain, supaya
// satu ticker bermasalah tidak bikin seluruh refresh gagal.
export async function refreshStockPrices(
  supabase: SupabaseClient<Database>,
  familyId: string
): Promise<void> {
  const holdings = await listSahamHoldings(supabase, familyId);
  if (holdings.length === 0) return;

  await Promise.allSettled(
    holdings.map(async (h) => {
      const result = await fetchStockPrice(h.tickerCode);
      await updateHoldingCurrentPrice(supabase, h.id, result.price);
    })
  );
}
