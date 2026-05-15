import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';

/**
 * Claves = etiquetas de la home (`CategoryBar`) y valor del query `?grupo=`.
 * Valores = categorías del directorio (coincidencia exacta con `business.category`).
 */
export const CATEGORY_GROUP_MAP: Record<string, string[]> = Object.fromEntries(
  BUSINESS_CATEGORIES.map(cat => [cat, [cat]])
) as Record<string, string[]>;
