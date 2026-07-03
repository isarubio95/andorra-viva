-- RPC admin: eliminar reseña y recalcular rating del negocio

create or replace function public.admin_delete_review(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select business_id into v_business_id
  from public.reviews
  where id = p_review_id;

  if v_business_id is null then
    raise exception 'review not found';
  end if;

  delete from public.reviews where id = p_review_id;

  update public.businesses b
  set
    rating = coalesce(src.avg_rating, 0),
    review_count = coalesce(src.total_reviews, 0)
  from (
    select
      v_business_id as business_id,
      avg(r.rating)::numeric(3, 2) as avg_rating,
      count(r.id)::integer as total_reviews
    from public.reviews r
    where r.business_id = v_business_id
  ) src
  where b.id = v_business_id;
end;
$$;

revoke all on function public.admin_delete_review(uuid) from public;
grant execute on function public.admin_delete_review(uuid) to authenticated;
