-- Plan Basic (9,99€/mes) entre Básico gratuito y Pro.

insert into public.plans (id, name, price, currency, "interval", features, is_popular)
values (
  'basic',
  'Basic',
  9,
  '€',
  'mes',
  array[
    'WhatsApp directo',
    'Redes sociales',
    'Descripción ampliada',
    'Recepción de reseñas',
    'Apareces en los listados',
    'Hasta 3 fotos'
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
  paid := p is not null and p in ('basic', 'pro', 'premium') and st in ('active', 'trialing');
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
  'Rol, plan (basico/basic/pro/premium), estado y has_pro_access (basic/pro/premium activo o rol professional/admin).';
