-- Alinea límites reales (fotos/servicios/campos) con las características de cada plan.
-- Free: 1 foto, 2 servicios, ficha básica. Basic: 3 fotos. Pro: 6. Premium: 10.

create or replace function public.plan_content_limits(p_plan_id text)
returns table (max_photos int, max_services int)
language sql
immutable
as $$
  select
    case coalesce(p_plan_id, 'free')
      when 'premium' then 10
      when 'pro' then 6
      when 'basic' then 3
      else 1
    end as max_photos,
    case coalesce(p_plan_id, 'free')
      when 'premium' then 12
      when 'pro' then 7
      when 'basic' then 5
      else 2
    end as max_services;
$$;

comment on function public.plan_content_limits(text) is
  'Máximo de fotos y servicios por plan_id (free/basic/pro/premium).';

-- Características publicadas (signup / comparativa).
update public.plans set
  features = array[
    'Perfil de tu negocio en el directorio',
    'Hasta 2 servicios',
    'Hasta 1 foto'
  ]::text[]
where id = 'free';

update public.plans set
  features = array[
    'WhatsApp directo',
    'Descripción ampliada',
    'Horario de apertura',
    'Recepción de reseñas',
    'Apareces en los listados',
    'Hasta 3 fotos'
  ]::text[]
where id = 'basic';

update public.plans set
  features = array[
    'Estadísticas avanzadas',
    'Visibilidad mejorada en el directorio',
    'Redes sociales',
    'Hasta 6 fotos'
  ]::text[]
where id = 'pro';

update public.plans set
  features = array[
    'Insignia Premium visible para todos los usuarios',
    'Puedes marcar un negocio como recomendado',
    '1 noticia al mes en la sección de noticias',
    'Segunda ubicación',
    'Soporte prioritario',
    'Hasta 10 fotos'
  ]::text[]
where id = 'premium';

-- Impide guardar en alta/edición campos y cupos que el plan no incluye.
create or replace function public.businesses_enforce_plan_profile_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan text;
  lim record;
  is_admin boolean := false;
  desc_limit int;
begin
  if new.owner_id is not null then
    select exists (
      select 1 from public.user_roles ur
      where ur.user_id = new.owner_id and ur.role = 'admin'
    ) into is_admin;

    select s.plan_id into plan
    from public.subscriptions s
    where s.user_id = new.owner_id;
  end if;

  if is_admin then
    plan := 'premium';
  else
    plan := coalesce(plan, 'free');
  end if;

  select * into lim from public.plan_content_limits(plan);
  desc_limit := case when plan = 'free' then 160 else 500 end;

  if new.description is not null and char_length(new.description) > desc_limit then
    new.description := left(new.description, desc_limit);
  end if;

  if plan not in ('basic', 'pro', 'premium') then
    new.phone := null;
    new.website := null;
    new.min_age := null;
    new.opening_hours := null;
  end if;

  if plan not in ('pro', 'premium') then
    new.instagram_url := null;
    new.facebook_url := null;
    new.x_url := null;
  end if;

  -- Galería/servicios: recortar en el alta. El recorte en updates lo gestiona el periodo de gracia.
  if tg_op = 'INSERT' then
    if new.gallery is not null and cardinality(new.gallery) > lim.max_photos then
      new.gallery := new.gallery[1:lim.max_photos];
    end if;
    if new.services is not null and cardinality(new.services) > lim.max_services then
      new.services := new.services[1:lim.max_services];
    end if;
  end if;

  if new.gallery is not null and cardinality(new.gallery) > 0 then
    new.image_url := coalesce(nullif(new.gallery[1], ''), new.image_url);
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_enforce_plan_profile_limits on public.businesses;
create trigger businesses_enforce_plan_profile_limits
  before insert or update on public.businesses
  for each row
  execute function public.businesses_enforce_plan_profile_limits();

-- Negocios Free ya por encima del nuevo cupo: 7 días para elegir qué conservar.
update public.subscriptions s
set content_trim_due_at = now() + interval '7 days', updated_at = now()
where coalesce(s.plan_id, 'free') = 'free'
  and s.content_trim_due_at is null
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = s.user_id and ur.role = 'admin'
  )
  and exists (
    select 1
    from public.businesses b
    cross join lateral public.plan_content_limits('free') lim
    where b.owner_id = s.user_id
      and (
        cardinality(coalesce(b.gallery, '{}'::text[])) > lim.max_photos
        or cardinality(coalesce(b.services, '{}'::text[])) > lim.max_services
      )
  );
