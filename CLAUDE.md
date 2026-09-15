# CLAUDE.md — family-finance-app

Dokumen ini adalah blueprint & panduan kerja untuk Claude Code saat mengembangkan project ini. Dibaca otomatis di setiap sesi baru — selalu update bagian "Status Fitur" setelah menyelesaikan suatu task.

## 1. Project Overview

Aplikasi pencatatan keuangan kolaboratif untuk keluarga (web app / PWA), menggantikan sistem pencatatan manual berbasis Excel yang sebelumnya dipakai. Seluruh anggota keluarga dapat mencatat transaksi ke satu pool data bersama secara real-time, dengan hak akses yang setara untuk semua anggota.

Referensi struktur data & proses bisnis diambil dari file `Catatan_Keuangan_Keluarga_ver_2.xlsx` yang sebelumnya digunakan secara manual — lihat Bagian 4 & 5 untuk detail migrasinya.

## 2. Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel (frontend), Supabase (managed backend)
- **PWA:** next-pwa atau setup manual manifest.json + service worker
- **Styling/UI:** Tailwind CSS, dark mode sebagai tema utama, mengikuti `docs/design-system.md` untuk warna, tipografi, dan pola komponen

Jangan menyarankan library/stack lain di luar ini kecuali didiskusikan ulang.

## 3. Struktur Folder & Konvensi Kode

```
app/                  → routes (App Router)
  (auth)/              → halaman login/register
  dashboard/
  transactions/
  budgets/
components/           → shared UI components
lib/
  supabase/            → client init, query helpers
  types/               → TypeScript types (idealnya digenerate dari schema Supabase)
```

- Gunakan **functional components** + hooks, tanpa class component
- Semua teks UI dalam **Bahasa Indonesia**
- Query Supabase selalu lewat helper di `lib/supabase/`, jangan panggil client langsung dari komponen
- Environment variables untuk kredensial Supabase, jangan pernah hardcode

## 4. Skema Database

Skema di bawah adalah hasil normalisasi dari sheet-sheet Excel sebelumnya (`Daftar Akun`, `Transaksi`, `Anggaran Bulanan`). Nilai aktual (saldo, nomor rekening, dsb.) di file lama **tidak dimigrasikan otomatis** — hanya strukturnya yang dijadikan acuan skema.

### `families`
Satu keluarga = satu ruang data bersama.
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| name | text | |
| created_at | timestamptz | |

### `family_members`
Relasi user ↔ keluarga. Semua member punya hak akses setara (tidak ada role admin/viewer).
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK → families | |
| user_id | uuid FK → auth.users | |
| display_name | text | mis. "Andri", "Intan" |
| created_at | timestamptz | |

### `accounts` (dari sheet "Daftar Akun")
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK | |
| name | text | mis. "BNI Tabungan" |
| account_type | enum | lihat daftar di Bagian 5 |
| institution | text | nama bank/penyedia |
| account_identifier | text | no. rekening (opsional, sensitif) |
| owner_member_id | uuid FK → family_members | |
| currency | enum | IDR, USD, SGD, EUR, JPY |
| opening_balance | numeric | saldo awal |
| status | enum | Aktif, Nonaktif, Ditutup |
| priority_goal | text | opsional, tujuan tabungan |
| notes | text | |
| created_at, updated_at | timestamptz | |

> `current_balance` **tidak disimpan sebagai kolom statis** — dihitung via view/query (`opening_balance + SUM(pemasukan) - SUM(pengeluaran)` dari tabel `transactions`), meniru perilaku auto-calculate di Excel.

### `categories`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| name | text | |
| type | enum | income, expense, transfer |
| is_default | boolean | true untuk kategori bawaan (lihat Bagian 5) |

### `transactions` (dari sheet "Transaksi")
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK | |
| date | date | |
| type | enum | Pemasukan, Pengeluaran, Transfer Antar Akun |
| category_id | uuid FK → categories | |
| account_id | uuid FK → accounts | |
| description | text | |
| amount | numeric | **selalu positif** — arah dana ditentukan kolom `type`, bukan tanda minus |
| family_member_id | uuid FK | siapa yang mencatat/melakukan transaksi |
| payment_method | enum | lihat Bagian 5 |
| notes | text | |
| transfer_pair_id | uuid, nullable, self-reference | menghubungkan 2 baris transfer antar akun (lihat Bagian 5) |
| created_by | uuid FK → auth.users | |
| created_at, updated_at | timestamptz | |

### `budgets` (dari sheet "Anggaran Bulanan")
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK | |
| month | date | disimpan sebagai tanggal 1 di bulan tsb, mis. 2026-09-01 |
| category_id | uuid FK → categories | |
| target_amount | numeric | |
| notes | text | |

> `realisasi`, `selisih`, `% terpakai`, dan `status` (Aman/Waspada/Melebihi) **tidak disimpan** — dihitung via query dari `transactions` yang match `category_id` + `month`, sama seperti formula otomatis di Excel.

### Fase 2 (belum masuk MVP, lihat Bagian 6)
Excel lama juga punya sheet `Portofolio Investasi` dan `Kekayaan Bersih` untuk tracking investasi (saham, reksadana, emas, dsb.) dan net worth. Skemanya belum dirancang di sini — didesain ulang saat masuk fase pengembangan berikutnya.

## 5. Proses Bisnis & Aturan Transaksional (dari Excel lama)

Aturan ini **wajib diikuti** saat implementasi logic transaksi, karena jadi acuan utama dari kebiasaan pencatatan keluarga sebelumnya:

