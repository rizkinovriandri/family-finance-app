import { z } from "zod";

export const subcategorySchema = z.object({
  category_id: z.string().min(1, "Pilih kategori"),
  name: z.string().trim().min(1, "Nama sub kategori wajib diisi").max(50, "Nama terlalu panjang"),
});

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
