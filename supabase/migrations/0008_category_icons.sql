-- Kolom ikon per kategori (dipilih user lewat IconPicker di halaman Kelola
-- Kategori saat create/update). Nilainya adalah key dari CATEGORY_ICON_OPTIONS
-- (lib/constants/category-icons.tsx) — bukan enum DB karena daftar ikon murni
-- konsep UI, bukan aturan bisnis.

alter table categories add column if not exists icon text;

-- Backfill kategori bawaan (is_default) supaya langsung tampil dengan ikon
-- yang masuk akal, bukan cuma huruf awal nama.
update categories set icon = 'salary' where name = 'Gaji' and icon is null;
update categories set icon = 'bonus' where name = 'Bonus/THR' and icon is null;
update categories set icon = 'investment' where name = 'Hasil Investasi' and icon is null;
update categories set icon = 'gift' where name = 'Hadiah/Pemberian' and icon is null;
update categories set icon = 'wallet' where name = 'Pendapatan Lainnya' and icon is null;
update categories set icon = 'food' where name = 'Makanan & Minuman' and icon is null;
update categories set icon = 'transport' where name = 'Transportasi' and icon is null;
update categories set icon = 'bills' where name = 'Tagihan & Utilitas' and icon is null;
update categories set icon = 'education' where name = 'Pendidikan' and icon is null;
update categories set icon = 'health' where name = 'Kesehatan' and icon is null;
update categories set icon = 'entertainment' where name = 'Hiburan' and icon is null;
update categories set icon = 'shopping' where name = 'Belanja' and icon is null;
update categories set icon = 'debt' where name = 'Cicilan/Utang' and icon is null;
update categories set icon = 'donation' where name = 'Donasi/Sedekah' and icon is null;
update categories set icon = 'home' where name = 'Perawatan Rumah' and icon is null;
update categories set icon = 'folder' where name = 'Pengeluaran Lainnya' and icon is null;
update categories set icon = 'bank' where name = 'Transfer Antar Akun' and icon is null;
