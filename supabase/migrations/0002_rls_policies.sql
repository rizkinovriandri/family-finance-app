-- Row Level Security: setiap user hanya bisa akses data family_id miliknya sendiri
-- Referensi: CLAUDE.md Bagian 7

alter table families enable row level security;
alter table family_members enable row level security;
alter table categories enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

-- Helper: apakah user login adalah anggota family tsb
create or replace function is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from family_members
    where family_id = target_family_id
      and user_id = auth.uid()
  );
$$;

-- ============ families ============

create policy "Lihat family sendiri"
  on families for select
  using (is_family_member(id));

create policy "Buat family baru"
  on families for insert
  with check (auth.uid() is not null);

create policy "Update family sendiri"
  on families for update
  using (is_family_member(id));

-- ============ family_members ============

create policy "Lihat anggota family sendiri"
  on family_members for select
  using (is_family_member(family_id));

create policy "Tambah anggota baru ke family sendiri"
  on family_members for insert
  with check (is_family_member(family_id));

-- Bootstrap: user boleh jadi anggota pertama HANYA saat family itu baru
-- dibuat (belum ada member sama sekali) — mencegah user asing "gabung"
-- ke family manapun cuma dengan menebak family_id.
create policy "Jadi anggota pertama saat family baru dibuat"
  on family_members for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from family_members fm where fm.family_id = family_members.family_id
    )
  );

create policy "Update data anggota family sendiri"
  on family_members for update
  using (is_family_member(family_id));

create policy "Hapus anggota family sendiri"
  on family_members for delete
  using (is_family_member(family_id));

-- ============ categories ============
-- Kategori bawaan (is_default) bisa dibaca semua user login.

create policy "Lihat semua kategori"
  on categories for select
  using (auth.uid() is not null);

-- ============ accounts ============

create policy "Lihat akun family sendiri"
  on accounts for select
  using (is_family_member(family_id));

create policy "Tambah akun ke family sendiri"
  on accounts for insert
  with check (is_family_member(family_id));

create policy "Update akun family sendiri"
  on accounts for update
  using (is_family_member(family_id));

create policy "Hapus akun family sendiri"
  on accounts for delete
  using (is_family_member(family_id));

-- ============ transactions ============

create policy "Lihat transaksi family sendiri"
  on transactions for select
  using (is_family_member(family_id));

create policy "Tambah transaksi ke family sendiri"
  on transactions for insert
  with check (is_family_member(family_id) and created_by = auth.uid());

create policy "Update transaksi family sendiri"
  on transactions for update
  using (is_family_member(family_id));

create policy "Hapus transaksi family sendiri"
  on transactions for delete
  using (is_family_member(family_id));

-- ============ budgets ============

create policy "Lihat budget family sendiri"
  on budgets for select
  using (is_family_member(family_id));

create policy "Tambah budget ke family sendiri"
  on budgets for insert
  with check (is_family_member(family_id));

create policy "Update budget family sendiri"
  on budgets for update
  using (is_family_member(family_id));

create policy "Hapus budget family sendiri"
  on budgets for delete
  using (is_family_member(family_id));
