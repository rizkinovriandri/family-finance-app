-- Aktifkan Supabase Realtime (postgres_changes) untuk tabel yang datanya
-- dikolaborasikan bareng anggota keluarga. RLS tetap berlaku: tiap client
-- cuma menerima event untuk row yang memang boleh diakses (is_family_member).

alter publication supabase_realtime add table accounts;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table budgets;
