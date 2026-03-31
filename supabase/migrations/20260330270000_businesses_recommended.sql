-- Rename premium marker to recommended
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'is_premium'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'is_recommended'
  ) then
    alter table public.businesses rename column is_premium to is_recommended;
  end if;
end
$$;

alter table public.businesses
  add column if not exists is_recommended boolean not null default false;

-- At most one recommended business per owner
create unique index if not exists businesses_one_recommended_per_owner_idx
  on public.businesses (owner_id)
  where is_recommended = true and owner_id is not null;

-- Enterprise-only rule for setting a recommended business
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
      and s.plan_id = 'enterprise'
      and s.status in ('active', 'trialing')
  );
end;
$$;

drop policy if exists "Users insert own businesses" on public.businesses;
create policy "Users insert own businesses"
on public.businesses
for insert
to authenticated
with check (owner_id = auth.uid() and coalesce(is_recommended, false) = false);

drop policy if exists "Users update own businesses" on public.businesses;
create policy "Users update own businesses"
on public.businesses
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid() and public.can_set_recommended(owner_id, is_recommended));
