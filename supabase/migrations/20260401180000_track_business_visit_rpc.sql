-- Insertar visitas desde el cliente sin depender de RLS directo (evita 42501 con upsert/RETURNING).
-- Lógica de visitante: ver migración 20260402120000_track_business_visit_auth_uid.sql (auth.uid() si hay sesión).
create or replace function public.track_business_visit(
  p_business_id uuid,
  p_visitor_key text,
  p_visit_month date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if auth.uid() is not null then
    v_key := auth.uid()::text;
  else
    if p_visitor_key is null or char_length(p_visitor_key) < 8 then
      return;
    end if;
    v_key := p_visitor_key;
  end if;

  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    return;
  end if;

  insert into public.business_visits (business_id, visitor_key, visit_month)
  values (p_business_id, v_key, p_visit_month)
  on conflict (business_id, visitor_key, visit_month) do nothing;
end;
$$;

comment on function public.track_business_visit(uuid, text, date) is
  'Una visita/mes por (negocio, visitante). Con JWT usa auth.uid(); sin JWT, p_visitor_key (p. ej. localStorage).';

revoke all on function public.track_business_visit(uuid, text, date) from public;
grant execute on function public.track_business_visit(uuid, text, date) to anon, authenticated;
