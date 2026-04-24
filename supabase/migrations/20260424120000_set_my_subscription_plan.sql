-- RPC para cambiar de plan desde el panel: evita éxito silencioso cuando el UPDATE no afecta filas (p. ej. RLS).
-- Valida que el plan exista (FK) y que el usuario tenga fila en subscriptions.

create or replace function public.set_my_subscription_plan(p_plan_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
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

  update public.subscriptions s
  set plan_id = p_plan_id
  where s.user_id = uid;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'no subscription row for user';
  end if;
end;
$$;

comment on function public.set_my_subscription_plan(text) is
  'Actualiza subscriptions.plan_id del usuario autenticado; falla si no hay fila o plan inexistente.';

revoke all on function public.set_my_subscription_plan(text) from public;
grant execute on function public.set_my_subscription_plan(text) to authenticated;

-- Asegura filas en plans para que plan_id y la UI coincidan (ids free / pro / enterprise).
insert into public.plans (id, name, price, currency, "interval", features, is_popular)
values
  ('free', 'Free', 0, '€', 'mes', array['Perfil básico del negocio']::text[], false),
  ('pro', 'Pro', 29, '€', 'mes', array['Insignia premium', 'Estadísticas avanzadas']::text[], true),
  ('enterprise', 'Enterprise', 79, '€', 'mes', array['Todo lo de Pro', 'Soporte prioritario']::text[], false)
on conflict (id) do nothing;
