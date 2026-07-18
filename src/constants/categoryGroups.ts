import { DEFAULT_BUSINESS_CATEGORIES } from '@/constants/businessCategories';

/**
 * Claves = etiquetas de la home (`CategoryBar`) y valor del query `?grupo=`.
 * Valores = categorías del directorio (coincidencia exacta con `business.category`).
 */
export function buildCategoryGroupMap(categories: readonly string[]): Record<string, string[]> {
  return Object.fromEntries(categories.map(cat => [cat, [cat]]));
}

export const CATEGORY_GROUP_MAP: Record<string, string[]> = buildCategoryGroupMap(
  DEFAULT_BUSINESS_CATEGORIES,
);
