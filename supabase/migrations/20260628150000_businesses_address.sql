-- Dirección legible del negocio (geocodificada desde el formulario).
alter table public.businesses add column if not exists address text;
