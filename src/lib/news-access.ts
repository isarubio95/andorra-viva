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

export function computeHasPremiumAccess(
  _role: string | null | undefined,
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  return canPublishNews(planId, subscriptionStatus);
}
