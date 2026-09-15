-- Seed kategori default (CLAUDE.md Bagian 5)

insert into categories (name, type, is_default) values
  ('Gaji', 'income', true),
  ('Bonus/THR', 'income', true),
  ('Hasil Investasi', 'income', true),
  ('Hadiah/Pemberian', 'income', true),
  ('Pendapatan Lainnya', 'income', true),
  ('Makanan & Minuman', 'expense', true),
  ('Transportasi', 'expense', true),
  ('Tagihan & Utilitas', 'expense', true),
  ('Pendidikan', 'expense', true),
  ('Kesehatan', 'expense', true),
  ('Hiburan', 'expense', true),
  ('Belanja', 'expense', true),
  ('Cicilan/Utang', 'expense', true),
  ('Donasi/Sedekah', 'expense', true),
  ('Perawatan Rumah', 'expense', true),
  ('Pengeluaran Lainnya', 'expense', true),
  ('Transfer Antar Akun', 'transfer', true);
