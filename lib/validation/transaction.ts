import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants/enums";

export const transactionSchema = z.object({
  type: z.enum(["Pemasukan", "Pengeluaran"]),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  category_id: z.string().min(1, "Pilih kategori"),
  account_id: z.string().min(1, "Pilih akun"),
  family_member_id: z.string().min(1, "Pilih anggota keluarga"),
  payment_method: z.enum(PAYMENT_METHODS),
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const transferSchema = z
  .object({
    amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
    from_account_id: z.string().min(1, "Pilih akun asal"),
    to_account_id: z.string().min(1, "Pilih akun tujuan"),
    family_member_id: z.string().min(1, "Pilih anggota keluarga"),
    date: z.string().min(1, "Tanggal wajib diisi"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: "Akun asal dan tujuan tidak boleh sama",
    path: ["to_account_id"],
  });

export type TransferFormValues = z.infer<typeof transferSchema>;

export const balanceAdjustmentSchema = z.object({
  target_balance: z.coerce.number(),
  family_member_id: z.string().min(1, "Pilih anggota keluarga"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().trim().optional(),
});

export type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentSchema>;
