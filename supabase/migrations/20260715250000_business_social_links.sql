-- Enlaces a redes sociales (Instagram, Facebook, X) para negocios con plan Pro o Premium.

alter table public.businesses
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists x_url text;

comment on column public.businesses.instagram_url is 'Perfil de Instagram del negocio (plan Pro/Premium).';
comment on column public.businesses.facebook_url is 'Página de Facebook del negocio (plan Pro/Premium).';
comment on column public.businesses.x_url is 'Perfil de X del negocio (plan Pro/Premium).';

create or replace function public.owner_has_social_links_access(_owner_id uuid)
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
      and s.plan_id in ('pro', 'premium')
      and s.status in ('active', 'trialing')
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _owner_id
      and ur.role = 'admin'
  );
$$;

comment on function public.owner_has_social_links_access(uuid) is
  'Plan Pro/Premium activo o rol admin; requisito para mostrar/editar redes sociales del negocio.';

create or replace function public.subscriptions_clear_social_links_on_downgrade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  had_access boolean;
  has_access boolean;
begin
  if tg_op = 'UPDATE' then
    had_access :=
      (old.plan_id in ('pro', 'premium') and old.status in ('active', 'trialing'))
      or exists (
        select 1
        from public.user_roles ur
        where ur.user_id = old.user_id
          and ur.role = 'admin'
      );
    has_access := public.owner_has_social_links_access(new.user_id);
  else
    return new;
  end if;

  if had_access and not has_access then
    update public.businesses
    set
      instagram_url = null,
      facebook_url = null,
      x_url = null
    where owner_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_clear_social_links on public.subscriptions;
create trigger subscriptions_clear_social_links
  after update of plan_id, status on public.subscriptions
  for each row
  execute function public.subscriptions_clear_social_links_on_downgrade();

-- Mover «Redes sociales» del plan Basic al plan Pro.
update public.plans
set features = array_remove(features, 'Redes sociales')
where id = 'basic';

update public.plans
set features = (
  case
    when 'Redes sociales' = any(features) then features
    else array_append(features, 'Redes sociales')
  end
)
where id = 'pro';
