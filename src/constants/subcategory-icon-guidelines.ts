import { getCategoryTheme } from '@/constants/categoryDisplay';

export const SUBCATEGORY_ICON_DISPLAY_PX = 20;
export const SUBCATEGORY_ICON_UPLOAD_PX = 48;
export const SUBCATEGORY_ICON_MAX_BYTES = 256 * 1024;

export const SUBCATEGORY_ICON_ACCEPT = 'image/png,image/webp,image/svg+xml';

export const SUBCATEGORY_ICON_RECOMMENDED_LIBRARIES = [
  {
    name: 'Lucide',
    url: 'https://lucide.dev/icons',
    note: 'La misma biblioteca que usamos por defecto. Exporta en SVG negro sobre transparente.',
  },
  {
    name: 'Phosphor Icons',
    url: 'https://phosphoricons.com',
    note: 'Estilo «Regular», grosor similar. Ideal en 48×48 px.',
  },
  {
    name: 'Heroicons',
    url: 'https://heroicons.com',
    note: 'Variante Outline a 24 px; escala a 48 px al exportar.',
  },
] as const;

export function getSubcategoryIconAccentColor(category: string): string {
  return getCategoryTheme(category)?.accent ?? '#475569';
}

export function getSubcategoryIconGuidelines(category: string) {
  const accent = getSubcategoryIconAccentColor(category);
  return {
    accent,
    displayPx: SUBCATEGORY_ICON_DISPLAY_PX,
    uploadPx: SUBCATEGORY_ICON_UPLOAD_PX,
    maxKb: SUBCATEGORY_ICON_MAX_BYTES / 1024,
    formats: 'PNG o WebP con fondo transparente (también SVG)',
    stroke: 'Trazo fino ~2 px, sin relleno sólido, estilo outline',
    colorHint: `Sube el icono en negro sobre transparente; se tiñe automáticamente con ${accent}`,
  };
}
