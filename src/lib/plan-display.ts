import type { Plan } from '@/types/domain';

const META_PREFIX = /^Todo lo incluido en/i;

/** Planes legacy que no deben mostrarse en la UI (sustituidos por premium). */
export const DEPRECATED_PLAN_IDS = new Set(['enterprise']);

/** Planes ocultos en la pestaña de plan del dashboard profesional. */
export const PROFESSIONAL_DASHBOARD_HIDDEN_PLAN_IDS = new Set(['basico', 'enterprise']);

export function normalizePlanFeatures(features: string[]): string[] {
  return (features ?? []).map(f => f.trim()).filter(f => f.length > 0 && !META_PREFIX.test(f));
}

export function sortPlansByPrice(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
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
