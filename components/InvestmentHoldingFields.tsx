"use client";

import { useState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Field } from "@/components/FormField";
import { FUND_TYPES, BOND_TYPES, COUPON_FREQUENCIES, GOLD_TYPES } from "@/lib/constants/enums";
import { fetchStockPrice } from "@/lib/utils/stockPrice";
import type {
  BondType,
  CouponFrequency,
  FundType,
  GoldType,
  InvestmentCategory,
} from "@/lib/types/database";

export interface HoldingFieldsState {
  platform: string;
  purchase_date: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  notes: string;
  fund_manager: string;
  fund_type: FundType;
  issuer: string;
  bond_type: BondType;
  coupon_rate: number;
  coupon_frequency: CouponFrequency;
  maturity_date: string;
  ticker_code: string;
  gold_type: GoldType;
}

export const EMPTY_HOLDING_FIELDS: HoldingFieldsState = {
  platform: "",
  purchase_date: "",
  quantity: 0,
  purchase_price: 0,
  current_price: 0,
  notes: "",
  fund_manager: "",
  fund_type: FUND_TYPES[0],
  issuer: "",
  bond_type: BOND_TYPES[0],
  coupon_rate: 0,
  coupon_frequency: COUPON_FREQUENCIES[0],
  maturity_date: "",
  ticker_code: "",
  gold_type: GOLD_TYPES[0],
};

export const QUANTITY_UNIT: Record<InvestmentCategory, string> = {
  reksadana: "unit",
  obligasi_sukuk: "lembar",
  saham: "lembar",
  emas: "gram",
};

// Field umum + field khusus kategori untuk satu holding investasi, urutan
// mengikuti kolom investment_holdings di CLAUDE.md Bagian 4 (field umum
// dulu, baru field spesifik kategori). Dipakai bareng oleh form "Tambah Akun
// Investasi" (holding pertama) dan form "Tambah Holding" di Portofolio.
export function InvestmentHoldingFields({
  category,
  value,
  onChange,
  errors = {},
}: {
  category: InvestmentCategory;
  value: HoldingFieldsState;
  onChange: (next: HoldingFieldsState) => void;
  errors?: Record<string, string>;
}) {
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Otomatis ambil harga begitu user selesai mengetik kode saham (blur) —
  // tidak ada tombol manual. Field "Harga terkini" untuk Saham dikunci
  // (lihat CurrencyInput disabled di bawah), diisi lewat sini atau lewat
  // refresh otomatis saat halaman Akun dibuka (lihat refreshStockPrices).
  async function handleTickerBlur() {
    const ticker = value.ticker_code.trim();
    if (!ticker) return;
    setPriceLoading(true);
    setPriceError(null);
    try {
      const result = await fetchStockPrice(ticker);
      onChange({ ...value, current_price: result.price });
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : "Gagal mengambil harga saham.");
    } finally {
      setPriceLoading(false);
    }
  }

  return (
    <>
      <Field label="Platform/Broker (opsional)" error={errors.platform}>
        <input
          value={value.platform}
          onChange={(e) => onChange({ ...value, platform: e.target.value })}
          className="input"
        />
      </Field>

      <Field label="Tanggal beli" error={errors.purchase_date}>
        <input
          type="date"
          value={value.purchase_date}
          onChange={(e) => onChange({ ...value, purchase_date: e.target.value })}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Jumlah (${QUANTITY_UNIT[category]})`} error={errors.quantity}>
          <input
            type="number"
            step="0.0001"
            value={value.quantity}
            onChange={(e) => onChange({ ...value, quantity: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <Field
          label={category === "emas" ? "Harga beli rata-rata" : "Harga beli/satuan"}
          error={errors.purchase_price}
        >
          <CurrencyInput
            value={value.purchase_price}
            onChange={(purchase_price) => onChange({ ...value, purchase_price })}
          />
        </Field>
      </div>

      <Field
        label={category === "emas" ? "Harga saat ini" : "Harga terkini/satuan"}
        error={errors.current_price}
      >
        <CurrencyInput
          value={value.current_price}
          onChange={(current_price) => onChange({ ...value, current_price })}
          disabled={category === "saham"}
        />
        {category === "saham" && (
          <p className="text-xs text-text-muted mt-1">
            {priceLoading
              ? "Mengambil harga terkini..."
              : "Diperbarui otomatis dari Yahoo Finance — tidak bisa diisi manual."}
          </p>
        )}
      </Field>

      <Field label="Catatan (opsional)" error={errors.notes}>
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          className="input"
          rows={2}
        />
      </Field>

      {category === "reksadana" && (
        <>
          <Field label="Manajer Investasi" error={errors.fund_manager}>
            <input
              value={value.fund_manager}
              onChange={(e) => onChange({ ...value, fund_manager: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Jenis reksadana" error={errors.fund_type}>
            <select
              value={value.fund_type}
              onChange={(e) => onChange({ ...value, fund_type: e.target.value as FundType })}
              className="input"
            >
              {FUND_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {category === "obligasi_sukuk" && (
        <>
          <Field label="Penerbit" error={errors.issuer}>
            <input
              value={value.issuer}
              onChange={(e) => onChange({ ...value, issuer: e.target.value })}
              className="input"
              placeholder="Pemerintah RI / nama korporasi"
            />
          </Field>
          <Field label="Jenis" error={errors.bond_type}>
            <select
              value={value.bond_type}
              onChange={(e) => onChange({ ...value, bond_type: e.target.value as BondType })}
              className="input"
            >
              {BOND_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kupon (%/tahun)" error={errors.coupon_rate}>
              <input
                type="number"
                step="0.01"
                value={value.coupon_rate}
                onChange={(e) => onChange({ ...value, coupon_rate: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Frekuensi kupon" error={errors.coupon_frequency}>
              <select
                value={value.coupon_frequency}
                onChange={(e) =>
                  onChange({ ...value, coupon_frequency: e.target.value as CouponFrequency })
                }
                className="input"
              >
                {COUPON_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tanggal jatuh tempo" error={errors.maturity_date}>
            <input
              type="date"
              value={value.maturity_date}
              onChange={(e) => onChange({ ...value, maturity_date: e.target.value })}
              className="input"
            />
          </Field>
        </>
      )}

      {category === "saham" && (
        <Field label="Kode saham" error={errors.ticker_code}>
          <input
            value={value.ticker_code}
            onChange={(e) => onChange({ ...value, ticker_code: e.target.value.toUpperCase() })}
            onBlur={handleTickerBlur}
            className="input"
            placeholder="mis. BBCA"
          />
          {priceError && <p className="text-xs text-danger mt-1">{priceError}</p>}
        </Field>
      )}

      {category === "emas" && (
        <Field label="Jenis emas" error={errors.gold_type}>
          <select
            value={value.gold_type}
            onChange={(e) => onChange({ ...value, gold_type: e.target.value as GoldType })}
            className="input"
          >
            {GOLD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
