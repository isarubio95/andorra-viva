import type { BusinessCategory } from '@/constants/businessCategories';

export type CategoryGradient = { from: string; via: string; to: string };

export type CategoryTheme = {
  displayLabel: string;
  image: string;
  gradient: CategoryGradient;
  accent: string;
};

export const CATEGORY_THEMES: Record<BusinessCategory, CategoryTheme> = {
  Gastronomía: {
    displayLabel: 'Dónde comer',
    image: '/categories/cat-gastronomia.png',
    gradient: { from: '#7f1d1d', via: '#b91c1c', to: '#450a0a' },
    accent: '#c2410c',
  },
  Alojamiento: {
    displayLabel: 'Dónde dormir',
    image: '/categories/cat-alojamiento.png',
    gradient: { from: '#1e3a8a', via: '#1d4ed8', to: '#0c1f4d' },
    accent: '#1d4ed8',
  },
  'Ocio y entretenimiento': {
    displayLabel: 'Ocio',
    image: '/categories/cat-ocio.png',
    gradient: { from: '#4c1d95', via: '#6d28d9', to: '#2e1065' },
    accent: '#6d28d9',
  },
  'Turismo y experiencias': {
    displayLabel: 'Experiencias',
    image: '/categories/cat-experiencias.png',
    gradient: { from: '#064e3b', via: '#047857', to: '#022c22' },
    accent: '#047857',
  },
  Compras: {
    displayLabel: 'Shopping',
    image: '/categories/cat-compras.png',
    gradient: { from: '#831843', via: '#be185d', to: '#500724' },
    accent: '#be185d',
  },
  Bienestar: {
    displayLabel: 'Wellness',
    image: '/categories/cat-bienestar.png',
    gradient: { from: '#134e4a', via: '#0e7490', to: '#042f2e' },
    accent: '#0e7490',
  },
};

export function getCategoryTheme(category: string): CategoryTheme | null {
  return CATEGORY_THEMES[category as BusinessCategory] ?? null;
}

export function categoryHeroBackground(gradient: CategoryGradient, accent: string): string {
  return [
    'radial-gradient(ellipse 75% 60% at 12% -8%, rgb(255 255 255 / 0.22), transparent 55%)',
    `radial-gradient(ellipse 52% 44% at 88% 108%, ${accent}55, transparent 62%)`,
    `radial-gradient(ellipse 40% 35% at 50% 120%, rgb(0 0 0 / 0.18), transparent 70%)`,
    `linear-gradient(128deg, ${gradient.from} 0%, ${gradient.via} 38%, ${gradient.to} 100%)`,
  ].join(', ');
}
