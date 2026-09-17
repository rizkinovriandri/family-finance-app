# Design System — family-finance-app

Referensi visual ini diekstrak dari mockup 12 layar (`mockup_app.png`) yang dijadikan acuan arah desain aplikasi. Warna diambil dengan sampling langsung dari file gambar, jadi nilainya **mendekati** (bukan dijamin pixel-perfect) — wajar kalau perlu disesuaikan sedikit secara visual saat implementasi nyata.

> **Catatan orisinalitas:** mockup asli memakai branding placeholder "Finora", logo daun, dan ilustrasi custom (orang duduk di gunung) untuk layar onboarding. Elemen-elemen itu **tidak dipakai** di sini — dokumen ini hanya mengekstrak struktur, palet warna, dan pola komponennya. Nama produk, logo, dan ilustrasi final memakai aset milik sendiri.

## 1. Prinsip Desain

- **Mobile-first, dark mode sebagai tema utama** — semua layar dirancang untuk layar HP dulu, dengan latar gelap dan teks terang
- **Scannable lewat warna & ikon** — tiap kategori transaksi punya warna & ikon konsisten, supaya anggota keluarga bisa scan cepat tanpa baca detail
- **Kartu sebagai unit informasi** — data dikelompokkan dalam kartu-kartu kecil (metric card), bukan tabel padat
- **Navigasi konsisten** — bottom nav 5 tab hadir di semua layar utama (Beranda, Transaksi, Budget, Laporan, Lainnya)

## 2. Palet Warna

### Warna dasar (base)
| Token | Hex (approx) | Penggunaan |
|---|---|---|
| `bg-page` | `#0E263D` | Latar belakang utama semua layar |
| `bg-surface` | `#0F2A42` | Kartu, panel, input field — sedikit lebih terang dari `bg-page` |
| `border-subtle` | `#1C3552` | Garis pemisah tipis antar item list |
| `text-primary` | `#FFFFFF` | Teks utama (angka, judul) |
| `text-secondary` | `#8CA3BC` | Label, subtitle, teks pendukung (perkiraan — sesuaikan agar kontras AA terpenuhi) |
| `text-muted` | `#5C7089` | Placeholder, teks paling redup |

### Warna aksen & semantik
| Token | Hex (approx) | Penggunaan |
|---|---|---|
| `accent` (primary) | `#1A69FD` | Tombol utama, link, tab aktif, ikon aktif di bottom nav |
| `success` | `#16D992` | Badge Pemasukan, status anggaran "Aman", angka positif |
| `danger` | `#F0554F` | Badge Pengeluaran, status anggaran "Melebihi", angka negatif |

> Hanya satu warna aksen solid (`accent`) dipakai untuk aksi utama — jangan pakai warna kategori sebagai warna tombol primer, supaya tombol utama tetap menonjol.

### Warna kategori

Pola yang dipakai mockup: setiap kategori punya **fill redup (muted)** untuk ikon non-aktif + **warna cerah** untuk glyph ikon/legend chart, atau **fill solid cerah** untuk state aktif/terpilih (misal saat kategori sedang dipilih di form tambah transaksi).

| Kategori | Fill redup (inactive icon bg) | Warna cerah (glyph / chart / active) |
|---|---|---|
| Makanan & Minuman | — (pakai fill solid saat aktif) | `#F86673` (coral) |
| Transportasi | `#072751` | `#8AC7FD` (biru muda) |
| Belanja | `#222149` | `#AC6FF0` (ungu) |
| Hiburan | `#242150` | `#A57AE4` (indigo/violet) |
| Tagihan & Utilitas | `#0B2A4A` | `#4FA0F0` (biru) |
| Kesehatan | `#2E1F26` | `#F0554F` (merah muda/danger) |
| Pendidikan | `#12332E` | `#3ECFAE` (teal) |
| Perawatan Rumah / Lainnya | `#1E2938` | `#8896A8` (abu-abu netral) |

> Kategori "Makanan" di mockup tampil beda dari yang lain — fill solid coral + ikon putih, bukan fill redup. Kemungkinan itu pola untuk **state terpilih/default** di form. Pilih salah satu pola secara konsisten (redup vs solid) untuk semua kategori saat implementasi, jangan campur tanpa alasan fungsional yang jelas (misal: solid = terpilih, redup = belum dipilih).

## 3. Tipografi

- Font: sans-serif geometris standar (mis. Inter, atau font default sistem) — tidak ada indikasi font custom di mockup
- **Angka besar** (saldo, total transaksi): ~28–32px, bold/semi-bold, putih
- **Judul section** ("Pengeluaran Bulan Ini", "Budget"): ~16–18px, medium
- **Body / label kartu**: ~13–14px, regular, `text-secondary`
- **Caption / metadata** (jam transaksi, tanggal kecil): ~11–12px, `text-muted`

