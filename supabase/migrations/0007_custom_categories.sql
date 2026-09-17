-- Kategori custom per keluarga (CLAUDE.md Bagian 3: "user tetap bisa
-- menambah kategori custom di kemudian hari"). Kategori bawaan (is_default)
-- tetap global (family_id null, terlihat semua user), kategori custom
-- di-scope ke satu family lewat family_id agar tidak bocor ke family lain.
--
-- Ditulis idempotent (aman dijalankan ulang) karena sempat gagal setengah
-- jalan saat pertama kali di-push — kalau statement sebelumnya sudah pernah
-- sukses, retry tidak boleh error lagi gara-gara "sudah ada".

alter table categories add column if not exists family_id uuid references families(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_default_or_family_scoped'
  ) then
    alter table categories add constraint categories_default_or_family_scoped check (
      (is_default and family_id is null) or (not is_default and family_id is not null)
    );
  end if;
end $$;

create index if not exists idx_categories_family on categories(family_id);

-- ============ RLS ============

drop policy if exists "Lihat semua kategori" on categories;
drop policy if exists "Lihat kategori bawaan & kategori family sendiri" on categories;

create policy "Lihat kategori bawaan & kategori family sendiri"
  on categories for select
  using (is_default or is_family_member(family_id));

drop policy if exists "Tambah kategori custom ke family sendiri" on categories;

create policy "Tambah kategori custom ke family sendiri"
  on categories for insert
  with check (not is_default and is_family_member(family_id));

drop policy if exists "Update kategori custom family sendiri" on categories;

create policy "Update kategori custom family sendiri"
  on categories for update
  using (not is_default and is_family_member(family_id));

drop policy if exists "Hapus kategori custom family sendiri" on categories;

create policy "Hapus kategori custom family sendiri"
  on categories for delete
  using (not is_default and is_family_member(family_id));

-- ============ Realtime ============

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table categories;
  end if;
end $$;
