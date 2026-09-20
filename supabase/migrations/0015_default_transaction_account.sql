-- Akun default per anggota keluarga (bukan per family) — dipakai buat
-- prefill pilihan Akun saat tambah transaksi baru, supaya tiap user login
-- bisa punya akun favoritnya masing-masing (mis. Andri pakai BCA, Intan
-- pakai OVO), tanpa saling menimpa preferensi anggota lain.

alter table family_members
  add column default_account_id uuid references accounts(id) on delete set null;
