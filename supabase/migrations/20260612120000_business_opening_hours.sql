-- Horario semanal por negocio (estilo Google Maps)
alter table public.businesses
  add column if not exists opening_hours jsonb;

comment on column public.businesses.opening_hours is
  'Horario semanal JSON: { "monday": { "closed": false, "periods": [{ "open": "09:00", "close": "18:00" }] }, ... }';
