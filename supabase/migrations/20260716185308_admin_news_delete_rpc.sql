-- RPC admin: eliminar cualquier noticia (moderación)

create or replace function public.admin_delete_news_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.news_posts
  where id = p_post_id;

  if not found then
    raise exception 'news post not found';
  end if;
end;
$$;

comment on function public.admin_delete_news_post(uuid) is
  'Elimina una noticia. Solo administradores (is_admin).';

revoke all on function public.admin_delete_news_post(uuid) from public;
grant execute on function public.admin_delete_news_post(uuid) to authenticated;
