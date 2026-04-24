-- Distintivo "premium" público: solo negocios con propietario en plan enterprise (active/trialing) y marcados recomendados.
-- Mantiene is_recommended como intención del propietario; is_premium es el que ve el público.

create or replace function public.owner_has_enterprise_active(_owner_id uuid)
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
      and s.plan_id = 'enterprise'
      and s.status in ('active', 'trialing')
  );
$$;

comment on function public.owner_has_enterprise_active(uuid) is
  'True si el usuario tiene suscripción enterprise en active o trialing.';

alter table public.businesses
  add column if not exists is_premium boolean not null default false;

comment on column public.businesses.is_premium is
  'Visible al público: recomendado y propietario con enterprise activo/trial.';

create or replace function public.businesses_sync_is_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_premium :=
    coalesce(new.is_recommended, false)
    and public.owner_has_enterprise_active(new.owner_id);
  return new;
end;
$$;

drop trigger if exists trg_businesses_sync_is_premium on public.businesses;
create trigger trg_businesses_sync_is_premium
before insert or update of is_recommended, owner_id
on public.businesses
for each row
execute procedure public.businesses_sync_is_premium();

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
    is_recommended = b.is_recommended and public.owner_has_enterprise_active(b.owner_id),
    is_premium = b.is_recommended and public.owner_has_enterprise_active(b.owner_id)
  where b.owner_id = uid;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_subscriptions_refresh_business_premium on public.subscriptions;
create trigger trg_subscriptions_refresh_business_premium
after insert or update of plan_id, status
on public.subscriptions
for each row
execute procedure public.subscriptions_refresh_owner_business_premium();

-- Backfill
update public.businesses b
set
  is_recommended = b.is_recommended and public.owner_has_enterprise_active(b.owner_id),
  is_premium = b.is_recommended and public.owner_has_enterprise_active(b.owner_id)
where b.owner_id is not null;
