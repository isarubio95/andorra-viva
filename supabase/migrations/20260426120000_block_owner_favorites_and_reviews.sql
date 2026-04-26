-- El titular de un negocio no puede añadirlo a favoritos ni enviar reseñas sobre él.

with removed as (
  delete from public.reviews r
  using public.businesses b
  where r.business_id = b.id
    and b.owner_id is not null
    and r.user_id = b.owner_id
  returning r.business_id
),
distinct_businesses as (select distinct business_id from removed)
update public.businesses bu
set
  rating = coalesce(s.avg_rating, 0),
  review_count = coalesce(s.total_reviews, 0)
from (
  select
    db.business_id,
    avg(r.rating)::numeric(3,2) as avg_rating,
    count(r.id)::integer as total_reviews
  from distinct_businesses db
  left join public.reviews r on r.business_id = db.business_id
  group by db.business_id
) s
where bu.id = s.business_id;

delete from public.favorites f
using public.businesses b
where f.business_id = b.id
  and b.owner_id is not null
  and f.user_id = b.owner_id;

drop policy if exists "Users insert own favorites" on public.favorites;
create policy "Users insert own favorites"
on public.favorites
for insert
to authenticated
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id is not null
      and b.owner_id = auth.uid()
  )
);

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
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Invalid rating';
  end if;

  select b.owner_id into v_owner
  from public.businesses b
  where b.id = p_business_id;

  if not found then
    raise exception 'Business not found';
  end if;

  if v_owner is not null and v_owner = v_uid then
    raise exception 'Cannot review own business';
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
