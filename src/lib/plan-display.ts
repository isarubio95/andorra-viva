import type { LucideIcon } from 'lucide-react';
import { BarChart3, Crown, Leaf, Star } from 'lucide-react';
import type { Plan } from '@/types/domain';

const META_PREFIX = /^Todo lo incluido en/i;
const BASIC_PHOTO_FEATURE = 'Hasta 3 fotos';

function moveFeatureLast(features: string[], label: string): string[] {
  if (!features.includes(label)) return features;
  return [...features.filter(f => f !== label), label];
}

/** Plan gratuito: oculto en la pestaña de upgrade del dashboard profesional. */
export const DASHBOARD_HIDDEN_PLAN_IDS = new Set(['free']);

export function normalizePlanFeatures(features: string[]): string[] {
  return (features ?? []).map(f => f.trim()).filter(f => f.length > 0 && !META_PREFIX.test(f));
}

export function sortPlansByPrice(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
}

export function getVisiblePlans(plans: Plan[]): Plan[] {
  return sortPlansByPrice(plans);
}

/** Lista única y ordenada de features para alinear filas entre columnas. */
export function getComparisonFeatures(plans: Plan[]): string[] {
  const sorted = sortPlansByPrice(plans);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const plan of sorted) {
    for (const feature of normalizePlanFeatures(plan.features)) {
      if (!seen.has(feature)) {
        seen.add(feature);
        result.push(feature);
      }
    }
  }

  return result;
}

/** Features incluidas en un plan (propias + las de planes inferiores por precio). */
export function getPlanIncludedFeatures(plans: Plan[], planId: string): Set<string> {
  const sorted = sortPlansByPrice(plans);
  const planIndex = sorted.findIndex(p => p.id === planId);
  if (planIndex < 0) return new Set();

  const included = new Set<string>();
  for (let i = 0; i <= planIndex; i++) {
    normalizePlanFeatures(sorted[i].features).forEach(f => included.add(f));
  }
  return included;
}

export interface PlanFeatureDisplay {
  previousPlanName: string | null;
  incremental: string[];
  included: string[];
  excluded: string[];
  isFreeTier: boolean;
}

export function getPlanFeatureDisplay(plans: Plan[], planId: string): PlanFeatureDisplay {
  const sorted = sortPlansByPrice(plans);
  const planIndex = sorted.findIndex(p => p.id === planId);
  if (planIndex < 0) {
    return { previousPlanName: null, incremental: [], included: [], excluded: [], isFreeTier: false };
  }

  const plan = sorted[planIndex];
  const previous = planIndex > 0 ? sorted[planIndex - 1] : null;
  const ownFeatures = normalizePlanFeatures(plan.features);

  const previousFeatures = new Set<string>();
  for (let i = 0; i < planIndex; i++) {
    normalizePlanFeatures(sorted[i].features).forEach(f => previousFeatures.add(f));
  }

  const incremental = ownFeatures.filter(f => !previousFeatures.has(f));

  const included: string[] = [];
  const seenIncluded = new Set<string>();
  for (let i = 0; i <= planIndex; i++) {
    for (const feature of normalizePlanFeatures(sorted[i].features)) {
      if (!seenIncluded.has(feature)) {
        seenIncluded.add(feature);
        included.push(feature);
      }
    }
  }

  const orderedIncremental =
    planId === 'basic' ? moveFeatureLast(incremental, BASIC_PHOTO_FEATURE) : incremental;
  const orderedIncluded =
    planId === 'basic' ? moveFeatureLast(included, BASIC_PHOTO_FEATURE) : included;

  const higherFeatures = new Set<string>();
  for (let i = planIndex + 1; i < sorted.length; i++) {
    normalizePlanFeatures(sorted[i].features).forEach(f => higherFeatures.add(f));
  }
  const ownSet = new Set(ownFeatures);
  const excluded = [...higherFeatures].filter(f => !ownSet.has(f));

  return {
    previousPlanName: previous?.name ?? null,
    incremental: orderedIncremental,
    included: orderedIncluded,
    excluded,
    isFreeTier: plan.price === 0,
  };
}

export interface PlanTheme {
  icon: LucideIcon;
  nameClass: string;
  priceClass: string;
  checkClass: string;
  badgeClass: string;
  buttonClass: string;
  borderClass: string;
  cardClass: string;
  iconWrapClass: string;
  defaultTopBadge?: string;
  subBadge?: string;
  priceSubtitle?: string;
  footerNote?: string;
  preview: 'mountains' | 'photo' | 'stats' | 'premium-photo';
}

const DEFAULT_THEME: PlanTheme = {
  icon: Crown,
  nameClass: 'text-primary',
  priceClass: 'text-primary',
  checkClass: 'text-primary',
  badgeClass: 'bg-primary text-primary-foreground',
  buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  borderClass: 'border-border',
  cardClass: 'bg-card',
  iconWrapClass: 'bg-muted text-primary',
  preview: 'photo',
};

const PLAN_THEMES: Record<string, PlanTheme> = {
  free: {
    icon: Leaf,
    nameClass: 'text-emerald-600',
    priceClass: 'text-emerald-600',
    checkClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-500 text-white',
    buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
    borderClass: 'border-emerald-200/80',
    cardClass: 'bg-white',
    iconWrapClass: 'bg-emerald-500 text-white',
    defaultTopBadge: 'Para siempre gratis',
    priceSubtitle: 'Para siempre',
    preview: 'mountains',
  },
  basic: {
    icon: Star,
    nameClass: 'text-sky-600',
    priceClass: 'text-sky-600',
    checkClass: 'text-sky-500',
    badgeClass: 'bg-sky-500 text-white',
    buttonClass: 'bg-sky-500 text-white hover:bg-sky-500/90',
    borderClass: 'border-sky-200/80',
    cardClass: 'bg-white',
    iconWrapClass: 'bg-sky-500 text-white',
    preview: 'photo',
  },
  pro: {
    icon: BarChart3,
    nameClass: 'text-orange-500',
    priceClass: 'text-orange-500',
    checkClass: 'text-orange-500',
    badgeClass: 'bg-orange-500 text-white',
    buttonClass: 'bg-orange-500 text-white hover:bg-orange-500/90',
    borderClass: 'border-orange-200/80',
    cardClass: 'bg-white',
    iconWrapClass: 'bg-orange-500 text-white',
    subBadge: '3 meses gratis',
    preview: 'stats',
  },
  premium: {
    icon: Crown,
    nameClass: 'text-amber-600',
    priceClass: 'text-amber-600',
    checkClass: 'text-amber-500',
    badgeClass: 'recommended-badge border-0',
    buttonClass: 'bg-linear-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-500/90 hover:to-yellow-500/90',
    borderClass: 'border-amber-200/80',
    cardClass: 'bg-white',
    iconWrapClass: 'bg-linear-to-br from-amber-400 to-yellow-500 text-white',
    preview: 'premium-photo',
  },
};

export function getPlanTheme(planId: string): PlanTheme {
  return PLAN_THEMES[planId] ?? DEFAULT_THEME;
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.price === 0) return `0${plan.currency}`;
  const formatted =
    plan.price % 1 === 0 ? String(plan.price) : plan.price.toFixed(2).replace('.', ',');
  return `${formatted}${plan.currency}`;
}
