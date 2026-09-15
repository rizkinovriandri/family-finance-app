-- Skema awal family-finance-app
-- Referensi: CLAUDE.md Bagian 4 (Skema Database) & Bagian 5 (Proses Bisnis & Enum)

create extension if not exists pgcrypto;

-- ============ ENUMS ============

create type account_type as enum (
  'Tabungan', 'Giro', 'Deposito',
  'Investasi Saham', 'Investasi Reksadana', 'Investasi Obligasi',
  'Investasi Emas', 'Investasi Kripto', 'Dana Pensiun',
  'E-Wallet', 'Kas Tunai', 'Kartu Kredit', 'Pinjaman/Utang', 'Lainnya'
);

create type account_status as enum ('Aktif', 'Nonaktif', 'Ditutup');

create type currency_code as enum ('IDR', 'USD', 'SGD', 'EUR', 'JPY');

create type transaction_type as enum ('Pemasukan', 'Pengeluaran', 'Transfer Antar Akun');

create type payment_method as enum (
  'Tunai', 'Transfer Bank', 'Kartu Debit', 'Kartu Kredit',
  'E-Wallet', 'Autodebet', 'Qris', 'Lainnya'
);

create type category_type as enum ('income', 'expense', 'transfer');

-- ============ TABLES ============

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type category_type not null,
  is_default boolean not null default false
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  account_type account_type not null,
  institution text,
  account_identifier text,
  owner_member_id uuid references family_members(id) on delete set null,
  currency currency_code not null default 'IDR',
  opening_balance numeric not null default 0,
  status account_status not null default 'Aktif',
  priority_goal text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  date date not null,
  type transaction_type not null,
  category_id uuid not null references categories(id),
  account_id uuid not null references accounts(id) on delete cascade,
  description text,
  amount numeric not null check (amount > 0),
  family_member_id uuid not null references family_members(id),
  payment_method payment_method not null,
  notes text,
  transfer_pair_id uuid references transactions(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  month date not null,
  category_id uuid not null references categories(id),
  target_amount numeric not null check (target_amount >= 0),
  notes text,
  unique (family_id, month, category_id)
);

-- ============ INDEXES ============

create index idx_family_members_family on family_members(family_id);
create index idx_family_members_user on family_members(user_id);
create index idx_accounts_family on accounts(family_id);
create index idx_transactions_family_date on transactions(family_id, date desc);
create index idx_transactions_account on transactions(account_id);
create index idx_transactions_category on transactions(category_id);
create index idx_transactions_transfer_pair on transactions(transfer_pair_id);
create index idx_budgets_family_month on budgets(family_id, month);

-- ============ VIEWS (kalkulasi otomatis, tiru formula Excel) ============

-- current_balance per akun: opening_balance + pemasukan - pengeluaran
create view account_balances as
select
  a.id as account_id,
  a.family_id,
  a.opening_balance
    + coalesce(sum(t.amount) filter (where t.type = 'Pemasukan'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'Pengeluaran'), 0)
    as current_balance
from accounts a
left join transactions t on t.account_id = a.id
group by a.id, a.family_id, a.opening_balance;

-- realisasi budget per family + bulan + kategori
create view budget_realizations as
select
  b.id as budget_id,
  b.family_id,
  b.month,
  b.category_id,
  b.target_amount,
  coalesce(sum(t.amount) filter (
    where t.type = 'Pengeluaran'
      and t.category_id = b.category_id
      and date_trunc('month', t.date) = b.month
  ), 0) as realisasi
from budgets b
left join transactions t
  on t.family_id = b.family_id
group by b.id, b.family_id, b.month, b.category_id, b.target_amount;
