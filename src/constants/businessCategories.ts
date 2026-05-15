/** Categorías canónicas de negocio en Andorra Viva. */
export const BUSINESS_CATEGORIES = [
  'Gastronomía',
  'Alojamiento',
  'Ocio y entretenimiento',
  'Turismo y experiencias',
  'Compras',
  'Bienestar',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
