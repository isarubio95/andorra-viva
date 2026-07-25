-- Permite editar una noticia propia solo durante el primer mes tras publicarla.

create or replace function public.update_my_news_post(
  p_post_id uuid,
  p_title text,
  p_body text,
  p_image_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated int;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'El título es obligatorio';
  end if;

  if char_length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'El contenido es obligatorio';
  end if;

  update public.news_posts np
  set
    title = trim(p_title),
    body = trim(p_body),
    image_url = nullif(trim(coalesce(p_image_url, '')), ''),
    updated_at = timezone('utc', now())
  where np.id = p_post_id
    and np.author_id = v_uid
    and np.created_at > timezone('utc', now()) - interval '1 month';

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    if exists (
      select 1
      from public.news_posts np
      where np.id = p_post_id
        and np.author_id = v_uid
    ) then
      raise exception 'Solo puedes editar una noticia durante el primer mes tras publicarla';
    end if;
    raise exception 'Noticia no encontrada';
  end if;
end;
$$;

comment on function public.update_my_news_post(uuid, text, text, text) is
  'Actualiza una noticia propia si se publicó hace menos de un mes.';

revoke all on function public.update_my_news_post(uuid, text, text, text) from public;
grant execute on function public.update_my_news_post(uuid, text, text, text) to authenticated;
