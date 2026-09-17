import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(50, "Nama terlalu panjang"),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, "Pilih ikon"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
