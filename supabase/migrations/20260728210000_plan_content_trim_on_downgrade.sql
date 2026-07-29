-- Gracia de 7 días para recortar gallery/services al bajar de plan.
-- Redes y ubicaciones secundarias siguen limpiándose al instante (triggers previos).

-- ---------------------------------------------------------------------------
-- Columnas
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  add column if not exists content_trim_due_at timestamptz;

comment on column public.subscriptions.content_trim_due_at is
  'Si no es null, el owner debe elegir fotos/servicios a conservar antes de esta fecha; luego auto-recorte.';

create index if not exists idx_subscriptions_content_trim_due
  on public.subscriptions (content_trim_due_at)
  where content_trim_due_at is not null;

alter table public.businesses
  add column if not exists owner_plan_id text references public.plans (id);

comment on column public.businesses.owner_plan_id is
  'Caché del plan del owner para acotar galería/servicios en vistas públicas sin join a subscriptions.';

create index if not exists idx_businesses_owner_plan_id
  on public.businesses (owner_plan_id);

-- Backfill owner_plan_id
update public.businesses b
set owner_plan_id = case
  when exists (
    select 1 from public.user_roles ur
    where ur.user_id = b.owner_id and ur.role = 'admin'
  ) then 'premium'
  else coalesce(s.plan_id, 'free')
end
from public.subscriptions s
where s.user_id = b.owner_id;

update public.businesses b
set owner_plan_id = case
  when exists (
    select 1 from public.user_roles ur
    where ur.user_id = b.owner_id and ur.role = 'admin'
  ) then 'premium'
  else 'free'
end
where owner_id is not null
  and owner_plan_id is null;

-- ---------------------------------------------------------------------------
-- Límites por plan (parity con src/lib/business-profile-plan.ts)
-- ---------------------------------------------------------------------------

create or replace function public.plan_content_limits(p_plan_id text)
returns table (max_photos int, max_services int)
language sql
immutable
as $$
  select
    case coalesce(p_plan_id, 'free')
      when 'premium' then 10
      when 'pro' then 6
      else 3
    end as max_photos,
    case coalesce(p_plan_id, 'free')
      when 'premium' then 12
      when 'pro' then 7
      when 'basic' then 5
      else 4
    end as max_services;
$$;

comment on function public.plan_content_limits(text) is
  'Máximo de fotos y servicios por plan_id (free/basic/pro/premium).';

revoke all on function public.plan_content_limits(text) from public;
grant execute on function public.plan_content_limits(text) to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Sync owner_plan_id + content_trim_due_at al cambiar plan
-- ---------------------------------------------------------------------------

create or replace function public.subscriptions_sync_plan_content_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  biz record;
  lim record;
  needs_trim boolean := false;
  is_admin boolean := false;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  -- Siempre sincronizar caché del plan en negocios del owner
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = new.user_id and ur.role = 'admin'
  ) into is_admin;

  update public.businesses
  set owner_plan_id = case
    when is_admin then 'premium'
    else coalesce(new.plan_id, 'free')
  end
  where owner_id = new.user_id;

  -- Admins no fuerzan trim; upgrades / mismo plan limpian deadline
  if is_admin then
    new.content_trim_due_at := null;
    return new;
  end if;

  -- Solo actuar cuando baja el plan efectivo o cambia status relevante
  if old.plan_id is not distinct from new.plan_id
     and old.status is not distinct from new.status then
    return new;
  end if;

  select * into lim from public.plan_content_limits(new.plan_id);

  for biz in
    select id, coalesce(gallery, '{}'::text[]) as gallery, coalesce(services, '{}'::text[]) as services
    from public.businesses
    where owner_id = new.user_id
  loop
    if cardinality(biz.gallery) > lim.max_photos
       or cardinality(biz.services) > lim.max_services then
      needs_trim := true;
      exit;
    end if;
  end loop;

  if needs_trim
     and new.status in ('active', 'trialing', 'canceled', 'cancelled', 'unpaid', 'past_due') then
    -- Si ya había deadline futura, no la alargamos; si no, 7 días
    if new.content_trim_due_at is null or new.content_trim_due_at < now() then
      new.content_trim_due_at := now() + interval '7 days';
    end if;
  else
    new.content_trim_due_at := null;
  end if;

  return new;
