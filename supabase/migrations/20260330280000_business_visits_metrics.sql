-- Track business visits with one-visit-per-visitor-per-business-per-month rule.
create table if not exists public.business_visits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  visitor_key text not null,
  visited_at timestamptz not null default timezone('utc', now()),
  visit_month date not null default date_trunc('month', timezone('utc', now()))::date,
  created_at timestamptz not null default timezone('utc', now()),
  constraint business_visits_visitor_key_len check (char_length(visitor_key) >= 8)
);

create unique index if not exists business_visits_monthly_unique_idx
  on public.business_visits (business_id, visitor_key, visit_month);

create index if not exists business_visits_business_month_idx
  on public.business_visits (business_id, visit_month);

create index if not exists business_visits_business_visited_at_idx
  on public.business_visits (business_id, visited_at);

alter table public.business_visits enable row level security;

grant insert on public.business_visits to anon, authenticated;

drop policy if exists "Anyone can insert business visits" on public.business_visits;
create policy "Anyone can insert business visits"
on public.business_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "Owners can read visits of own businesses" on public.business_visits;
create policy "Owners can read visits of own businesses"
on public.business_visits
for select
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_visits.business_id
      and b.owner_id = auth.uid()
  )
);

create or replace function public.get_top_visited_businesses_month(_limit integer default 6)
returns table (
  business_id uuid,
  visits_month bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with month_visits as (
    select
      business_id,
      count(*)::bigint as visits_month
    from public.business_visits
    where visit_month = date_trunc('month', timezone('utc', now()))::date
    group by business_id
  )
  select mv.business_id, mv.visits_month
  from month_visits mv
  order by mv.visits_month desc, mv.business_id
  limit greatest(coalesce(_limit, 6), 1);
$$;

create or replace function public.get_my_business_metrics(_days integer default 30)
returns table (
  business_id uuid,
  business_name text,
  visits_month bigint,
  visits_total bigint,
  reviews_total bigint,
  rating_avg numeric,
  daily_visits jsonb
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
  monthly as (
    select bv.business_id, count(*)::bigint as visits_month
    from public.business_visits bv
    where bv.visit_month = date_trunc('month', timezone('utc', now()))::date
    group by bv.business_id
  ),
  totals as (
    select bv.business_id, count(*)::bigint as visits_total
    from public.business_visits bv
    group by bv.business_id
  )
  select
    mb.id as business_id,
    mb.name as business_name,
    coalesce(m.visits_month, 0) as visits_month,
    coalesce(t.visits_total, 0) as visits_total,
    coalesce(mb.review_count, 0)::bigint as reviews_total,
    coalesce(mb.rating, 0)::numeric as rating_avg,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', d.day::text,
            'visits', coalesce(v.count_per_day, 0)
          )
          order by d.day
        )
        from (
          select generate_series(
            timezone('utc', now())::date - greatest(coalesce(_days, 30), 1) + 1,
            timezone('utc', now())::date,
            interval '1 day'
          )::date as day
        ) d
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
    ) as daily_visits
  from my_businesses mb
  left join monthly m on m.business_id = mb.id
  left join totals t on t.business_id = mb.id
  order by visits_month desc, visits_total desc, mb.name;
$$;

revoke all on function public.get_top_visited_businesses_month(integer) from public;
grant execute on function public.get_top_visited_businesses_month(integer) to anon, authenticated;

revoke all on function public.get_my_business_metrics(integer) from public;
grant execute on function public.get_my_business_metrics(integer) to authenticated;
