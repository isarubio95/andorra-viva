import { DEFAULT_BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { CATEGORY_THEMES } from '@/constants/categoryDisplay';

export type SiteTextKey =
  | 'footer_tagline'
  | 'directory_cta'
  | 'directory_cta_button'
  | 'section_recommendations'
  | 'section_top_rated'
  | 'section_most_visited'
  | 'signup_user_badge'
  | 'signup_user_title'
  | 'signup_user_description'
  | 'signup_user_feature_1'
  | 'signup_user_feature_2'
  | 'signup_user_feature_3'
  | 'signup_pro_badge'
  | 'signup_pro_title'
  | 'signup_pro_description'
  | 'signup_pro_feature_1'
  | 'signup_pro_feature_2'
  | 'signup_pro_feature_3';

export const DEFAULT_SITE_TEXTS: Record<SiteTextKey, string> = {
  footer_tagline: 'La guía exclusiva de experiencias en el Principado.',
  directory_cta:
    'Descubre todos los negocios de Andorra con filtros, búsqueda y reseñas de la comunidad.',
  directory_cta_button: 'Ir al directorio completo',
  section_recommendations: 'Nuestras recomendaciones',
  section_top_rated: 'Mejor valorados',
  section_most_visited: 'Más visitados del mes',
  signup_user_badge: 'Gratis',
  signup_user_title: 'Usuario',
  signup_user_description: 'Explora negocios, deja reseñas y guarda tus favoritos',
  signup_user_feature_1: 'Explorar directorio',
  signup_user_feature_2: 'Dejar reseñas',
  signup_user_feature_3: 'Guardar favoritos',
  signup_pro_badge: 'Desde 0€',
  signup_pro_title: 'Profesional',
  signup_pro_description: 'Registra tu negocio y llega a más clientes en Andorra',
  signup_pro_feature_1: 'Registrar negocios',
  signup_pro_feature_2: 'Ver métricas',
  signup_pro_feature_3: 'Planes de suscripción',
};

export const DEFAULT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_BUSINESS_CATEGORIES.map(cat => [cat, CATEGORY_THEMES[cat].displayLabel]),
);

export const SITE_TEXT_LABELS: Record<SiteTextKey, string> = {
  footer_tagline: 'Eslogan del pie de página',
  directory_cta: 'Texto CTA del directorio',
  directory_cta_button: 'Botón CTA del directorio',
  section_recommendations: 'Título sección recomendaciones',
  section_top_rated: 'Título sección mejor valorados',
  section_most_visited: 'Título sección más visitados',
  signup_user_badge: 'Usuario — etiqueta (badge)',
  signup_user_title: 'Usuario — título',
  signup_user_description: 'Usuario — descripción',
  signup_user_feature_1: 'Usuario — ventaja 1',
  signup_user_feature_2: 'Usuario — ventaja 2',
  signup_user_feature_3: 'Usuario — ventaja 3',
  signup_pro_badge: 'Profesional — etiqueta (badge)',
  signup_pro_title: 'Profesional — título',
  signup_pro_description: 'Profesional — descripción',
  signup_pro_feature_1: 'Profesional — ventaja 1',
  signup_pro_feature_2: 'Profesional — ventaja 2',
  signup_pro_feature_3: 'Profesional — ventaja 3',
};

export const SITE_TEXT_SECTIONS: {
  id: string;
  title: string;
  description: string;
  keys: SiteTextKey[];
}[] = [
  {
    id: 'home',
    title: 'Inicio y pie de página',
    description: 'Textos visibles en la página de inicio y el pie.',
    keys: [
      'footer_tagline',
      'directory_cta',
      'directory_cta_button',
      'section_recommendations',
      'section_top_rated',
      'section_most_visited',
    ],
  },
  {
    id: 'signup',
    title: 'Registro — tipo de cuenta',
    description: 'Textos de las tarjetas Usuario y Profesional en la pantalla de registro.',
    keys: [
      'signup_user_badge',
      'signup_user_title',
      'signup_user_description',
      'signup_user_feature_1',
      'signup_user_feature_2',
      'signup_user_feature_3',
      'signup_pro_badge',
      'signup_pro_title',
      'signup_pro_description',
      'signup_pro_feature_1',
      'signup_pro_feature_2',
      'signup_pro_feature_3',
    ],
  },
];
