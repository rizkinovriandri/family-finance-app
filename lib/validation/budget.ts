import { z } from "zod";

export const budgetSchema = z.object({
  category_id: z.string().min(1, "Pilih kategori"),
  subcategory_id: z.string().optional(),
  target_amount: z.coerce.number().positive("Target harus lebih dari 0"),
  notes: z.string().trim().optional(),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
