-- Texto de fotos en tarjetas de plan y alineación con límites de perfil.

update public.plans set
  features = array[
    'Estadísticas avanzadas',
    'Visibilidad mejorada en el directorio',
    'Hasta 6 fotos'
  ]::text[]
where id = 'pro';

update public.plans set
  features = array[
    'Insignia Premium visible para todos los usuarios',
    'Puedes marcar un negocio como recomendado',
    'Todo lo incluido en Pro',
    'Soporte prioritario',
    'Hasta 10 fotos'
  ]::text[]
where id = 'premium';
