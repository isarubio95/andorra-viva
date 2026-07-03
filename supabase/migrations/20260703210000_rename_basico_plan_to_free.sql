-- Renombra el plan gratuito: basico -> free

insert into public.plans (id, name, price, currency, "interval", features, is_popular)
select
  'free',
  'Free',
  price,
  currency,
  "interval",
  features,
  is_popular
from public.plans
where id = 'basico'
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  currency = excluded.currency,
  "interval" = excluded."interval",
  features = excluded.features,
  is_popular = excluded.is_popular;

update public.subscriptions
set plan_id = 'free', updated_at = now()
where plan_id = 'basico';

delete from public.plans where id = 'basico';

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
  requested_plan := coalesce(new.raw_user_meta_data->>'plan', 'free');

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role)
  on conflict (user_id) do update set role = excluded.role;

  insert into public.subscriptions (user_id, plan_id, status)
  values (
    new.id,
    case
      when requested_role = 'professional'::public.app_role then requested_plan
      else 'free'
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
    'plan_id', coalesce(p, 'free'),
    'subscription_status', st,
    'has_pro_access', hp
  );
end;
$$;

create or replace function public.downgrade_to_personal()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_user_role public.app_role;
  v_updated int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select ur.role into v_user_role
  from public.user_roles ur
  where ur.user_id = uid;

  if v_user_role is null then
    insert into public.user_roles (user_id, role)
    values (uid, 'basic'::public.app_role);
  elsif v_user_role = 'admin'::public.app_role then
    raise exception 'admins cannot use downgrade_to_personal';
  elsif v_user_role = 'basic'::public.app_role then
    null;
  else
    update public.user_roles
    set role = 'basic'::public.app_role
    where user_id = uid;
  end if;

  update public.subscriptions s
  set plan_id = 'free', updated_at = now()
  where s.user_id = uid;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    insert into public.subscriptions (user_id, plan_id, status)
    values (uid, 'free', 'active');
  end if;

  update public.businesses
  set is_recommended = false
  where owner_id = uid and is_recommended = true;
end;
$$;

comment on function public.downgrade_to_personal() is
  'Pasa el usuario autenticado a rol basic, plan free y quita negocios recomendados.';

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  role public.app_role,
  plan_id text,
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', '')::text,
    u.created_at,
    coalesce(ur.role, 'basic'::public.app_role),
    coalesce(s.plan_id, 'free'),
    coalesce(s.status, 'active'),
    s.stripe_customer_id,
    s.stripe_subscription_id
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  left join public.subscriptions s on s.user_id = u.id
  order by u.created_at desc;
end;
$$;

create or replace function public.admin_get_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'businesses_total', (select count(*) from public.businesses),
    'reviews_total', (select count(*) from public.reviews),
    'active_subscriptions', (
      select count(*)
      from public.subscriptions
      where status in ('active', 'trialing')
        and plan_id <> 'free'
    ),
    'revenue_events_month', (
      select coalesce(sum(amount_cents), 0)
      from public.payment_events
      where created_at >= date_trunc('month', now())
        and event_type in ('invoice.paid', 'checkout.session.completed')
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_get_dashboard_stats() from public;
grant execute on function public.admin_get_dashboard_stats() to authenticated;
