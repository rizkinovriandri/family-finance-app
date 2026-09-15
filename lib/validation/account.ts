import { z } from "zod";
import { ACCOUNT_TYPES, ACCOUNT_STATUSES, CURRENCIES } from "@/lib/constants/enums";

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi"),
  account_type: z.enum(ACCOUNT_TYPES),
  institution: z.string().trim().optional(),
  account_identifier: z.string().trim().optional(),
  owner_member_id: z.string().optional(),
  currency: z.enum(CURRENCIES),
  opening_balance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif"),
  status: z.enum(ACCOUNT_STATUSES),
  priority_goal: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
