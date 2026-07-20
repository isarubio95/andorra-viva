import type { DefaultBusinessCategory } from '@/constants/businessCategories';
import { buildResponsiveImage } from '@/lib/responsive-image';

export type CategoryGradient = { from: string; via: string; to: string };

export type CategoryImage = {
  src: string;
  srcSet: string;
};

export type CategoryTheme = {
  displayLabel: string;
  image: CategoryImage;
  /** Emblema circular (PNG con fondo transparente) que se muestra en el centro de la card. */
  emblem: string;
  gradient: CategoryGradient;
  accent: string;
};

/** Campos editables desde el admin (URLs remotas o rutas estáticas). */
export type CategoryThemeOverride = {
  displayLabel?: string;
  /** URL de la foto de fondo / portada. */
  imageUrl?: string;
  imageSrcSet?: string;
  /** URL del emblema. */
  emblem?: string;
  gradient?: Partial<CategoryGradient>;
  accent?: string;
};

export type CategoryThemesConfig = Record<string, CategoryThemeOverride>;

const CATEGORY_IMAGE_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

function categoryImage(stem: string): CategoryImage {
  return {
    src: `/categories/${stem}-960.webp`,
    srcSet: `/categories/${stem}-640.webp 640w, /categories/${stem}-960.webp 960w`,
  };
}

export const CATEGORY_IMAGE_RESPONSIVE_SIZES = CATEGORY_IMAGE_SIZES;

const DEFAULT_NEW_CATEGORY_THEME: CategoryTheme = {
  displayLabel: 'Nueva categoría',
  image: {
    src: '/categories/cat-experiencias-960.webp',
    srcSet: '/categories/cat-experiencias-640.webp 640w, /categories/cat-experiencias-960.webp 960w',
  },
  emblem: '/categories/emblem-experiencias.png',
  gradient: { from: '#1e293b', via: '#334155', to: '#0f172a' },
  accent: '#475569',
};

export const CATEGORY_THEMES: Record<DefaultBusinessCategory, CategoryTheme> = {
  Gastronomía: {
    displayLabel: 'Dónde comer',
    image: categoryImage('cat-gastronomia'),
    emblem: '/categories/emblem-gastronomia.png',
    gradient: { from: '#7f1d1d', via: '#b91c1c', to: '#450a0a' },
    accent: '#c2410c',
  },
  Alojamiento: {
    displayLabel: 'Dónde dormir',
    image: categoryImage('cat-alojamiento'),
    emblem: '/categories/emblem-alojamiento.png',
    gradient: { from: '#1e3a8a', via: '#1d4ed8', to: '#0c1f4d' },
    accent: '#1d4ed8',
  },
  'Ocio y entretenimiento': {
    displayLabel: 'Ocio',
    image: categoryImage('cat-ocio'),
    emblem: '/categories/emblem-ocio.png',
    gradient: { from: '#4c1d95', via: '#6d28d9', to: '#2e1065' },
    accent: '#6d28d9',
  },
  'Turismo y experiencias': {
    displayLabel: 'Experiencias',
    image: categoryImage('cat-experiencias'),
    emblem: '/categories/emblem-experiencias.png',
    gradient: { from: '#064e3b', via: '#047857', to: '#022c22' },
    accent: '#047857',
  },
  Compras: {
    displayLabel: 'Shopping',
    image: categoryImage('cat-compras'),
    emblem: '/categories/emblem-compras.png',
    gradient: { from: '#831843', via: '#be185d', to: '#500724' },
    accent: '#be185d',
  },
  Bienestar: {
    displayLabel: 'Wellness',
    image: categoryImage('cat-bienestar'),
    emblem: '/categories/emblem-bienestar.png',
    gradient: { from: '#134e4a', via: '#0e7490', to: '#042f2e' },
    accent: '#0e7490',
  },
};

function baseThemeFor(category: string): CategoryTheme {
  const known = CATEGORY_THEMES[category as DefaultBusinessCategory];
  if (known) return known;
  return {
    ...DEFAULT_NEW_CATEGORY_THEME,
    displayLabel: category,
  };
}

export function resolveCategoryTheme(
  category: string,
  override?: CategoryThemeOverride | null,
  labelOverride?: string,
): CategoryTheme {
  const base = baseThemeFor(category);
  if (!override && !labelOverride) return base;

  const image: CategoryImage = override?.imageUrl
    ? {
        src: override.imageUrl,
        srcSet:
          override.imageSrcSet ||
          buildResponsiveImage(override.imageUrl).srcSet ||
          '',
      }
    : base.image;

  return {
    displayLabel: labelOverride || override?.displayLabel || base.displayLabel,
    image,
    emblem: override?.emblem || base.emblem,
    gradient: {
      from: override?.gradient?.from || base.gradient.from,
      via: override?.gradient?.via || base.gradient.via,
      to: override?.gradient?.to || base.gradient.to,
    },
    accent: override?.accent || base.accent,
  };
}

export function getCategoryTheme(
  category: string,
  themes?: CategoryThemesConfig,
  labels?: Record<string, string>,
): CategoryTheme | null {
  if (!category) return null;
  return resolveCategoryTheme(category, themes?.[category], labels?.[category]);
}

export function categoryHeroBackground(gradient: CategoryGradient, accent: string): string {
  return [
    'radial-gradient(ellipse 75% 60% at 12% -8%, rgb(255 255 255 / 0.22), transparent 55%)',
    `radial-gradient(ellipse 52% 44% at 88% 108%, ${accent}55, transparent 62%)`,
    `radial-gradient(ellipse 40% 35% at 50% 120%, rgb(0 0 0 / 0.18), transparent 70%)`,
    `linear-gradient(128deg, ${gradient.from} 0%, ${gradient.via} 38%, ${gradient.to} 100%)`,
  ].join(', ');
}

export function themeToOverride(theme: CategoryTheme): CategoryThemeOverride {
  return {
    displayLabel: theme.displayLabel,
    imageUrl: theme.image.src,
    imageSrcSet: theme.image.srcSet || undefined,
    emblem: theme.emblem,
    gradient: { ...theme.gradient },
    accent: theme.accent,
  };
}

/** Defaults reexportados. */
export { DEFAULT_BUSINESS_CATEGORIES } from '@/constants/businessCategories';