end;
$$;

-- BEFORE UPDATE para poder mutar NEW.content_trim_due_at
drop trigger if exists subscriptions_sync_plan_content on public.subscriptions;
create trigger subscriptions_sync_plan_content
  before update of plan_id, status on public.subscriptions
  for each row
  execute function public.subscriptions_sync_plan_content_on_change();

-- Mantener owner_plan_id al crear negocio
create or replace function public.businesses_set_owner_plan_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid text;
begin
  if new.owner_id is null then
    new.owner_plan_id := coalesce(new.owner_plan_id, 'free');
    return new;
  end if;

  select s.plan_id into pid
  from public.subscriptions s
  where s.user_id = new.owner_id;

  if exists (
    select 1 from public.user_roles ur
    where ur.user_id = new.owner_id and ur.role = 'admin'
  ) then
    new.owner_plan_id := 'premium';
  else
    new.owner_plan_id := coalesce(pid, 'free');
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_set_owner_plan_id on public.businesses;
create trigger businesses_set_owner_plan_id
  before insert on public.businesses
  for each row
  execute function public.businesses_set_owner_plan_id();

-- ---------------------------------------------------------------------------
-- Helper: aplicar recorte a un negocio y devolver URLs descartadas
-- ---------------------------------------------------------------------------

create or replace function public._trim_business_content(
  p_business_id uuid,
  p_keep_gallery text[],
  p_keep_services text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  old_gallery text[];
  discarded text[] := '{}';
  url text;
begin
  select coalesce(gallery, '{}'::text[]) into old_gallery
  from public.businesses
  where id = p_business_id
  for update;

  if not found then
    raise exception 'Negocio no encontrado';
  end if;

  foreach url in array old_gallery
  loop
    if url is not null and url <> '' and not (url = any (coalesce(p_keep_gallery, '{}'::text[]))) then
      discarded := array_append(discarded, url);
    end if;
  end loop;

  update public.businesses
  set
    gallery = coalesce(p_keep_gallery, '{}'::text[]),
    services = coalesce(p_keep_services, '{}'::text[]),
    image_url = case
      when cardinality(coalesce(p_keep_gallery, '{}'::text[])) > 0
        then (coalesce(p_keep_gallery, '{}'::text[]))[1]
      else image_url
    end
  where id = p_business_id;

  return discarded;
end;
$$;

revoke all on function public._trim_business_content(uuid, text[], text[]) from public;

-- ---------------------------------------------------------------------------
-- RPC: dueño elige qué conservar
-- ---------------------------------------------------------------------------

create or replace function public.resolve_plan_content_trim(
  p_keep_gallery text[],
  p_keep_services text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  biz_id uuid;
  plan text;
  lim record;
  discarded text[];
  keep_g text[] := coalesce(p_keep_gallery, '{}'::text[]);
  keep_s text[] := coalesce(p_keep_services, '{}'::text[]);
  old_gallery text[];
  old_services text[];
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  select b.id, coalesce(s.plan_id, 'free'), coalesce(b.gallery, '{}'::text[]), coalesce(b.services, '{}'::text[])
  into biz_id, plan, old_gallery, old_services
  from public.businesses b
  left join public.subscriptions s on s.user_id = b.owner_id
  where b.owner_id = uid
  order by b.created_at desc
  limit 1;

  if biz_id is null then
    raise exception 'No tienes un negocio';
  end if;

  select * into lim from public.plan_content_limits(plan);

  if cardinality(keep_g) > lim.max_photos then
    raise exception 'Máximo % fotos para tu plan', lim.max_photos;
  end if;
  if cardinality(keep_s) > lim.max_services then
    raise exception 'Máximo % servicios para tu plan', lim.max_services;
  end if;

  keep_s := coalesce(
    (
      select array_agg(u order by ordinality)
      from unnest(keep_s) with ordinality as t(u, ordinality)
      where u = any (old_services)
    ),
    '{}'::text[]
  );

  -- Resolver URLs del cliente (posiblemente reescritas) a las URLs canónicas en BD.
  keep_g := coalesce(
    (
      select array_agg(matched order by ord)
      from (
        select distinct on (ord)
          og.u as matched,
          kg.ord
        from unnest(keep_g) with ordinality as kg(u, ord)
        join lateral (
          select o.u
          from unnest(old_gallery) as o(u)
          where o.u = kg.u
             or regexp_replace(o.u, '^https?://[^/]+/', '')
                = regexp_replace(kg.u, '^https?://[^/]+/', '')
          limit 1
        ) og on true
        order by ord, matched
      ) s
    ),
    '{}'::text[]
  );

  if cardinality(old_gallery) > 0 and cardinality(keep_g) = 0 then
    raise exception 'Ninguna de las fotos seleccionadas está en la galería actual';
  end if;

  discarded := public._trim_business_content(biz_id, keep_g, keep_s);

  update public.subscriptions
  set content_trim_due_at = null
  where user_id = uid;

  return jsonb_build_object(
    'business_id', biz_id,
    'discarded_urls', to_jsonb(discarded),
    'gallery', to_jsonb(keep_g),
    'services', to_jsonb(keep_s)
  );
end;
$$;

revoke all on function public.resolve_plan_content_trim(text[], text[]) from public;
grant execute on function public.resolve_plan_content_trim(text[], text[]) to authenticated;

comment on function public.resolve_plan_content_trim(text[], text[]) is
  'El owner elige fotos/servicios a conservar tras un downgrade; limpia content_trim_due_at y devuelve URLs a borrar en R2.';

-- ---------------------------------------------------------------------------
-- RPC service: auto-recorte de suscripciones vencidas
-- ---------------------------------------------------------------------------

create or replace function public.apply_overdue_plan_content_trims()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  biz record;
  lim record;
  keep_g text[];
  keep_s text[];
  discarded text[];
  all_discarded jsonb := '[]'::jsonb;
  trimmed_count int := 0;
begin
  for sub in
    select s.user_id, s.plan_id
    from public.subscriptions s
    where s.content_trim_due_at is not null
      and s.content_trim_due_at <= now()
  loop
    select * into lim from public.plan_content_limits(sub.plan_id);

    for biz in
      select id, coalesce(gallery, '{}'::text[]) as gallery, coalesce(services, '{}'::text[]) as services
      from public.businesses
      where owner_id = sub.user_id
    loop
      if cardinality(biz.gallery) <= lim.max_photos
         and cardinality(biz.services) <= lim.max_services then
        continue;
      end if;

      keep_g := biz.gallery[1:least(cardinality(biz.gallery), lim.max_photos)];
      keep_s := biz.services[1:least(cardinality(biz.services), lim.max_services)];
      discarded := public._trim_business_content(biz.id, keep_g, keep_s);
      trimmed_count := trimmed_count + 1;
      all_discarded := all_discarded || to_jsonb(discarded);
    end loop;

    update public.subscriptions
    set content_trim_due_at = null
    where user_id = sub.user_id;
  end loop;

  return jsonb_build_object(
    'trimmed_businesses', trimmed_count,
    'discarded_urls', all_discarded
  );
end;
$$;

revoke all on function public.apply_overdue_plan_content_trims() from public;
grant execute on function public.apply_overdue_plan_content_trims() to service_role;

comment on function public.apply_overdue_plan_content_trims() is
  'Auto-recorta gallery/services de suscripciones con content_trim_due_at vencido. Solo service_role.';

-- Si el owner ya dejó el contenido dentro del límite (p. ej. editando), limpiar la gracia.
create or replace function public.businesses_clear_content_trim_if_within_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim record;
  plan text;
begin
  if new.owner_id is null then
    return new;
  end if;

  select coalesce(s.plan_id, 'free') into plan
  from public.subscriptions s
  where s.user_id = new.owner_id;

  select * into lim from public.plan_content_limits(plan);

  if cardinality(coalesce(new.gallery, '{}'::text[])) <= lim.max_photos
     and cardinality(coalesce(new.services, '{}'::text[])) <= lim.max_services then
    update public.subscriptions
    set content_trim_due_at = null
    where user_id = new.owner_id
      and content_trim_due_at is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_clear_content_trim on public.businesses;
create trigger businesses_clear_content_trim
  after update of gallery, services on public.businesses
  for each row
  execute function public.businesses_clear_content_trim_if_within_limits();
