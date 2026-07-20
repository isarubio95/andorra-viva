-- Segunda ubicación (sucursal) para negocios con plan Premium.
-- Las columnas location/address/latitude/longitude de businesses siguen siendo
-- la caché de la ubicación primaria.

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text,
  location text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_locations is
  'Ubicaciones de un negocio: 1 primaria (+ 1 secundaria con plan Premium).';

create unique index if not exists business_locations_one_primary_per_business_idx
  on public.business_locations (business_id)
  where is_primary = true;

create index if not exists business_locations_business_id_idx
  on public.business_locations (business_id);

-- Backfill: una fila primaria por cada negocio existente.
insert into public.business_locations (
  business_id,
  label,
  location,
  address,
  latitude,
  longitude,
  is_primary,
  sort_order
)
select
  b.id,
  'Principal',
  b.location,
  b.address,
  b.latitude,
  b.longitude,
  true,
  0
from public.businesses b
where not exists (
  select 1
  from public.business_locations bl
  where bl.business_id = b.id
    and bl.is_primary = true
);

-- Límites: máx. 1 ubicación sin Premium; máx. 2 con Premium (o admin).
create or replace function public.business_location_limit_for_owner(_owner_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.owner_has_premium_active(_owner_id) then 2
    when exists (
      select 1
      from public.user_roles ur
      where ur.user_id = _owner_id
        and ur.role = 'admin'
    ) then 2
    else 1
  end;
$$;

comment on function public.business_location_limit_for_owner(uuid) is
  'Máximo de ubicaciones permitidas según plan del dueño (Premium/admin = 2).';

create or replace function public.enforce_business_location_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_limit integer;
  v_count integer;
begin
  select b.owner_id into v_owner_id
  from public.businesses b
  where b.id = new.business_id;

  -- Negocios legacy sin dueño: solo se permite la ubicación primaria.
  if v_owner_id is null then
    if new.is_primary then
      new.updated_at := now();
      return new;
    end if;
    raise exception 'Negocio sin dueño';
  end if;

  v_limit := public.business_location_limit_for_owner(v_owner_id);

  select count(*)::integer into v_count
  from public.business_locations bl
  where bl.business_id = new.business_id;

  -- En INSERT la fila nueva aún no está en la tabla.
  if tg_op = 'INSERT' then
    v_count := v_count + 1;
  end if;

  if v_count > v_limit then
    raise exception 'Tu plan permite como máximo % ubicación(es)', v_limit;
  end if;

  if new.is_primary = false and v_limit < 2 then
    raise exception 'La segunda ubicación requiere plan Premium';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists business_locations_enforce_limits on public.business_locations;
create trigger business_locations_enforce_limits
  before insert or update on public.business_locations
  for each row
  execute function public.enforce_business_location_limits();

-- Sincronizar caché de businesses cuando cambia la ubicación primaria.
create or replace function public.sync_business_primary_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.is_primary then
    update public.businesses
    set
      location = new.location,
      address = new.address,
      latitude = new.latitude,
      longitude = new.longitude
    where id = new.business_id;
  end if;

  return new;
end;
$$;

drop trigger if exists business_locations_sync_primary on public.business_locations;
create trigger business_locations_sync_primary
  after insert or update on public.business_locations
  for each row
  execute function public.sync_business_primary_location();

-- Al crear un negocio, crear automáticamente su ubicación primaria.
create or replace function public.create_primary_business_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_locations (
    business_id,
    label,
    location,
    address,
    latitude,
    longitude,
    is_primary,
    sort_order
  )
  values (
    new.id,
    'Principal',
    new.location,
    new.address,
    new.latitude,
    new.longitude,
    true,
    0
  );
  return new;
end;
$$;

drop trigger if exists businesses_create_primary_location on public.businesses;
create trigger businesses_create_primary_location
  after insert on public.businesses
  for each row
  execute function public.create_primary_business_location();

-- Mantener fila primaria al actualizar location/address/coords en businesses
-- (el editor sigue escribiendo en businesses; la sync inversa evita divergencia).
create or replace function public.sync_primary_location_from_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    new.location is distinct from old.location
    or new.address is distinct from old.address
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
  then
    update public.business_locations
    set
      location = new.location,
      address = new.address,
      latitude = new.latitude,
      longitude = new.longitude,
      updated_at = now()
    where business_id = new.id
      and is_primary = true;
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_sync_primary_location on public.businesses;
create trigger businesses_sync_primary_location
  after update of location, address, latitude, longitude on public.businesses
  for each row
  execute function public.sync_primary_location_from_business();

-- Downgrade: borrar ubicaciones no primarias al perder Premium.
create or replace function public.subscriptions_clear_secondary_locations_on_downgrade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  had_access boolean;
  has_access boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  had_access :=
    (old.plan_id = 'premium' and old.status in ('active', 'trialing'))
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = old.user_id
        and ur.role = 'admin'
    );

  has_access :=
    public.owner_has_premium_active(new.user_id)
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = new.user_id
        and ur.role = 'admin'
    );

  if had_access and not has_access then
    delete from public.business_locations bl
    using public.businesses b
    where bl.business_id = b.id
      and b.owner_id = new.user_id
      and bl.is_primary = false;
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_clear_secondary_locations on public.subscriptions;
create trigger subscriptions_clear_secondary_locations
  after update of plan_id, status on public.subscriptions
  for each row
  execute function public.subscriptions_clear_secondary_locations_on_downgrade();

-- Feature en plan Premium.
update public.plans
set features = (
  case
    when 'Segunda ubicación' = any(features) then features
    else array_append(features, 'Segunda ubicación')
  end
)
where id = 'premium';

-- RLS
alter table public.business_locations enable row level security;

drop policy if exists "Public read business_locations" on public.business_locations;
create policy "Public read business_locations"
  on public.business_locations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners insert business_locations" on public.business_locations;
create policy "Owners insert business_locations"
  on public.business_locations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners update business_locations" on public.business_locations;
create policy "Owners update business_locations"
  on public.business_locations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners delete business_locations" on public.business_locations;
create policy "Owners delete business_locations"
  on public.business_locations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
    and is_primary = false
  );

grant select on public.business_locations to anon, authenticated;
grant insert, update, delete on public.business_locations to authenticated;
