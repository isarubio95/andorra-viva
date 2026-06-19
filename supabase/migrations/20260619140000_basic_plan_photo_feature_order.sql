-- Basic: «Hasta 3 fotos» al final de la lista de features.

update public.plans set
  features = array[
    'WhatsApp directo',
    'Redes sociales',
    'Descripción ampliada',
    'Recepción de reseñas',
    'Apareces en los listados',
    'Hasta 3 fotos'
  ]::text[]
where id = 'basic';
