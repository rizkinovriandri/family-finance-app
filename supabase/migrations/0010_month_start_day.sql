-- Tanggal awal siklus bulanan per keluarga, dipakai sebagai acuan rentang
-- "bulan" untuk Budget, Dashboard, dan Laporan (mis. siklus gajian mulai
-- tanggal 25, bukan tanggal 1 kalender). Dibatasi 1-28 supaya selalu valid
-- di semua bulan termasuk Februari. Default 1 = perilaku lama (bulan
-- kalender biasa), jadi keluarga yang belum atur apa-apa tidak terpengaruh.

alter table families add column if not exists month_start_day smallint not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'families_month_start_day_range'
  ) then
    alter table families add constraint families_month_start_day_range
      check (month_start_day between 1 and 28);
  end if;
end $$;

-- budget_realizations sebelumnya pakai date_trunc('month', t.date) = b.month,
-- yang mengasumsikan b.month selalu tanggal 1 kalender. Sekarang b.month bisa
-- berupa tanggal awal siklus custom (mis. 25), jadi perbandingannya diganti
-- jadi rentang [b.month, b.month + 1 bulan) — tetap benar untuk kasus lama
-- (month_start_day=1) dan sekaligus benar untuk siklus custom.
create or replace view budget_realizations as
select
  b.id as budget_id,
  b.family_id,
  b.month,
  b.category_id,
  b.target_amount,
  coalesce(sum(t.amount) filter (
    where t.type = 'Pengeluaran'
      and t.category_id = b.category_id
      and t.date >= b.month
      and t.date < (b.month + interval '1 month')::date
  ), 0) as realisasi
from budgets b
left join transactions t
  on t.family_id = b.family_id
group by b.id, b.family_id, b.month, b.category_id, b.target_amount;
