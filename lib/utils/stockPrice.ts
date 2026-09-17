export interface StockPriceResult {
  price: number;
  currency: string;
  symbol: string;
}

export async function fetchStockPrice(ticker: string): Promise<StockPriceResult> {
  const res = await fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Gagal mengambil harga saham.");
  }
  return data;
}
