-- Bucket para fotos de negocios (RegisterBusiness.tsx → .from('business-images'))
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-images',
  'business-images',
  true,
  5242880, -- 5 MiB por objeto
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública (URLs con getPublicUrl)
drop policy if exists "Public read business-images" on storage.objects;
create policy "Public read business-images"
on storage.objects
for select
using (bucket_id = 'business-images');

-- Subida solo en carpeta {auth.uid()}/...
drop policy if exists "Users upload own business-images" on storage.objects;
create policy "Users upload own business-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Actualizar/borrar solo objetos propios
drop policy if exists "Users update own business-images" on storage.objects;
create policy "Users update own business-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-images'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'business-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own business-images" on storage.objects;
create policy "Users delete own business-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
