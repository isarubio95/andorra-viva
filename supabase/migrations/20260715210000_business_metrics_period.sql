-- Ampliar métricas con agregados por periodo seleccionable (_days).
drop function if exists public.get_my_business_metrics(integer);

create or replace function public.get_my_business_metrics(_days integer default 30)
returns table (
  business_id uuid,
  business_name text,
  visits_period bigint,
  visits_total bigint,
  reviews_total bigint,
  reviews_period bigint,
  rating_avg numeric,
  rating_avg_period numeric,
  rating_distribution jsonb,
  daily_visits jsonb,
  daily_reviews jsonb,
  clicks_period bigint,
  clicks_total bigint,
  clicks_by_type jsonb,
  daily_clicks jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select greatest(1, least(coalesce(_days, 30), 365)) as days
  ),
  my_businesses as (
    select b.id, b.name, b.review_count, b.rating
    from public.businesses b
    where b.owner_id = auth.uid()
  ),
  total_visits as (
    select bv.business_id, count(*)::bigint as visits_total
    from public.business_visits bv
    group by bv.business_id
  ),
  period_visits as (
    select bv.business_id, count(*)::bigint as visits_period
    from public.business_visits bv, bounds
    where bv.visited_at >= timezone('utc', now()) - make_interval(days => bounds.days)
    group by bv.business_id
  ),
  period_reviews as (
    select
      r.business_id,
      count(*)::bigint as reviews_period,
      coalesce(avg(r.rating)::numeric, 0) as rating_avg_period
    from public.reviews r, bounds
    where r.created_at >= timezone('utc', now()) - make_interval(days => bounds.days)
    group by r.business_id
  ),
  total_clicks as (
    select bc.business_id, count(*)::bigint as clicks_total
    from public.business_clicks bc
    group by bc.business_id
  ),
  period_clicks as (
    select bc.business_id, count(*)::bigint as clicks_period
    from public.business_clicks bc, bounds
    where bc.clicked_at >= timezone('utc', now()) - make_interval(days => bounds.days)
    group by bc.business_id
  ),
  period_days as (
    select generate_series(
      timezone('utc', now())::date - (select days from bounds) + 1,
      timezone('utc', now())::date,
      interval '1 day'
    )::date as day
  )
  select
    mb.id as business_id,
    mb.name as business_name,
    coalesce(pv.visits_period, 0) as visits_period,
    coalesce(tv.visits_total, 0) as visits_total,
    coalesce(mb.review_count, 0)::bigint as reviews_total,
    coalesce(pr.reviews_period, 0) as reviews_period,
    coalesce(mb.rating, 0)::numeric as rating_avg,
    coalesce(pr.rating_avg_period, 0)::numeric as rating_avg_period,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('stars', s.stars, 'count', coalesce(rd.cnt, 0))
          order by s.stars desc
        )
        from generate_series(1, 5) as s(stars)
        left join (
          select r.rating, count(*)::bigint as cnt
          from public.reviews r, bounds
          where r.business_id = mb.id
            and r.created_at >= timezone('utc', now()) - make_interval(days => bounds.days)
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
          from public.business_visits bv, bounds
          where bv.business_id = mb.id
            and bv.visited_at >= timezone('utc', now()) - make_interval(days => bounds.days)
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
          from public.reviews r, bounds
          where r.business_id = mb.id
            and r.created_at >= timezone('utc', now()) - make_interval(days => bounds.days)
          group by 1
        ) r on r.day = d.day
      ),
      '[]'::jsonb
    ) as daily_reviews,
    coalesce(pc.clicks_period, 0) as clicks_period,
    coalesce(tc.clicks_total, 0) as clicks_total,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'click_type', ct.click_type,
            'count', coalesce(cp.cnt, 0),
            'count_total', coalesce(ctotal.cnt, 0)
          )
          order by coalesce(cp.cnt, 0) desc, ct.click_type
        )
        from (
          values ('whatsapp'), ('phone'), ('directions'), ('website')
        ) as ct(click_type)
        left join (
          select bc.click_type, count(*)::bigint as cnt
          from public.business_clicks bc, bounds
          where bc.business_id = mb.id
            and bc.clicked_at >= timezone('utc', now()) - make_interval(days => bounds.days)
          group by bc.click_type
        ) cp on cp.click_type = ct.click_type
        left join (
          select bc.click_type, count(*)::bigint as cnt
          from public.business_clicks bc
          where bc.business_id = mb.id
          group by bc.click_type
        ) ctotal on ctotal.click_type = ct.click_type
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
          from public.business_clicks bc, bounds
          where bc.business_id = mb.id
            and bc.clicked_at >= timezone('utc', now()) - make_interval(days => bounds.days)
          group by 1
        ) c on c.day = d.day
      ),
      '[]'::jsonb
    ) as daily_clicks
  from my_businesses mb
  left join period_visits pv on pv.business_id = mb.id
  left join total_visits tv on tv.business_id = mb.id
  left join period_reviews pr on pr.business_id = mb.id
  left join period_clicks pc on pc.business_id = mb.id
  left join total_clicks tc on tc.business_id = mb.id
  order by coalesce(pv.visits_period, 0) desc, coalesce(tv.visits_total, 0) desc, mb.name;
$$;

revoke all on function public.get_my_business_metrics(integer) from public;
grant execute on function public.get_my_business_metrics(integer) to authenticated;
