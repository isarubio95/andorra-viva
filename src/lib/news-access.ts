import { isAfter, subMonths } from 'date-fns';

const PAID_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

/** Plan premium activo/trial. No incluye bypass de admin (igual que la BD). */
export function canPublishNews(
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  return (
    planId === 'premium' &&
    !!subscriptionStatus &&
    PAID_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  );
}

/** Editable solo durante el primer mes tras la publicación. */
export function isNewsPostEditable(createdAt: string, now = new Date()): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return isAfter(created, subMonths(now, 1));
}

export function computeHasPremiumAccess(
  _role: string | null | undefined,
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  return canPublishNews(planId, subscriptionStatus);
}
