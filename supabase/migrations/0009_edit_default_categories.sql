-- Izinkan kategori bawaan (is_default) diedit (nama/ikon) oleh user manapun
-- yang login. Kategori bawaan adalah satu baris data bersama lintas keluarga
-- (family_id null), jadi perubahan ini berlaku global untuk semua keluarga
-- di sistem — keputusan sadar dari user, bukan bug. Hapus tetap dibatasi
-- hanya untuk kategori custom (not is_default) supaya kategori bersama tidak
-- hilang begitu saja untuk keluarga lain.

drop policy if exists "Update kategori custom family sendiri" on categories;
drop policy if exists "Update kategori bawaan atau kategori custom family sendiri" on categories;

create policy "Update kategori bawaan atau kategori custom family sendiri"
  on categories for update
  using (is_default or is_family_member(family_id))
  with check (is_default or is_family_member(family_id));
