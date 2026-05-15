-- Permite a usuarios básicos autenticados pasar a cuenta profesional sin repetir el alta.

create or replace function public.upgrade_to_professional(p_plan_id text)
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

  if p_plan_id is null or length(trim(p_plan_id)) = 0 then
    raise exception 'invalid plan';
  end if;

  if not exists (select 1 from public.plans p where p.id = p_plan_id) then
    raise exception 'unknown plan: %', p_plan_id;
  end if;

  select ur.role into v_user_role
  from public.user_roles ur
  where ur.user_id = uid;

  if v_user_role is null then
    insert into public.user_roles (user_id, role)
    values (uid, 'professional'::public.app_role);
  elsif v_user_role = 'admin'::public.app_role then
    raise exception 'admins cannot use upgrade_to_professional';
  elsif v_user_role = 'professional'::public.app_role then
    -- Ya es profesional: solo actualizar plan si procede
    null;
  else
    update public.user_roles
    set role = 'professional'::public.app_role
    where user_id = uid;
  end if;

  update public.subscriptions s
  set plan_id = p_plan_id, updated_at = now()
  where s.user_id = uid;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    insert into public.subscriptions (user_id, plan_id, status)
    values (uid, p_plan_id, 'active');
  end if;
end;
$$;

comment on function public.upgrade_to_professional(text) is
  'Pasa el usuario autenticado a rol professional y asigna el plan indicado.';

revoke all on function public.upgrade_to_professional(text) from public;
grant execute on function public.upgrade_to_professional(text) to authenticated;
