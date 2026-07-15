-- Track clicks on business profile actions (WhatsApp, phone, directions, website).
create table if not exists public.business_clicks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  click_type text not null,
  visitor_key text,
  clicked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint business_clicks_type_check check (
    click_type in ('whatsapp', 'phone', 'directions', 'website')
  )
);

create index if not exists business_clicks_business_clicked_at_idx
  on public.business_clicks (business_id, clicked_at);

create index if not exists business_clicks_business_type_idx
  on public.business_clicks (business_id, click_type);

alter table public.business_clicks enable row level security;

grant insert on public.business_clicks to anon, authenticated;

drop policy if exists "Anyone can insert business clicks" on public.business_clicks;
create policy "Anyone can insert business clicks"
on public.business_clicks
for insert
to anon, authenticated
with check (true);

drop policy if exists "Owners can read clicks of own businesses" on public.business_clicks;
create policy "Owners can read clicks of own businesses"
on public.business_clicks
for select
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_clicks.business_id
      and b.owner_id = auth.uid()
  )
);

create or replace function public.track_business_click(
  p_business_id uuid,
  p_click_type text,
  p_visitor_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if p_click_type is null or p_click_type not in ('whatsapp', 'phone', 'directions', 'website') then
    return;
  end if;

  if auth.uid() is not null then
    v_key := auth.uid()::text;
  else
    if p_visitor_key is null or char_length(p_visitor_key) < 8 then
      v_key := null;
    else
      v_key := p_visitor_key;
    end if;
  end if;

  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    return;
  end if;

  insert into public.business_clicks (business_id, click_type, visitor_key)
  values (p_business_id, p_click_type, v_key);
end;
$$;

comment on function public.track_business_click(uuid, text, text) is
  'Registra un clic en una acción del perfil del negocio. Con JWT usa auth.uid(); sin JWT, p_visitor_key opcional.';

revoke all on function public.track_business_click(uuid, text, text) from public;
grant execute on function public.track_business_click(uuid, text, text) to anon, authenticated;

-- También fusiona clics anónimos al iniciar sesión.
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

  update public.business_clicks
  set visitor_key = uid::text
  where visitor_key = p_visitor_key;
end;
$$;

drop function if exists public.get_my_business_metrics(integer);

create or replace function public.get_my_business_metrics(_days integer default 30)
returns table (
  business_id uuid,
  business_name text,
  visits_month bigint,
  visits_total bigint,
  reviews_total bigint,
  reviews_month bigint,
  rating_avg numeric,
  rating_distribution jsonb,
  daily_visits jsonb,
  daily_reviews jsonb,
  clicks_month bigint,
  clicks_total bigint,
  clicks_by_type jsonb,
  daily_clicks jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with my_businesses as (
    select b.id, b.name, b.review_count, b.rating
    from public.businesses b
    where b.owner_id = auth.uid()
  ),
  monthly_visits as (
    select bv.business_id, count(*)::bigint as visits_month
    from public.business_visits bv
    where bv.visit_month = date_trunc('month', timezone('utc', now()))::date
    group by bv.business_id
  ),
  total_visits as (
    select bv.business_id, count(*)::bigint as visits_total
    from public.business_visits bv
    group by bv.business_id
  ),
  monthly_reviews as (
    select r.business_id, count(*)::bigint as reviews_month
    from public.reviews r
    where r.created_at >= date_trunc('month', timezone('utc', now()))
    group by r.business_id
  ),
  monthly_clicks as (
    select bc.business_id, count(*)::bigint as clicks_month
    from public.business_clicks bc
    where bc.clicked_at >= date_trunc('month', timezone('utc', now()))
    group by bc.business_id
  ),
  total_clicks as (
    select bc.business_id, count(*)::bigint as clicks_total
    from public.business_clicks bc
    group by bc.business_id
  ),
  period_days as (
    select generate_series(
      timezone('utc', now())::date - greatest(coalesce(_days, 30), 1) + 1,
      timezone('utc', now())::date,
      interval '1 day'
    )::date as day
  )
  select
    mb.id as business_id,
    mb.name as business_name,
    coalesce(mv.visits_month, 0) as visits_month,
    coalesce(tv.visits_total, 0) as visits_total,
    coalesce(mb.review_count, 0)::bigint as reviews_total,
    coalesce(mr.reviews_month, 0) as reviews_month,
    coalesce(mb.rating, 0)::numeric as rating_avg,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('stars', s.stars, 'count', coalesce(rd.cnt, 0))
          order by s.stars desc
        )
        from generate_series(1, 5) as s(stars)
        left join (
          select r.rating, count(*)::bigint as cnt
          from public.reviews r
          where r.business_id = mb.id
          group by r.rating
        ) rd on rd.rating = s.stars
      ),
      '[]'::jsonb
    ) as rating_distribution,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', d.day::text,
            'visits', coalesce(v.count_per_day, 0)
          )
          order by d.day
        )
        from period_days d
        left join (
          select
            date_trunc('day', bv.visited_at)::date as day,
            count(*)::bigint as count_per_day
          from public.business_visits bv
          where bv.business_id = mb.id
            and bv.visited_at >= timezone('utc', now()) - make_interval(days => greatest(coalesce(_days, 30), 1))
          group by 1
        ) v on v.day = d.day
      ),
      '[]'::jsonb
    ) as daily_visits,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', d.day::text,
            'reviews', coalesce(r.count_per_day, 0)
          )
          order by d.day
        )
        from period_days d
        left join (
          select
            date_trunc('day', r.created_at)::date as day,
            count(*)::bigint as count_per_day
          from public.reviews r
          where r.business_id = mb.id
            and r.created_at >= timezone('utc', now()) - make_interval(days => greatest(coalesce(_days, 30), 1))
          group by 1
        ) r on r.day = d.day
      ),
      '[]'::jsonb
    ) as daily_reviews,
    coalesce(mc.clicks_month, 0) as clicks_month,
    coalesce(tc.clicks_total, 0) as clicks_total,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'click_type', ct.click_type,
            'count', coalesce(c.cnt, 0),
            'count_month', coalesce(cm.cnt, 0)
          )
          order by coalesce(c.cnt, 0) desc, ct.click_type
        )
        from (
          values ('whatsapp'), ('phone'), ('directions'), ('website')
        ) as ct(click_type)
        left join (
          select bc.click_type, count(*)::bigint as cnt
          from public.business_clicks bc
          where bc.business_id = mb.id
          group by bc.click_type
        ) c on c.click_type = ct.click_type
        left join (
          select bc.click_type, count(*)::bigint as cnt
          from public.business_clicks bc
          where bc.business_id = mb.id
            and bc.clicked_at >= date_trunc('month', timezone('utc', now()))
          group by bc.click_type
        ) cm on cm.click_type = ct.click_type
      ),
      '[]'::jsonb
    ) as clicks_by_type,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', d.day::text,
            'clicks', coalesce(c.count_per_day, 0)
          )
          order by d.day
        )
        from period_days d
        left join (
          select
            date_trunc('day', bc.clicked_at)::date as day,
            count(*)::bigint as count_per_day
          from public.business_clicks bc
          where bc.business_id = mb.id
            and bc.clicked_at >= timezone('utc', now()) - make_interval(days => greatest(coalesce(_days, 30), 1))
          group by 1
        ) c on c.day = d.day
      ),
      '[]'::jsonb
    ) as daily_clicks
  from my_businesses mb
  left join monthly_visits mv on mv.business_id = mb.id
  left join total_visits tv on tv.business_id = mb.id
  left join monthly_reviews mr on mr.business_id = mb.id
  left join monthly_clicks mc on mc.business_id = mb.id
  left join total_clicks tc on tc.business_id = mb.id
  order by coalesce(mv.visits_month, 0) desc, coalesce(tv.visits_total, 0) desc, mb.name;
$$;

revoke all on function public.get_my_business_metrics(integer) from public;
grant execute on function public.get_my_business_metrics(integer) to authenticated;
