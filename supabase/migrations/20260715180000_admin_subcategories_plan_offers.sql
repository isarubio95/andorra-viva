-- Subcategorías editables desde admin y ofertas (meses gratis) en planes

-- ---------------------------------------------------------------------------
-- Ofertas en planes
-- ---------------------------------------------------------------------------
alter table public.plans
  add column if not exists trial_months integer not null default 0,
  add column if not exists promo_label text;

update public.plans
set
  trial_months = 3,
  promo_label = '3 meses gratis'
where id = 'pro';

-- ---------------------------------------------------------------------------
-- Subcategorías y etiquetas visibles (site_settings)
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value)
values
  (
    'subcategories',
    '{
      "Gastronomía": ["Restaurante", "Borda y cocina de montaña", "Bar y copas", "Cafetería y brunch"],
      "Alojamiento": ["Hotel", "Apartamento turístico", "Alojamiento de montaña", "Camping y glamping"],
      "Ocio y entretenimiento": ["Cine y espectáculos", "Vida nocturna", "Casino y apuestas", "Eventos y salas"],
      "Turismo y experiencias": ["Estación de esquí y nieve", "Parque de aventura y naturaleza", "Actividades al aire libre", "Tours y guías"],
      "Compras": ["Centro comercial", "Moda y complementos", "Perfumería y cosmética", "Joyería, relojería y lujo"],
      "Bienestar": ["Spa termal", "Masajes y terapias", "Belleza y estética", "Gimnasio y fitness"]
    }'::jsonb
  ),
  (
    'subcategory_labels',
    '{
      "Restaurante": "Restaurantes",
      "Borda y cocina de montaña": "Cocina local",
      "Bar y copas": "Bar & copas",
      "Cafetería y brunch": "Cafeterías",
      "Hotel": "Hoteles",
      "Apartamento turístico": "Apartamentos",
      "Alojamiento de montaña": "De montaña",
      "Camping y glamping": "Camping",
      "Cine y espectáculos": "Espectáculos",
      "Vida nocturna": "Vida nocturna",
      "Casino y apuestas": "Casino",
      "Eventos y salas": "Eventos",
      "Estación de esquí y nieve": "Esquí & nieve",
      "Parque de aventura y naturaleza": "Aventura",
      "Actividades al aire libre": "Actividades",
      "Tours y guías": "Tours",
      "Centro comercial": "Tiendas",
      "Moda y complementos": "Moda",
      "Perfumería y cosmética": "Perfumería",
      "Joyería, relojería y lujo": "Joyerías",
      "Spa termal": "Spas",
      "Masajes y terapias": "Masajes",
      "Belleza y estética": "Belleza",
      "Gimnasio y fitness": "Fitness"
    }'::jsonb
  )
on conflict (key) do nothing;
