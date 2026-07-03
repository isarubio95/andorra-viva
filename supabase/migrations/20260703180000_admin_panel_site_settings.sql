-- Panel de administración: contenido del sitio, Stripe y RPCs admin

-- ---------------------------------------------------------------------------
-- Contenido editable del sitio (textos, etiquetas de categorías)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute procedure public.touch_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

insert into public.site_settings (key, value)
values
  (
    'texts',
    '{
      "footer_tagline": "La guía exclusiva de experiencias en el Principado.",
      "directory_cta": "Descubre todos los negocios de Andorra con filtros, búsqueda y reseñas de la comunidad.",
      "directory_cta_button": "Ir al directorio completo",
      "section_recommendations": "Nuestras recomendaciones",
      "section_top_rated": "Mejor valorados",
      "section_most_visited": "Más visitados del mes"
    }'::jsonb
  ),
  (
    'category_labels',
    '{
      "Gastronomía": "Dónde comer",
      "Alojamiento": "Dónde dormir",
      "Ocio y entretenimiento": "Ocio",
      "Turismo y experiencias": "Experiencias",
      "Compras": "Shopping",
      "Bienestar": "Wellness"
    }'::jsonb
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Stripe en suscripciones
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists idx_subscriptions_stripe_subscription
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Historial de pagos (sincronizado vía webhook Stripe)
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_event_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  event_type text not null,
  amount_cents integer,
  currency text default 'eur',
  status text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_events_user_id on public.payment_events (user_id);
create index if not exists idx_payment_events_created_at on public.payment_events (created_at desc);

alter table public.payment_events enable row level security;

drop policy if exists "Admins can read payment events" on public.payment_events;
create policy "Admins can read payment events"
on public.payment_events for select
using (public.is_admin());

drop policy if exists "Service role manages payment events" on public.payment_events;
create policy "Service role manages payment events"
on public.payment_events for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Políticas admin ampliadas
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can update all businesses" on public.businesses;
create policy "Admins can update all businesses"
on public.businesses for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete businesses" on public.businesses;
create policy "Admins can delete businesses"
on public.businesses for delete
using (public.is_admin());

drop policy if exists "Admins can manage plans" on public.plans;
create policy "Admins can manage plans"
on public.plans for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete reviews" on public.reviews;
create policy "Admins can delete reviews"
on public.reviews for delete
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPCs admin (security definer)
-- ---------------------------------------------------------------------------
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
    coalesce(s.plan_id, 'basico'),
    coalesce(s.status, 'active'),
    s.stripe_customer_id,
    s.stripe_subscription_id
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  left join public.subscriptions s on s.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_get_dashboard_stats()
returns jsonb
language plpgsql
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
        and plan_id not in ('basico', 'free')
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

create or replace function public.admin_update_user_role(
  target_user_id uuid,
  new_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if target_user_id = auth.uid() and new_role <> 'admin'::public.app_role then
    raise exception 'cannot demote yourself';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, new_role)
  on conflict (user_id) do update set role = excluded.role;
end;
$$;

revoke all on function public.admin_update_user_role(uuid, public.app_role) from public;
grant execute on function public.admin_update_user_role(uuid, public.app_role) to authenticated;

create or replace function public.admin_update_subscription(
  target_user_id uuid,
  new_plan_id text,
  new_status text default 'active'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if not exists (select 1 from public.plans where id = new_plan_id) then
    raise exception 'invalid plan';
  end if;

  if new_status not in ('active', 'trialing', 'past_due', 'canceled') then
    raise exception 'invalid status';
  end if;

  insert into public.subscriptions (user_id, plan_id, status)
  values (target_user_id, new_plan_id, new_status)
  on conflict (user_id) do update
  set plan_id = excluded.plan_id,
      status = excluded.status,
      updated_at = now();
end;
$$;

revoke all on function public.admin_update_subscription(uuid, text, text) from public;
grant execute on function public.admin_update_subscription(uuid, text, text) to authenticated;
