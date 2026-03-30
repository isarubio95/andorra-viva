-- Single RPC for client: same rules everywhere (UI + future RLS helpers).
-- Security definer reads by auth.uid() only; does not expose other users.

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
  paid := p is not null and p <> 'free' and st in ('active', 'trialing');
  hp := role_text in ('professional', 'admin') or coalesce(paid, false);

  return jsonb_build_object(
    'role', role_text,
    'plan_id', coalesce(p, 'free'),
    'subscription_status', st,
    'has_pro_access', hp
  );
end;
$$;

revoke all on function public.get_my_access() from public;
grant execute on function public.get_my_access() to authenticated;

comment on function public.get_my_access() is
  'Returns current user role, subscription and has_pro_access (paid plan active/trialing or role professional/admin).';

-- Admins can manage subscriptions (manual fixes, support).
drop policy if exists "Admins can read all subscriptions" on public.subscriptions;
create policy "Admins can read all subscriptions"
on public.subscriptions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert subscriptions" on public.subscriptions;
create policy "Admins can insert subscriptions"
on public.subscriptions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update subscriptions" on public.subscriptions;
create policy "Admins can update subscriptions"
on public.subscriptions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete subscriptions" on public.subscriptions;
create policy "Admins can delete subscriptions"
on public.subscriptions
for delete
to authenticated
using (public.is_admin());
