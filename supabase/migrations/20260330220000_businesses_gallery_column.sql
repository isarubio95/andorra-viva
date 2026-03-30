-- Galería de imágenes (URLs públicas); el registro envía un array desde RegisterBusiness.tsx
alter table public.businesses
  add column if not exists gallery text[] not null default '{}';

comment on column public.businesses.gallery is 'URLs públicas de imágenes adicionales (además de image_url)';
