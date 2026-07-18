/** Categorías canónicas por defecto de negocio en Andorra Viva. */
export const DEFAULT_BUSINESS_CATEGORIES = [
  'Gastronomía',
  'Alojamiento',
  'Ocio y entretenimiento',
  'Turismo y experiencias',
  'Compras',
  'Bienestar',
] as const;

/** @deprecated Usa DEFAULT_BUSINESS_CATEGORIES o categories del SiteContentContext. */
export const BUSINESS_CATEGORIES = DEFAULT_BUSINESS_CATEGORIES;

/** Clave canónica de categoría (texto libre; las por defecto están tipadas abajo). */
export type BusinessCategory = string;

export type DefaultBusinessCategory = (typeof DEFAULT_BUSINESS_CATEGORIES)[number];

export function mergeCategories(remote?: unknown): string[] {
  if (Array.isArray(remote) && remote.length > 0) {
    const cleaned = remote.map(c => String(c).trim()).filter(Boolean);
    if (cleaned.length > 0) return [...new Set(cleaned)];
  }
  return [...DEFAULT_BUSINESS_CATEGORIES];
}
