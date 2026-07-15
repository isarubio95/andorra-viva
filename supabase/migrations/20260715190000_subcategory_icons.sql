-- Iconos editables por subcategoría (site_settings)

insert into public.site_settings (key, value)
values
  (
    'subcategory_icons',
    '{
      "Restaurante": "utensils-crossed",
      "Borda y cocina de montaña": "cooking-pot",
      "Bar y copas": "wine",
      "Cafetería y brunch": "coffee",
      "Hotel": "hotel",
      "Apartamento turístico": "building",
      "Alojamiento de montaña": "mountain",
      "Camping y glamping": "tent",
      "Cine y espectáculos": "clapperboard",
      "Vida nocturna": "martini",
      "Casino y apuestas": "dices",
      "Eventos y salas": "calendar-days",
      "Estación de esquí y nieve": "snowflake",
      "Parque de aventura y naturaleza": "mountain",
      "Actividades al aire libre": "bike",
      "Tours y guías": "compass",
      "Centro comercial": "store",
      "Moda y complementos": "shirt",
      "Perfumería y cosmética": "spray-can",
      "Joyería, relojería y lujo": "gem",
      "Spa termal": "flower",
      "Masajes y terapias": "hand-heart",
      "Belleza y estética": "sparkles",
      "Gimnasio y fitness": "dumbbell"
    }'::jsonb
  )
on conflict (key) do nothing;
