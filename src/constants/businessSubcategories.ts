import { DEFAULT_BUSINESS_CATEGORIES } from '@/constants/businessCategories';

export type SubcategoryConfig = Record<string, string[]>;

/** Subcategorías por categoría canónica (Andorra Viva). */
export const BUSINESS_SUBCATEGORIES: Record<string, readonly string[]> = {
  Gastronomía: [
    'Restaurante',
    'Borda y cocina de montaña',
    'Bar y copas',
    'Cafetería y brunch',
  ],
  Alojamiento: [
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
  Compras: [
    'Centro comercial',
    'Moda y complementos',
    'Perfumería y cosmética',
    'Joyería, relojería y lujo',
  ],
  Bienestar: [
    'Spa termal',
    'Masajes y terapias',
    'Belleza y estética',
    'Gimnasio y fitness',
  ],
};

export type BusinessSubcategory = string;

const SUBCATEGORY_TO_CATEGORY = new Map<string, string>(
  Object.entries(BUSINESS_SUBCATEGORIES).flatMap(([category, subs]) =>
    subs.map(sub => [sub, category]),
  ),
);

export function mergeSubcategoryConfig(
  remote?: Partial<SubcategoryConfig>,
  categories: readonly string[] = DEFAULT_BUSINESS_CATEGORIES,
): SubcategoryConfig {
  const merged: SubcategoryConfig = {};
  for (const category of categories) {
    const defaults = BUSINESS_SUBCATEGORIES[category];
    const remoteList = remote?.[category];
    if (Array.isArray(remoteList) && remoteList.length > 0) {
      merged[category] = remoteList.map(s => String(s).trim()).filter(Boolean);
    } else if (defaults) {
      merged[category] = [...defaults];
    } else {
      merged[category] = ['General'];
    }
  }
  return merged;
}

export const DEFAULT_SUBCATEGORY_CONFIG = mergeSubcategoryConfig();

export function getSubcategoriesForCategory(
  category: string,
  config: SubcategoryConfig = DEFAULT_SUBCATEGORY_CONFIG,
): readonly string[] {
  return config[category] ?? [];
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
): string | null {
  for (const [category, subs] of Object.entries(config)) {
    if (subs.includes(subcategory)) return category;
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
