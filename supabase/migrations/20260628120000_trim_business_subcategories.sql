-- Reasigna subcategorías eliminadas de la taxonomía a las 24 del dashboard.

UPDATE public.businesses
SET subcategory = 'Restaurante'
WHERE subcategory = 'Comida rápida y casual';

UPDATE public.businesses
SET subcategory = 'Cafetería y brunch'
WHERE subcategory = 'Heladería y dulces';

UPDATE public.businesses
SET subcategory = 'Hotel'
WHERE subcategory = 'Hostal y pensión';

UPDATE public.businesses
SET subcategory = 'Eventos y salas'
WHERE subcategory IN ('Centro de ocio y juegos', 'Complejo deportivo');

UPDATE public.businesses
SET subcategory = 'Tours y guías'
WHERE subcategory IN ('Museo y patrimonio', 'Transporte turístico');

UPDATE public.businesses
SET subcategory = 'Centro comercial'
WHERE subcategory IN ('Gran superficie y duty free', 'Electrónica y tecnología');

UPDATE public.businesses
SET subcategory = 'Moda y complementos'
WHERE subcategory = 'Deporte y outdoor';

UPDATE public.businesses
SET subcategory = 'Spa termal'
WHERE subcategory = 'Spa y tratamientos';

UPDATE public.businesses
SET subcategory = 'Gimnasio y fitness'
WHERE subcategory = 'Yoga, pilates y mindfulness';
