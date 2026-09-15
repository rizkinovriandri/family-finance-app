-- join_family_by_invite_code sebelumnya cuma cegah gabung ke family yang
-- SAMA dua kali, tapi tidak mencegah user yang sudah jadi anggota family
-- lain ikut gabung ke family kedua. Desain aplikasi ini satu user = satu
-- keluarga (lihat CLAUDE.md), jadi perlu diblokir eksplisit.

create or replace function join_family_by_invite_code(p_code text, p_display_name text)
returns table (family_id uuid, family_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families%rowtype;
begin
  if exists (select 1 from family_members where user_id = auth.uid()) then
    raise exception 'Kamu sudah menjadi anggota keluarga lain';
  end if;

  select * into v_family from families where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Kode undangan tidak ditemukan';
  end if;

  insert into family_members (family_id, user_id, display_name)
  values (v_family.id, auth.uid(), p_display_name);

  return query select v_family.id, v_family.name;
end;
$$;

-- Celah yang sama juga ada di jalur "buat family baru": bootstrap policy-nya
-- cuma cek family tujuan belum ada member, tapi tidak cek user penyapa
-- sudah jadi anggota family lain atau belum. Lewat UI aplikasi ini tidak
-- tercapai (dashboard cuma render form buat/gabung kalau user belum py
-- family sama sekali), tapi tetap perlu ditutup di level RLS supaya tidak
-- bisa dilewati lewat panggilan API langsung.
drop policy if exists "Jadi anggota pertama saat family baru dibuat" on family_members;

create policy "Jadi anggota pertama saat family baru dibuat"
  on family_members for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from family_members fm where fm.family_id = family_members.family_id
    )
    and not exists (
      select 1 from family_members fm2 where fm2.user_id = auth.uid()
    )
  );
