-- Kode undangan keluarga: anggota baru gabung ke family yang sudah ada
-- lewat kode ini, bukan dengan menebak family_id (yang sudah diblokir RLS).

alter table families add column invite_code text;

update families
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

alter table families alter column invite_code set not null;
alter table families add constraint families_invite_code_key unique (invite_code);

-- Join keluarga lewat kode: dieksekusi sebagai SECURITY DEFINER supaya bisa
-- mencari family lintas RLS (user yang belum jadi anggota tidak bisa SELECT
-- families secara langsung) dan insert family_members dengan aman.
create or replace function join_family_by_invite_code(p_code text, p_display_name text)
returns table (family_id uuid, family_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families%rowtype;
begin
  select * into v_family from families where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Kode undangan tidak ditemukan';
  end if;

  if exists (
    select 1 from family_members fm
    where fm.family_id = v_family.id and fm.user_id = auth.uid()
  ) then
    raise exception 'Kamu sudah menjadi anggota keluarga ini';
  end if;

  insert into family_members (family_id, user_id, display_name)
  values (v_family.id, auth.uid(), p_display_name);

  return query select v_family.id, v_family.name;
end;
$$;

revoke all on function join_family_by_invite_code(text, text) from public;
grant execute on function join_family_by_invite_code(text, text) to authenticated;
