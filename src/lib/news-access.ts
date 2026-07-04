const PAID_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export function computeHasPremiumAccess(
  role: string | null | undefined,
  planId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  if (role === 'admin') return true;
  return (
    planId === 'premium' &&
    !!subscriptionStatus &&
    PAID_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  );
}
