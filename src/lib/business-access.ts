import type { Business } from '@/types/domain';

/** El usuario autenticado es el titular registrado del negocio. */
export function isOwnBusiness(
  userId: string | null | undefined,
  business: Pick<Business, 'owner_id'>
): boolean {
  if (!userId || !business.owner_id) return false;
  return business.owner_id === userId;
}
