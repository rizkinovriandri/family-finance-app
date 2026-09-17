import { z } from "zod";
import { BOND_TYPES, COUPON_FREQUENCIES, FUND_TYPES, GOLD_TYPES } from "@/lib/constants/enums";

const baseFields = {
  name: z.string().trim().min(1, "Nama instrumen wajib diisi"),
  platform: z.string().trim().optional(),
  purchase_date: z.string().min(1, "Tanggal beli wajib diisi"),
  quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  purchase_price: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  current_price: z.coerce.number().min(0, "Harga terkini tidak boleh negatif"),
  notes: z.string().trim().optional(),
};

export const holdingSchema = z.discriminatedUnion("category", [
  z.object({
    category: z.literal("reksadana"),
    ...baseFields,
    fund_manager: z.string().trim().min(1, "Manajer Investasi wajib diisi"),
    fund_type: z.enum(FUND_TYPES),
  }),
  z.object({
    category: z.literal("obligasi_sukuk"),
    ...baseFields,
    issuer: z.string().trim().min(1, "Penerbit wajib diisi"),
    bond_type: z.enum(BOND_TYPES),
    coupon_rate: z.coerce.number().min(0, "Kupon tidak boleh negatif"),
    coupon_frequency: z.enum(COUPON_FREQUENCIES),
    maturity_date: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  }),
  z.object({
    category: z.literal("saham"),
    ...baseFields,
    ticker_code: z.string().trim().min(1, "Kode saham wajib diisi"),
  }),
  z.object({
    category: z.literal("emas"),
    ...baseFields,
    gold_type: z.enum(GOLD_TYPES),
  }),
]);

export type HoldingFormValues = z.infer<typeof holdingSchema>;
