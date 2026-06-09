-- Esquema base (tablas referenciadas por roles, suscripciones y migraciones posteriores)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('basic', 'professional', 'admin');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'business_category') then
    create type public.business_category as enum (
      'Restaurante',
      'Hotel',
      'Bar',
      'Discoteca',
      'Ocio Nocturno',
      'Actividades',
      'Museo',
      'Transporte',
      'Servicios',
      'Tienda',
      'SPA & Wellness',
      'Spa',
      'Gastronomía',
      'Alojamiento',
      'Ocio y entretenimiento',
      'Turismo y experiencias',
      'Compras',
      'Bienestar'
    );
  end if;
end
$$;

create table if not exists public.plans (
  id text primary key,
  name text not null,
  price numeric not null,
  currency text default '€',
  "interval" text default 'mes',
  features text[] default '{}',
  is_popular boolean default false
);

insert into public.plans (id, name, price, currency, "interval", features, is_popular)
values
  ('free', 'Free', 0, '€', 'mes', array['Perfil básico del negocio']::text[], false),
  ('pro', 'Pro', 29, '€', 'mes', array['Insignia premium', 'Estadísticas avanzadas']::text[], true),
  ('enterprise', 'Enterprise', 79, '€', 'mes', array['Todo lo de Pro', 'Soporte prioritario']::text[], false)
on conflict (id) do nothing;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null default 'basic'
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.business_category not null,
  location text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Ensure enum value exists for older app_role definitions
alter type public.app_role add value if not exists 'admin';

-- Ensure one role row per user
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'user_roles_user_id_key'
      and n.nspname = 'public'
      and t.relname = 'user_roles'
  ) then
    alter table public.user_roles
      add constraint user_roles_user_id_key unique (user_id);
  end if;
end
$$;

-- Subscriptions: links users to plans
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled')),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.touch_updated_at();

-- Auto-provision role + subscription on user creation
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
  -- Never block signup because of provisioning issues
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.user_roles enable row level security;
alter table public.subscriptions enable row level security;

-- Helper used by admin-only policies
create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role::text = 'admin'
  );
$$;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read all roles" on public.user_roles;
create policy "Admins can read all roles"
on public.user_roles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert roles" on public.user_roles;
create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);
