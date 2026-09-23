-- Sub kategori per kategori (mis. Transportasi -> Bensin, Servis Rutin,
-- Perbaikan) — supaya transaksi & budget bisa dirincikan lebih detail dari
-- level kategori. Selalu custom per keluarga (tidak ada konsep bawaan/global
-- seperti categories.is_default) karena rinciannya sangat spesifik per
-- keluarga.

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (family_id, category_id, name)
);

create index if not exists idx_subcategories_family on subcategories(family_id);
create index if not exists idx_subcategories_category on subcategories(category_id);

alter table subcategories enable row level security;

drop policy if exists "Lihat sub kategori family sendiri" on subcategories;
create policy "Lihat sub kategori family sendiri"
  on subcategories for select
  using (is_family_member(family_id));

drop policy if exists "Tambah sub kategori ke family sendiri" on subcategories;
create policy "Tambah sub kategori ke family sendiri"
  on subcategories for insert
  with check (is_family_member(family_id));

drop policy if exists "Update sub kategori family sendiri" on subcategories;
create policy "Update sub kategori family sendiri"
  on subcategories for update
  using (is_family_member(family_id));

drop policy if exists "Hapus sub kategori family sendiri" on subcategories;
create policy "Hapus sub kategori family sendiri"
  on subcategories for delete
  using (is_family_member(family_id));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subcategories'
  ) then
    alter publication supabase_realtime add table subcategories;
  end if;
end $$;

-- Transaksi & budget bisa opsional dirincikan per sub kategori.
alter table transactions add column if not exists subcategory_id uuid references subcategories(id) on delete set null;
alter table budgets add column if not exists subcategory_id uuid references subcategories(id) on delete cascade;

-- Constraint unik lama (family_id, month, category_id) diganti supaya bisa
-- ada budget per kategori (rollup, subcategory_id null) SEKALIGUS beberapa
-- budget per sub kategori di kategori yang sama, tanpa duplikat pada level
-- yang sama. Unique constraint biasa menganggap NULL selalu berbeda satu
-- sama lain (tidak mencegah 2 baris category-level dobel), makanya pakai
-- unique index dengan coalesce ke UUID sentinel supaya NULL ikut
-- diperlakukan sebagai nilai yang sama saat dibandingkan.
alter table budgets drop constraint if exists budgets_family_id_month_category_id_key;

create unique index if not exists budgets_unique_month_category_subcategory
  on budgets (family_id, month, category_id, coalesce(subcategory_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Realisasi: budget per sub kategori cuma menjumlahkan transaksi di sub
-- kategori itu; budget per kategori (tanpa sub kategori dipilih) tetap
-- roll-up semua transaksi di kategori itu, apa pun sub kategorinya —
-- konsisten dengan cara lama sebelum ada sub kategori.
-- `create or replace view` tidak bisa menyisipkan kolom baru di tengah
-- (subcategory_id sebelum target_amount) — Postgres menganggapnya me-rename
-- kolom target_amount, bukan menambah kolom. Makanya view di-drop dulu.
drop view if exists budget_realizations;

create view budget_realizations as
select
  b.id as budget_id,
  b.family_id,
  b.month,
  b.category_id,
  b.subcategory_id,
  b.target_amount,
  coalesce(sum(t.amount) filter (
    where t.type = 'Pengeluaran'
      and t.category_id = b.category_id
      and (b.subcategory_id is null or t.subcategory_id = b.subcategory_id)
      and t.date >= b.month
      and t.date < (b.month + interval '1 month')::date
  ), 0) as realisasi
from budgets b
left join transactions t
  on t.family_id = b.family_id
group by b.id, b.family_id, b.month, b.category_id, b.subcategory_id, b.target_amount;
