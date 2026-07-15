-- Tema del mapa principal (editable desde el panel de administración)

insert into public.site_settings (key, value)
values ('map_theme', '"voyager"'::jsonb)
on conflict (key) do nothing;
