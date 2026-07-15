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
  checkWrapClass: string;
  badgeClass: string;
  buttonClass: string;
  borderClass: string;
  cardClass: string;
  headerClass: string;
  glowClass: string;
  iconWrapClass: string;
  defaultTopBadge?: string;
  subBadge?: string;
  priceSubtitle?: string;
  footerNote?: string;
  preview?: 'mountains' | 'photo' | 'stats' | 'premium-photo';
}

const DEFAULT_THEME: PlanTheme = {
  icon: Crown,
  nameClass: 'text-primary',
  priceClass: 'text-primary',
  checkClass: 'text-white',
  checkWrapClass: 'bg-primary',
  badgeClass: 'bg-primary text-primary-foreground',
  buttonClass: 'bg-primary text-primary-foreground hover:brightness-110',
  borderClass: 'border-border',
  cardClass: 'bg-card',
  headerClass: 'bg-linear-to-b from-primary to-primary',
  glowClass: 'shadow-black/10',
  iconWrapClass: 'bg-muted text-primary',
  preview: 'photo',
};

const PLAN_THEMES: Record<string, PlanTheme> = {
  free: {
    icon: Leaf,
    nameClass: 'text-emerald-700',
    priceClass: 'text-emerald-600',
    checkClass: 'text-white',
    checkWrapClass: 'bg-emerald-500 shadow-emerald-500/40',
    badgeClass: 'bg-emerald-500 text-white',
    buttonClass:
      'bg-linear-to-b from-emerald-500 to-emerald-700 text-white shadow-emerald-600/30 hover:brightness-110',
    borderClass: 'border-emerald-300/70',
    cardClass: 'bg-white',
    headerClass: 'bg-linear-to-b from-emerald-500 via-emerald-600 to-emerald-800',
    glowClass: 'shadow-emerald-500/25',
    iconWrapClass:
      'bg-linear-to-b from-emerald-300 via-emerald-500 to-emerald-700 text-white ring-4 ring-white/30',
    defaultTopBadge: 'Para siempre gratis',
    preview: 'mountains',
  },
  basic: {
    icon: Star,
    nameClass: 'text-blue-700',
    priceClass: 'text-blue-600',
    checkClass: 'text-white',
    checkWrapClass: 'bg-blue-600 shadow-blue-600/40',
    badgeClass: 'bg-blue-600 text-white',
    buttonClass:
      'bg-linear-to-b from-blue-600 to-blue-800 text-white shadow-blue-700/30 hover:brightness-110',
    borderClass: 'border-blue-300/70',
    cardClass: 'bg-white',
    headerClass: 'bg-linear-to-b from-blue-500 via-blue-700 to-blue-900',
    glowClass: 'shadow-blue-600/25',
    iconWrapClass:
      'bg-linear-to-b from-sky-300 via-blue-500 to-blue-800 text-white ring-4 ring-white/30',
    preview: 'photo',
  },
  pro: {
    icon: BarChart3,
    nameClass: 'text-orange-600',
    priceClass: 'text-orange-600',
    checkClass: 'text-white',
    checkWrapClass: 'bg-orange-500 shadow-orange-500/40',
    badgeClass: 'bg-red-600 text-white',
    buttonClass:
      'bg-linear-to-b from-orange-500 to-red-600 text-white shadow-red-600/30 hover:brightness-110',
    borderClass: 'border-orange-300/70',
    cardClass: 'bg-white',
    headerClass: 'bg-linear-to-b from-orange-500 via-orange-600 to-red-700',
    glowClass: 'shadow-orange-500/30',
    iconWrapClass:
      'bg-linear-to-b from-amber-300 via-orange-500 to-red-600 text-white ring-4 ring-white/30',
    subBadge: undefined,
    preview: 'stats',
  },
  premium: {
    icon: Crown,
    nameClass: 'text-amber-700',
    priceClass: 'text-amber-600',
    checkClass: 'text-white',
    checkWrapClass: 'bg-amber-500 shadow-amber-500/40',
    badgeClass: 'recommended-badge border-0',
    buttonClass:
      'bg-linear-to-b from-amber-400 via-amber-500 to-yellow-600 text-white shadow-amber-600/30 hover:brightness-110',
    borderClass: 'border-amber-300/70',
    cardClass: 'bg-white',
    headerClass: 'bg-linear-to-b from-amber-400 via-yellow-600 to-amber-700',
    glowClass: 'shadow-amber-500/30',
    iconWrapClass:
      'bg-linear-to-b from-amber-200 via-amber-400 to-yellow-600 text-white ring-4 ring-white/40',
    preview: 'premium-photo',
  },
};

export function getPlanTheme(planId: string): PlanTheme {
  return PLAN_THEMES[planId] ?? DEFAULT_THEME;
}

export function getPlanPromoBadge(plan: Plan): string | null {
  if (plan.price <= 0 || plan.trial_months <= 0) return null;
  return plan.promo_label ?? (plan.trial_months === 1 ? '1 mes gratis' : `${plan.trial_months} meses gratis`);
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.price === 0) return `0${plan.currency}`;
  const formatted =
    plan.price % 1 === 0 ? String(plan.price) : plan.price.toFixed(2).replace('.', ',');
  return `${formatted}${plan.currency}`;
}
