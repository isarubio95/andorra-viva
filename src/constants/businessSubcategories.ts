import type { BusinessCategory } from '@/constants/businessCategories';

/** Subcategorías por categoría canónica (Andorra Viva). */
export const BUSINESS_SUBCATEGORIES: Record<BusinessCategory, readonly string[]> = {
  'Gastronomía': [
    'Restaurante',
    'Borda y cocina de montaña',
    'Bar y copas',
    'Cafetería y brunch',
  ],
  'Alojamiento': [
    'Hotel',
    'Apartamento turístico',
    'Alojamiento de montaña',
    'Camping y glamping',
  ],
  'Ocio y entretenimiento': [
    'Cine y espectáculos',
    'Vida nocturna',
    'Casino y apuestas',
    'Eventos y salas',
  ],
  'Turismo y experiencias': [
    'Estación de esquí y nieve',
    'Parque de aventura y naturaleza',
    'Actividades al aire libre',
    'Tours y guías',
  ],
  'Compras': [
    'Centro comercial',
    'Moda y complementos',
    'Perfumería y cosmética',
    'Joyería, relojería y lujo',
  ],
  'Bienestar': [
    'Spa termal',
    'Masajes y terapias',
    'Belleza y estética',
    'Gimnasio y fitness',
  ],
} as const;

export type BusinessSubcategory =
  (typeof BUSINESS_SUBCATEGORIES)[BusinessCategory][number];

const SUBCATEGORY_TO_CATEGORY = new Map<string, BusinessCategory>(
  Object.entries(BUSINESS_SUBCATEGORIES).flatMap(([category, subs]) =>
    subs.map(sub => [sub, category as BusinessCategory]),
  ),
);

export function getSubcategoriesForCategory(category: string): readonly string[] {
  return BUSINESS_SUBCATEGORIES[category as BusinessCategory] ?? [];
}

export function isValidSubcategoryForCategory(
  category: string,
  subcategory: string,
): boolean {
  return getSubcategoriesForCategory(category).includes(subcategory);
}

export function getCategoryForSubcategory(subcategory: string): BusinessCategory | null {
  return SUBCATEGORY_TO_CATEGORY.get(subcategory) ?? null;
}

/** Subcategorías disponibles según categorías seleccionadas (vacío = todas). */
export function getAvailableSubcategories(selectedCategories: string[]): string[] {
  if (selectedCategories.length === 0) {
    return Object.values(BUSINESS_SUBCATEGORIES).flat();
  }
  const subs = selectedCategories.flatMap(cat => getSubcategoriesForCategory(cat));
  return [...new Set(subs)];
}
