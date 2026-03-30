-- Alineación con RegisterBusiness.tsx: columnas habituales y RLS para insert/select
alter table public.businesses add column if not exists owner_id uuid references auth.users (id) on delete set null;
alter table public.businesses add column if not exists phone text;
alter table public.businesses add column if not exists website text;
alter table public.businesses add column if not exists price_range integer;
alter table public.businesses add column if not exists min_age integer;
alter table public.businesses add column if not exists services text[] not null default '{}';
alter table public.businesses add column if not exists latitude double precision;
alter table public.businesses add column if not exists longitude double precision;
alter table public.businesses add column if not exists image_url text;
alter table public.businesses add column if not exists rating double precision not null default 0;
alter table public.businesses add column if not exists review_count integer not null default 0;
alter table public.businesses add column if not exists is_premium boolean not null default false;

alter table public.businesses enable row level security;

grant select on public.businesses to anon, authenticated;
grant insert, update, delete on public.businesses to authenticated;

drop policy if exists "Public read businesses" on public.businesses;
create policy "Public read businesses"
on public.businesses
for select
to anon, authenticated
using (true);

drop policy if exists "Users insert own businesses" on public.businesses;
create policy "Users insert own businesses"
on public.businesses
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users update own businesses" on public.businesses;
create policy "Users update own businesses"
on public.businesses
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users delete own businesses" on public.businesses;
create policy "Users delete own businesses"
on public.businesses
for delete
to authenticated
using (owner_id = auth.uid());