1. **Jumlah transaksi selalu angka positif.** Arah dana (masuk/keluar) ditentukan oleh kolom `type` (Pemasukan/Pengeluaran), bukan tanda minus pada `amount`.
2. **Transfer antar akun dicatat sebagai 2 baris transaksi terpisah**: satu baris Pengeluaran dari akun asal, satu baris Pemasukan ke akun tujuan, keduanya berkategori "Transfer Antar Akun". Gunakan `transfer_pair_id` untuk menghubungkan kedua baris ini agar bisa ditampilkan/diedit sebagai satu kesatuan di UI.
3. **Saldo akun (`current_balance`) selalu dihitung otomatis**, tidak boleh diedit manual oleh user — turunan dari `opening_balance` + akumulasi transaksi terkait akun tersebut.
4. **Budget realisasi dihitung otomatis** dari transaksi expense yang cocok kategori + bulan — user hanya input `target_amount`.
5. Setiap transaksi tercatat atas nama **satu anggota keluarga tertentu** (`family_member_id`) untuk keperluan transparansi/log siapa mencatat apa.

### Daftar Enum (referensi dari dropdown Excel)

**Jenis Akun:** Tabungan, Giro, Deposito, Investasi Saham, Investasi Reksadana, Investasi Obligasi, Investasi Emas, Investasi Kripto, Dana Pensiun, E-Wallet, Kas Tunai, Kartu Kredit, Pinjaman/Utang, Lainnya

**Status Akun:** Aktif, Nonaktif, Ditutup

**Mata Uang:** IDR, USD, SGD, EUR, JPY

**Jenis Transaksi:** Pemasukan, Pengeluaran, Transfer Antar Akun

**Metode Pembayaran:** Tunai, Transfer Bank, Kartu Debit, Kartu Kredit, E-Wallet, Autodebet, Qris, Lainnya

**Kategori Pemasukan:** Gaji, Bonus/THR, Hasil Investasi, Hadiah/Pemberian, Pendapatan Lainnya

**Kategori Pengeluaran:** Makanan & Minuman, Transportasi, Tagihan & Utilitas, Pendidikan, Kesehatan, Hiburan, Belanja, Cicilan/Utang, Donasi/Sedekah, Perawatan Rumah, Pengeluaran Lainnya

> Kategori-kategori ini di-seed sebagai default saat inisialisasi database (`is_default = true`), tapi idealnya user tetap bisa menambah kategori custom di kemudian hari.

## 6. Fitur & Scope

### MVP (versi pertama — wajib ada)
- [x] Auth (register/login, multi-user per keluarga) — termasuk kode undangan keluarga & reset password
- [x] Manajemen akun (CRUD `accounts`) — prasyarat untuk transaksi
- [x] CRUD transaksi (income/expense/transfer, sesuai aturan Bagian 5) — termasuk riwayat transaksi per akun
- [ ] Budget bulanan per kategori (target + realisasi otomatis)
- [ ] Dashboard: total saldo semua akun, total pemasukan/pengeluaran, saldo bersih, realisasi anggaran vs target, kategori yang melebihi budget, grafik tren bulanan
- [ ] PWA (installable, "Add to Home Screen")
- [ ] Realtime sync antar anggota keluarga (Supabase Realtime)

### Fase 2 (menyusul, di luar scope awal)
- [ ] Portofolio investasi (saham, reksadana, obligasi, emas) — dari sheet "Portofolio Investasi"
- [ ] Kekayaan bersih / net worth tracking — dari sheet "Kekayaan Bersih"
- [ ] Scan struk otomatis (OCR)
- [ ] Reminder tagihan rutin
- [ ] Export laporan ke Excel/PDF

## 7. Aturan/Batasan Khusus

- Jangan pernah expose Supabase service role key di client — hanya `anon key` yang boleh dipakai di frontend
- Semua form input pakai validasi (mis. Zod) sebelum submit ke Supabase
- Gunakan Row Level Security (RLS) di Supabase agar user hanya bisa akses data `family_id` miliknya sendiri
- Semua teks UI dalam Bahasa Indonesia
- Jangan hardcode kategori/enum di banyak tempat — sentralisasi di satu file konstanta yang mengacu ke Bagian 5

## 8. UI & Design System

Referensi visual lengkap ada di `docs/design-system.md` — diekstrak dari mockup 12 layar (dark mode, aksen biru) yang jadi acuan tampilan. Baca file itu bersamaan dengan `CLAUDE.md` ini setiap kali membangun atau mengubah komponen UI, supaya hasilnya konsisten antar sesi.

Ringkasan cepat:
- Tema **dark mode** dengan latar navy gelap dan **biru** sebagai warna aksen utama
- Pola UI inti yang berulang di banyak layar: metric card (ringkasan angka), progress bar anggaran, donut chart pengeluaran, list transaksi dengan ikon kategori, dan bottom navigation 5 tab
- Setiap kategori transaksi punya warna & ikon konsisten — lihat tabel warna kategori di `docs/design-system.md`

> Mockup asli menggunakan branding placeholder "Finora" dan ilustrasi custom untuk layar onboarding. **Jangan dipakai literal** — hanya struktur, palet warna, dan pola komponennya yang jadi acuan. Ganti dengan nama & aset visual aplikasi kamu sendiri.

## 9. Perintah Umum

```bash
npm run dev          # jalankan dev server lokal
npm run build         # build production
npx supabase db push  # jalankan migration ke Supabase
```

---
*Update bagian checklist di Bagian 6 setiap kali fitur selesai dikerjakan, supaya jadi tracker progres yang akurat.*

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
