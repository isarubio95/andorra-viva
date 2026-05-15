-- Permite pasar de cuenta profesional a personal (rol basic + plan basico).

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
  set plan_id = 'basico', updated_at = now()
  where s.user_id = uid;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    insert into public.subscriptions (user_id, plan_id, status)
    values (uid, 'basico', 'active');
  end if;

  -- Quitar destacados al perder acceso profesional de pago
  update public.businesses
  set is_recommended = false
  where owner_id = uid and is_recommended = true;
end;
$$;

comment on function public.downgrade_to_personal() is
  'Pasa el usuario autenticado a rol basic, plan basico y quita negocios recomendados.';

revoke all on function public.downgrade_to_personal() from public;
grant execute on function public.downgrade_to_personal() to authenticated;
