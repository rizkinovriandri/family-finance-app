-- Foto profil per anggota keluarga. File disimpan di Supabase Storage
-- (bucket "avatars"), hanya URL publiknya yang disimpan di family_members.

alter table family_members add column if not exists avatar_url text;

-- Bucket publik: foto profil bukan data sensitif, dan URL publik dibutuhkan
-- supaya bisa langsung dipakai sebagai <img src> tanpa signed URL.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Konvensi path: "{user_id}/{filename}" — setiap user hanya boleh
-- upload/ubah/hapus file di folder miliknya sendiri (folder pertama di path
-- harus sama dengan auth.uid()).
create policy "Lihat semua foto profil"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Upload foto profil sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update foto profil sendiri"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Hapus foto profil sendiri"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