## 4. Spacing & Radius

- Radius kartu: besar dan konsisten, ~16–20px — kesan lembut/modern
- Radius tombol & input: ~10–12px
- Radius ikon kategori (kotak): ~12px
- Padding kartu: ~16px semua sisi
- Jarak antar kartu/section: ~12–16px

## 5. Pola Komponen

### Metric card (kartu ringkasan angka)
Kartu `bg-surface`, radius besar, isi: label kecil (`text-secondary`) di atas, angka besar (`text-primary`, bold) di bawah. Dipakai berulang di Dashboard, Laporan, Detail Kategori.

### Ikon kategori
Kotak rounded ~40–44px. Dua state:
- **Aktif/terpilih:** fill solid warna kategori + glyph putih
- **Tidak aktif:** fill redup (lihat tabel warna) + glyph warna cerah kategori

### Progress bar anggaran
Bar tipis (~6px), track = `bg-surface` atau `border-subtle`, fill = `success` (masih dalam anggaran) atau `danger` (melebihi anggaran). Ditampilkan dengan label kategori + "terpakai / target" di atasnya.

### Donut chart + legend
Chart donut di kiri, legend list di kanan (dot warna + nama kategori + persentase). Tiap warna dot mengikuti warna kategori cerah pada tabel Bagian 2. Total/angka utama ditampilkan di tengah donut.

### List transaksi
Baris: ikon kategori (kiri) → deskripsi + kategori/anggota (tengah) → nominal, warna `success` untuk pemasukan / `danger` untuk pengeluaran (kanan). Dikelompokkan per tanggal ("Hari ini", "Kemarin").

### Bottom navigation
5 tab: Beranda, Transaksi, Budget, Laporan, Lainnya. Ikon aktif pakai warna `accent`, ikon tidak aktif pakai `text-muted`. Muncul di semua layar utama (bukan di layar auth/onboarding).

### Tombol
- **Primary:** fill `accent` solid, teks putih, radius ~10–12px, lebar penuh untuk CTA utama (mis. "Simpan", "Masuk")
- **Secondary/outline:** border tipis `border-subtle`, transparan, dipakai untuk aksi sekunder (mis. "Lanjut dengan Google")

### Tab / segmented control
Pill container `bg-surface`, tab aktif dapat highlight `accent` (fill atau underline), tab tidak aktif `text-secondary`. Dipakai di Transaksi (Semua/Pemasukan/Pengeluaran), Laporan (Pengeluaran/Pemasukan/Net Worth), dsb.

## 6. Pemetaan Layar Mockup → Scope Project

Referensi 12 layar di mockup dan statusnya terhadap scope yang sudah disepakati di `CLAUDE.md`:

| # | Layar | Status |
|---|---|---|
| 1–3 | Splash, Onboarding, Login/Signup | MVP (bagian auth) |
| 4 | Home/Dashboard | MVP |
| 5–6 | Transaction List, Add Transaction | MVP |
| 7 | Budget | MVP |
| 8 | Laporan (termasuk tab Net Worth) | Selesai — halaman `/reports`: tab Pengeluaran/Pemasukan dengan total + perubahan vs bulan lalu, grafik mingguan (W1-W4), dan Kategori Terbesar. Tab **Net Worth** tampil sebagai placeholder "segera hadir" (masuk Fase 2, lihat `CLAUDE.md` Bagian 4 & 6) |
| 9 | Goals / Tujuan Finansial | **Belum ada di scope manapun** — fitur baru yang muncul dari mockup ini, belum diputuskan. Perlu didiskusikan dulu sebelum masuk roadmap. |
| 10 | Profile & Settings | MVP (minimal: info akun, logout); item lain (Backup & Sinkronisasi, dsb.) bisa menyusul |
| 11 | Category Management | Selesai — halaman `/categories` ("Kelola Kategori", diakses dari menu Lainnya), kategori custom per keluarga bisa dipakai di transaksi & budgeting |
| 12 | Category Detail/Analytics | Belum ada — bisa menyusul di iterasi berikutnya |

## 7. Referensi Sumber

Gambar sumber: `mockup_app.png` (diupload user, 15 September 2026). Warna diekstrak lewat sampling piksel langsung dari file — bukan dari kode/desain asli, jadi anggap sebagai titik awal yang **cukup dekat**, bukan nilai final yang mengikat secara ketat.
