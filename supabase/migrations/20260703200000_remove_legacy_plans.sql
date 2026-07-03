-- Elimina planes legacy (enterprise) y referencias asociadas.

-- 1) Migrar suscripciones restantes
update public.subscriptions
set plan_id = 'premium', updated_at = now()
where plan_id = 'enterprise';

-- 2) Quitar filas del catálogo legacy
delete from public.plans where id = 'enterprise';

-- 3) Triggers: usar owner_has_premium_active en lugar del alias enterprise
create or replace function public.businesses_sync_is_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_premium :=
    coalesce(new.is_recommended, false)
    and public.owner_has_premium_active(new.owner_id);
  return new;
end;
$$;

create or replace function public.subscriptions_refresh_owner_business_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
begin
  if uid is null then
    return coalesce(new, old);
  end if;

  update public.businesses b
  set
    is_recommended = b.is_recommended and public.owner_has_premium_active(b.owner_id),
    is_premium = b.is_recommended and public.owner_has_premium_active(b.owner_id)
  where b.owner_id = uid;

  return coalesce(new, old);
end;
$$;

update public.businesses b
set
  is_recommended = b.is_recommended and public.owner_has_premium_active(b.owner_id),
  is_premium = b.is_recommended and public.owner_has_premium_active(b.owner_id)
where b.owner_id is not null;

drop function if exists public.owner_has_enterprise_active(uuid);

-- 4) Estadísticas admin: excluir plan gratuito
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
