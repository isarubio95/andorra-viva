-- Tras iniciar sesión: reasigna filas de business_visits del visitor_key anónimo al auth.uid().
create or replace function public.merge_anonymous_business_visits(p_visitor_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;
  if p_visitor_key is null or char_length(p_visitor_key) < 8 then
    return;
  end if;
  if p_visitor_key = uid::text then
    return;
  end if;

  delete from public.business_visits bv
  using public.business_visits existing
  where bv.visitor_key = p_visitor_key
    and existing.visitor_key = uid::text
    and existing.business_id = bv.business_id
    and existing.visit_month = bv.visit_month;

  update public.business_visits
  set visitor_key = uid::text
  where visitor_key = p_visitor_key;
end;
$$;

comment on function public.merge_anonymous_business_visits(text) is
  'Pasa visitas registradas con p_visitor_key (localStorage) al usuario autenticado actual. Solo authenticated.';

revoke all on function public.merge_anonymous_business_visits(text) from public;
grant execute on function public.merge_anonymous_business_visits(text) to authenticated;
