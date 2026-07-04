-- Noticias: publicación mensual solo para usuarios con plan premium activo.

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  author_name text not null,
  business_name text,
  title text not null,
  body text not null,
  image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint news_posts_title_not_empty check (char_length(trim(title)) > 0),
  constraint news_posts_body_not_empty check (char_length(trim(body)) > 0)
);

create index news_posts_created_at_idx on public.news_posts (created_at desc);
create index news_posts_author_created_idx on public.news_posts (author_id, created_at desc);

alter table public.news_posts enable row level security;

grant select on public.news_posts to anon, authenticated;

drop policy if exists "Public read news posts" on public.news_posts;
create policy "Public read news posts"
on public.news_posts
for select
to anon, authenticated
using (true);

drop policy if exists "Authors read own news posts" on public.news_posts;
create policy "Authors read own news posts"
on public.news_posts
for select
to authenticated
using (author_id = auth.uid());

create or replace function public.submit_news_post(
  p_title text,
  p_body text,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_author_name text;
  v_business_id uuid;
  v_business_name text;
  v_post_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not public.owner_has_premium_active(v_uid) then
    raise exception 'Solo los usuarios Premium pueden publicar noticias';
  end if;

  if char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'El título es obligatorio';
  end if;

  if char_length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'El contenido es obligatorio';
  end if;

  if exists (
    select 1
    from public.news_posts np
    where np.author_id = v_uid
      and date_trunc('month', np.created_at) = date_trunc('month', timezone('utc', now()))
  ) then
    raise exception 'Solo puedes publicar una noticia al mes';
  end if;

  v_author_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    'Usuario'
  );

  select b.id, b.name
  into v_business_id, v_business_name
  from public.businesses b
  where b.owner_id = v_uid
  order by b.created_at desc
  limit 1;

  insert into public.news_posts (
    author_id,
    business_id,
    author_name,
    business_name,
    title,
    body,
    image_url
  )
  values (
    v_uid,
    v_business_id,
    v_author_name,
    v_business_name,
    trim(p_title),
    trim(p_body),
    nullif(trim(coalesce(p_image_url, '')), '')
  )
  returning id into v_post_id;

  return v_post_id;
end;
$$;

comment on function public.submit_news_post(text, text, text) is
  'Publica una noticia (máx. 1/mes) para usuarios con plan premium activo.';

grant execute on function public.submit_news_post(text, text, text) to authenticated;

create or replace function public.delete_my_news_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  delete from public.news_posts np
  where np.id = p_post_id
    and np.author_id = v_uid;

  if not found then
    raise exception 'Noticia no encontrada';
  end if;
end;
$$;

comment on function public.delete_my_news_post(uuid) is
  'Elimina una noticia propia del autor autenticado.';

grant execute on function public.delete_my_news_post(uuid) to authenticated;

create or replace function public.get_my_news_monthly_quota()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_can_publish boolean := false;
  v_posted_this_month boolean := false;
  v_month_start timestamptz;
  v_month_end timestamptz;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  v_can_publish := public.owner_has_premium_active(v_uid);
  v_month_start := date_trunc('month', timezone('utc', now()));
  v_month_end := v_month_start + interval '1 month';

  select exists (
    select 1
    from public.news_posts np
    where np.author_id = v_uid
      and np.created_at >= v_month_start
      and np.created_at < v_month_end
  )
  into v_posted_this_month;

  return jsonb_build_object(
    'can_publish', v_can_publish,
    'posted_this_month', v_posted_this_month,
    'remaining_this_month', case
      when not v_can_publish then 0
      when v_posted_this_month then 0
      else 1
    end,
    'month_start', v_month_start,
    'month_end', v_month_end
  );
end;
$$;

comment on function public.get_my_news_monthly_quota() is
  'Cuota mensual de noticias del usuario autenticado (premium + límite 1/mes).';

grant execute on function public.get_my_news_monthly_quota() to authenticated;

-- Feature del plan Premium
update public.plans set
  features = array[
    'Insignia Premium visible para todos los usuarios',
    'Puedes marcar un negocio como recomendado',
    '1 noticia al mes en la sección de noticias',
    'Todo lo incluido en Pro',
    'Soporte prioritario',
    'Hasta 10 fotos'
  ]::text[]
where id = 'premium';
