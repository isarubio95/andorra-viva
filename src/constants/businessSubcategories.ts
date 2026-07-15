import type { BusinessCategory } from '@/constants/businessCategories';

export type SubcategoryConfig = Record<BusinessCategory, string[]>;

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

export function mergeSubcategoryConfig(
  remote?: Partial<SubcategoryConfig>,
): SubcategoryConfig {
  const merged = {} as SubcategoryConfig;
  for (const [category, defaults] of Object.entries(BUSINESS_SUBCATEGORIES)) {
    const remoteList = remote?.[category as BusinessCategory];
    merged[category as BusinessCategory] =
      Array.isArray(remoteList) && remoteList.length > 0
        ? remoteList.map(s => String(s).trim()).filter(Boolean)
        : [...defaults];
  }
  return merged;
}

export const DEFAULT_SUBCATEGORY_CONFIG = mergeSubcategoryConfig();

export function getSubcategoriesForCategory(
  category: string,
  config: SubcategoryConfig = DEFAULT_SUBCATEGORY_CONFIG,
): readonly string[] {
  return config[category as BusinessCategory] ?? [];
}

export function isValidSubcategoryForCategory(
  category: string,
  subcategory: string,
  config: SubcategoryConfig = DEFAULT_SUBCATEGORY_CONFIG,
): boolean {
  return getSubcategoriesForCategory(category, config).includes(subcategory);
}

export function getCategoryForSubcategory(
  subcategory: string,
  config: SubcategoryConfig = DEFAULT_SUBCATEGORY_CONFIG,
): BusinessCategory | null {
  for (const [category, subs] of Object.entries(config)) {
    if (subs.includes(subcategory)) return category as BusinessCategory;
  }
  return SUBCATEGORY_TO_CATEGORY.get(subcategory) ?? null;
}

/** Subcategorías disponibles según categorías seleccionadas (vacío = todas). */
export function getAvailableSubcategories(
  selectedCategories: string[],
  config: SubcategoryConfig = DEFAULT_SUBCATEGORY_CONFIG,
): string[] {
  if (selectedCategories.length === 0) {
    return Object.values(config).flat();
  }
  const subs = selectedCategories.flatMap(cat => getSubcategoriesForCategory(cat, config));
  return [...new Set(subs)];
}
