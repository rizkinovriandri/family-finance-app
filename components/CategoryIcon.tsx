import { getCategoryStyle } from "@/lib/constants/enums";
import { getCategoryIconComponent } from "@/lib/constants/category-icons";

const VARIANTS = {
  box: { wrapper: "w-9 h-9 rounded-lg", icon: "w-4.5 h-4.5", filled: true },
  lg: { wrapper: "w-12 h-12 rounded-xl", icon: "w-6 h-6", filled: true },
  chip: { wrapper: "w-5 h-5 rounded-full", icon: "w-3 h-3", filled: true },
  // Glyph polos tanpa latar/box sendiri — dipakai saat ikon perlu langsung
  // berdekatan dgn caption di bawahnya (mis. grid Kategori Cepat), tanpa
  // dobel kotak dgn box pembungkus di luar.
  bare: { wrapper: "w-8 h-8", icon: "w-8 h-8", filled: false },
} as const;

// Satu sumber tampilan ikon kategori (warna + glyph) supaya konsisten di
// semua tempat yang menampilkan kategori: list transaksi, list budget,
// pemilih kategori, dan halaman Kelola Kategori.
export function CategoryIcon({
  name,
  icon,
  variant = "box",
}: {
  name: string;
  icon?: string | null;
  variant?: keyof typeof VARIANTS;
}) {
  const style = getCategoryStyle(name);
  const Icon = getCategoryIconComponent(icon);
  const v = VARIANTS[variant];

  return (
    <span
      className={`${v.wrapper} flex items-center justify-center shrink-0 font-semibold text-xs`}
      style={v.filled ? { backgroundColor: style.mutedBg, color: style.bright } : { color: style.bright }}
    >
      {Icon ? <Icon className={v.icon} /> : name.charAt(0).toUpperCase()}
    </span>
  );
}
