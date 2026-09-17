-- Portofolio Investasi (Fase 2, CLAUDE.md Bagian 4 & 6). Holding disimpan di
-- dalam akun bertipe Investasi, dikelompokkan ke 4 kategori. Field khusus per
-- kategori (fund_manager, issuer, ticker_code, gold_type, dst) nullable —
-- hanya diisi sesuai kategori holding-nya.
--
-- Ditulis idempotent (aman dijalankan ulang) mengikuti pola migrasi
-- sebelumnya di project ini — beberapa kali migrasi sempat gagal setengah
-- jalan saat pertama di-push.

do $$ begin
  create type investment_category as enum ('reksadana', 'obligasi_sukuk', 'saham', 'emas');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type fund_type as enum ('Pasar Uang', 'Pendapatan Tetap', 'Campuran', 'Saham', 'Indeks');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type bond_type as enum ('Obligasi Pemerintah', 'Obligasi Korporasi', 'Sukuk Ritel');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type coupon_frequency as enum ('Bulanan', 'Triwulanan', 'Semesteran', 'Tahunan');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type gold_type as enum ('Fisik/Batangan', 'Digital/Tabungan Emas');
exception when duplicate_object then null;
end $$;

create table if not exists investment_holdings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category investment_category not null,
  name text not null,
  platform text,
  purchase_date date not null,
  quantity numeric not null check (quantity > 0),
  purchase_price numeric not null check (purchase_price >= 0),
  current_price numeric not null check (current_price >= 0),
  notes text,
  -- khusus Reksadana
  fund_manager text,
  fund_type fund_type,
  -- khusus Obligasi/Sukuk
  issuer text,
  bond_type bond_type,
  coupon_rate numeric,
  coupon_frequency coupon_frequency,
  maturity_date date,
  -- khusus Saham
  ticker_code text,
  -- khusus Emas
  gold_type gold_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_investment_holdings_family on investment_holdings(family_id);
create index if not exists idx_investment_holdings_account on investment_holdings(account_id);

-- ============ RLS ============

alter table investment_holdings enable row level security;

drop policy if exists "Lihat holding investasi family sendiri" on investment_holdings;
create policy "Lihat holding investasi family sendiri"
  on investment_holdings for select
  using (is_family_member(family_id));

drop policy if exists "Tambah holding investasi ke family sendiri" on investment_holdings;
create policy "Tambah holding investasi ke family sendiri"
  on investment_holdings for insert
  with check (is_family_member(family_id));

drop policy if exists "Update holding investasi family sendiri" on investment_holdings;
create policy "Update holding investasi family sendiri"
  on investment_holdings for update
  using (is_family_member(family_id));

drop policy if exists "Hapus holding investasi family sendiri" on investment_holdings;
create policy "Hapus holding investasi family sendiri"
  on investment_holdings for delete
  using (is_family_member(family_id));

-- ============ Realtime ============

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'investment_holdings'
  ) then
    alter publication supabase_realtime add table investment_holdings;
  end if;
end $$;
