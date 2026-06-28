-- Cada suscripción (plan de negocio) puede tener como máximo un negocio registrado.

-- Conservar el negocio más antiguo por propietario y eliminar duplicados.
delete from public.businesses b
where b.id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by owner_id
        order by created_at asc nulls last, id asc
      ) as rn
    from public.businesses
    where owner_id is not null
  ) ranked
  where rn > 1
);

create unique index if not exists businesses_one_per_owner_idx
  on public.businesses (owner_id)
  where owner_id is not null;

create or replace function public.owner_can_create_business(_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    _owner_id is not null
    and _owner_id = auth.uid()
    and not exists (
      select 1
      from public.businesses b
      where b.owner_id = _owner_id
    );
$$;

comment on function public.owner_can_create_business(uuid) is
  'True si el usuario autenticado aún no tiene un negocio registrado.';

drop policy if exists "Users insert own businesses" on public.businesses;
create policy "Users insert own businesses"
on public.businesses
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and coalesce(is_recommended, false) = false
  and public.owner_can_create_business(owner_id)
);
