export type ProfilePlanTier = 'basico' | 'basic' | 'pro' | 'premium';

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
  basic: 5,
  pro: 7,
  premium: 12,
};

export const PROFILE_PHOTO_LIMITS: Record<ProfilePlanTier, number> = {
  basico: 3,
  basic: 3,
  pro: 6,
  premium: 10,
};

const TIER_RANK: Record<ProfilePlanTier, number> = {
  basico: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

export function resolveProfilePlanTier(
  planId: string | null | undefined,
  role: string | null | undefined,
): ProfilePlanTier {
  if (role === 'admin') return 'premium';
  if (planId === 'premium') return 'premium';
  if (planId === 'pro') return 'pro';
  if (planId === 'basic') return 'basic';
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
    case 'basic':
      return 'Basic';
    default:
      return 'Básico';
  }
}

export function getNextPlanTier(tier: ProfilePlanTier): ProfilePlanTier | null {
  if (tier === 'basico') return 'basic';
  if (tier === 'basic') return 'pro';
  if (tier === 'pro') return 'premium';
  return null;
}
