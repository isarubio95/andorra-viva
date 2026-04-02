-- Reseñas: una por usuario y negocio, con edición (upsert) y recálculo de rating/review_count.
create unique index if not exists reviews_one_per_user_business_idx
  on public.reviews (business_id, user_id);

alter table public.reviews enable row level security;

grant select on public.reviews to anon, authenticated;

drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Users read own reviews" on public.reviews;
create policy "Users read own reviews"
on public.reviews
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.submit_business_review(
  p_business_id uuid,
  p_rating integer,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user_name text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Invalid rating';
  end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    raise exception 'Business not found';
  end if;

  v_user_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    'Usuario'
  );

  insert into public.reviews (business_id, user_id, user_name, rating, comment)
  values (p_business_id, v_uid, v_user_name, p_rating, nullif(trim(p_comment), ''))
  on conflict (business_id, user_id)
  do update set
    user_name = excluded.user_name,
    rating = excluded.rating,
    comment = excluded.comment,
    created_at = timezone('utc', now());

  update public.businesses b
  set
    rating = coalesce(src.avg_rating, 0),
    review_count = coalesce(src.total_reviews, 0)
  from (
    select
      business_id,
      avg(rating)::numeric(3,2) as avg_rating,
      count(*)::integer as total_reviews
    from public.reviews
    where business_id = p_business_id
    group by business_id
  ) src
  where b.id = src.business_id;
end;
$$;

comment on function public.submit_business_review(uuid, integer, text) is
  'Crea o edita la reseña del usuario autenticado para un negocio y recalcula rating/review_count.';

revoke all on function public.submit_business_review(uuid, integer, text) from public;
grant execute on function public.submit_business_review(uuid, integer, text) to authenticated;
