-- Kategori khusus untuk transaksi penyesuaian saldo (fitur "Sesuaikan Saldo"
-- di halaman Akun) — dipakai supaya koreksi saldo tercatat sebagai transaksi
-- normal (sesuai aturan CLAUDE.md Bagian 5: saldo dihitung otomatis dari
-- transaksi, bukan diedit manual), bukan numpuk ke kategori "Lainnya".

insert into categories (name, type, is_default, icon)
select 'Penyesuaian Saldo', 'income', true, 'folder'
where not exists (
  select 1 from categories where name = 'Penyesuaian Saldo' and type = 'income'
);

insert into categories (name, type, is_default, icon)
select 'Penyesuaian Saldo', 'expense', true, 'folder'
where not exists (
  select 1 from categories where name = 'Penyesuaian Saldo' and type = 'expense'
);
