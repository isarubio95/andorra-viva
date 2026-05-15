-- Migra business_category al conjunto canónico de 6 valores.
-- category es enum en Postgres: no se puede comparar con literales que no existan en el enum.

ALTER TABLE public.businesses
  ALTER COLUMN category TYPE text USING category::text;

UPDATE public.businesses
SET category = CASE category
  WHEN 'Restaurante' THEN 'Gastronomía'
  WHEN 'Hotel' THEN 'Alojamiento'
  WHEN 'Bar' THEN 'Ocio y entretenimiento'
  WHEN 'Discoteca' THEN 'Ocio y entretenimiento'
  WHEN 'Ocio Nocturno' THEN 'Ocio y entretenimiento'
  WHEN 'Actividades' THEN 'Turismo y experiencias'
  WHEN 'Museo' THEN 'Turismo y experiencias'
  WHEN 'Transporte' THEN 'Turismo y experiencias'
  WHEN 'Servicios' THEN 'Turismo y experiencias'
  WHEN 'Tienda' THEN 'Compras'
  WHEN 'SPA & Wellness' THEN 'Bienestar'
  WHEN 'Spa' THEN 'Bienestar'
  WHEN 'Gastronomía' THEN 'Gastronomía'
  WHEN 'Alojamiento' THEN 'Alojamiento'
  WHEN 'Ocio y entretenimiento' THEN 'Ocio y entretenimiento'
  WHEN 'Turismo y experiencias' THEN 'Turismo y experiencias'
  WHEN 'Compras' THEN 'Compras'
  WHEN 'Bienestar' THEN 'Bienestar'
  ELSE 'Turismo y experiencias'
END
WHERE category IS NOT NULL;

DROP TYPE IF EXISTS public.business_category;

CREATE TYPE public.business_category AS ENUM (
  'Gastronomía',
  'Alojamiento',
  'Ocio y entretenimiento',
  'Turismo y experiencias',
  'Compras',
  'Bienestar'
);

ALTER TABLE public.businesses
  ALTER COLUMN category TYPE public.business_category
  USING category::public.business_category;
