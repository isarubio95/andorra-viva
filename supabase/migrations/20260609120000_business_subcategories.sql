-- Subcategorías de negocio (validadas en la app; dependen de category).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS subcategory text;

CREATE INDEX IF NOT EXISTS businesses_subcategory_idx
  ON public.businesses (subcategory)
  WHERE subcategory IS NOT NULL;

COMMENT ON COLUMN public.businesses.subcategory IS
  'Subcategoría dentro de category (conjunto definido en la app).';
