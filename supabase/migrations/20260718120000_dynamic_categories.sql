-- Categorías dinámicas: category como text + listado/temas en site_settings.

-- 1) businesses.category deja de ser enum fijo
ALTER TABLE public.businesses
  ALTER COLUMN category TYPE text USING category::text;

DROP TYPE IF EXISTS public.business_category;

-- 2) Listado ordenado de categorías (claves canónicas)
INSERT INTO public.site_settings (key, value)
VALUES (
  'categories',
  '["Gastronomía","Alojamiento","Ocio y entretenimiento","Turismo y experiencias","Compras","Bienestar"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 3) Temas visuales editables (imagen de fondo, emblema, colores)
-- Vacío por defecto: el front usa los temas estáticos de CATEGORY_THEMES.
INSERT INTO public.site_settings (key, value)
VALUES ('category_themes', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
