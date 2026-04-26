-- Planes: básico, pro, premium. La insignia Premium visible al público solo con plan premium (active/trialing).

-- 1) Primero el catálogo: hace falta que existan `basico` y `premium` en `plans` antes de tocar `subscriptions` (FK).
insert into public.plans (id, name, price, currency, "interval", features, is_popular)
values
  (
    'basico',
    'Básico',
    0,
    '€',
    'mes',
    array['Perfil de tu negocio en el directorio']::text[],
    false
  ),
  (
    'premium',
    'Premium',
    79,
    '€',
    'mes',
    array[
      'Insignia Premium visible para todos los usuarios',
      'Puedes marcar un negocio como recomendado',
      'Todo lo incluido en Pro',
      'Soporte prioritario'
    ]::text[],
    false
  )
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  currency = excluded.currency,
  "interval" = excluded."interval",
  features = excluded.features,
  is_popular = excluded.is_popular;

update public.plans set
  name = 'Pro',
  price = 29,
  currency = '€',
  "interval" = 'mes',
  features = array[
    'Estadísticas avanzadas',
    'Visibilidad mejorada en el directorio'
  ]::text[],
  is_popular = true
where id = 'pro';

-- 2) Suscripciones: ids antiguos -> nuevos (tras existir las filas en `plans`)
update public.subscriptions set plan_id = 'basico' where plan_id = 'free';
update public.subscriptions set plan_id = 'premium' where plan_id = 'enterprise';

delete from public.plans where id in ('free', 'enterprise');

-- 3) Alta de usuario: plan por defecto básico
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
  requested_plan text;
begin
  requested_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'basic'::public.app_role);
  requested_plan := coalesce(new.raw_user_meta_data->>'plan', 'basico');

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role)
  on conflict (user_id) do update set role = excluded.role;

  insert into public.subscriptions (user_id, plan_id, status)
  values (
    new.id,
    case
      when requested_role = 'professional'::public.app_role then requested_plan
      else 'basico'
    end,
    'active'
  )
  on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status, updated_at = now();

  return new;
exception
  when others then
    return new;
end;
$$;

-- 4) Insignia premium pública: propietario con plan premium activo/trial
create or replace function public.owner_has_premium_active(_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = _owner_id
      and s.plan_id = 'premium'
      and s.status in ('active', 'trialing')
  );
$$;

comment on function public.owner_has_premium_active(uuid) is
  'True si el usuario tiene suscripción premium en active o trialing.';

-- Compatibilidad: misma firma que antes (triggers ya desplegados pueden seguir el nombre antiguo)
create or replace function public.owner_has_enterprise_active(_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.owner_has_premium_active(_owner_id);
$$;

comment on function public.owner_has_enterprise_active(uuid) is
  'Alias de owner_has_premium_active (plan premium); mantenido por compatibilidad.';

comment on column public.businesses.is_premium is
  'Visible al público: recomendado y propietario con plan premium activo/trial.';

-- 5) Solo plan premium puede marcar recomendado
create or replace function public.can_set_recommended(_owner_id uuid, _is_recommended boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(_is_recommended, false) = false then
    return true;
  end if;

  if auth.uid() is null then
    return false;
  end if;

  if _owner_id <> auth.uid() then
    return false;
  end if;

  return exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and s.plan_id = 'premium'
      and s.status in ('active', 'trialing')
  );
end;
$$;

-- 6) get_my_access: "gratis" = basico; acceso de pago = pro o premium
create or replace function public.get_my_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r app_role;
  p text;
  st text;
  paid boolean;
  hp boolean;
  role_text text;
begin
  if uid is null then
    return null;
  end if;

  select ur.role into r from public.user_roles ur where ur.user_id = uid;
  select sb.plan_id, sb.status into p, st from public.subscriptions sb where sb.user_id = uid;

  role_text := coalesce(r::text, 'basic');
  paid := p is not null and p in ('pro', 'premium') and st in ('active', 'trialing');
  hp := role_text in ('professional', 'admin') or coalesce(paid, false);

  return jsonb_build_object(
    'role', role_text,
    'plan_id', coalesce(p, 'basico'),
    'subscription_status', st,
    'has_pro_access', hp
  );
end;
$$;

revoke all on function public.get_my_access() from public;
grant execute on function public.get_my_access() to authenticated;

comment on function public.get_my_access() is
  'Rol, plan (basico/pro/premium), estado y has_pro_access (pro/premium activo o rol professional/admin).';
