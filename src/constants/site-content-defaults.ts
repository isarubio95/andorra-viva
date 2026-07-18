import { DEFAULT_BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { CATEGORY_THEMES } from '@/constants/categoryDisplay';

export type SiteTextKey =
  | 'footer_tagline'
  | 'directory_cta'
  | 'directory_cta_button'
  | 'section_recommendations'
  | 'section_top_rated'
  | 'section_most_visited';

export const DEFAULT_SITE_TEXTS: Record<SiteTextKey, string> = {
  footer_tagline: 'La guía exclusiva de experiencias en el Principado.',
  directory_cta:
    'Descubre todos los negocios de Andorra con filtros, búsqueda y reseñas de la comunidad.',
  directory_cta_button: 'Ir al directorio completo',
  section_recommendations: 'Nuestras recomendaciones',
  section_top_rated: 'Mejor valorados',
  section_most_visited: 'Más visitados del mes',
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
};
