export type ProfilePlanTier = 'basico' | 'pro' | 'premium';

export type ProfileFieldGroup = 'essential' | 'contact' | 'services' | 'gallery' | 'actions' | 'details';

const GROUP_MIN_TIER: Record<ProfileFieldGroup, ProfilePlanTier> = {
  essential: 'basico',
  contact: 'basico',
  services: 'basico',
  details: 'basico',
  gallery: 'basico',
  actions: 'pro',
};

export const PROFILE_SERVICE_LIMITS: Record<ProfilePlanTier, number> = {
  basico: 4,
  pro: 7,
  premium: 12,
};

export const PROFILE_PHOTO_LIMITS: Record<ProfilePlanTier, number> = {
  basico: 3,
  pro: 5,
  premium: 7,
};

const TIER_RANK: Record<ProfilePlanTier, number> = {
  basico: 0,
  pro: 1,
  premium: 2,
};

export function resolveProfilePlanTier(
  planId: string | null | undefined,
  role: string | null | undefined,
): ProfilePlanTier {
  if (role === 'admin') return 'premium';
  if (planId === 'premium') return 'premium';
  if (planId === 'pro') return 'pro';
  return 'basico';
}

export function isProfileGroupAvailable(tier: ProfilePlanTier, group: ProfileFieldGroup): boolean {
  return TIER_RANK[tier] >= TIER_RANK[GROUP_MIN_TIER[group]];
}

export function requiredPlanForGroup(group: ProfileFieldGroup): ProfilePlanTier {
  return GROUP_MIN_TIER[group];
}

export function getMaxServicesForTier(tier: ProfilePlanTier): number {
  return PROFILE_SERVICE_LIMITS[tier];
}

export function getMaxPhotosForTier(tier: ProfilePlanTier): number {
  return PROFILE_PHOTO_LIMITS[tier];
}

export function planLabelForTier(tier: ProfilePlanTier): string {
  switch (tier) {
    case 'premium':
      return 'Premium';
    case 'pro':
      return 'Pro';
    default:
      return 'Básico';
  }
}

export function getNextPlanTier(tier: ProfilePlanTier): ProfilePlanTier | null {
  if (tier === 'basico') return 'pro';
  if (tier === 'pro') return 'premium';
  return null;
}
