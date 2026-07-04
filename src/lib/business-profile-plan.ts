export type ProfilePlanTier = 'free' | 'basic' | 'pro' | 'premium';

export type ProfileFieldGroup = 'essential' | 'contact' | 'services' | 'gallery' | 'actions' | 'details';

const GROUP_MIN_TIER: Record<ProfileFieldGroup, ProfilePlanTier> = {
  essential: 'free',
  contact: 'free',
  services: 'free',
  details: 'free',
  gallery: 'free',
  actions: 'basic',
};

export const PROFILE_SERVICE_LIMITS: Record<ProfilePlanTier, number> = {
  free: 4,
  basic: 5,
  pro: 7,
  premium: 12,
};

export const PROFILE_PHOTO_LIMITS: Record<ProfilePlanTier, number> = {
  free: 3,
  basic: 3,
  pro: 6,
  premium: 10,
};

const TIER_RANK: Record<ProfilePlanTier, number> = {
  free: 0,
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
  return 'free';
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
      return 'Free';
  }
}

export function getNextPlanTier(tier: ProfilePlanTier): ProfilePlanTier | null {
  if (tier === 'free') return 'basic';
  if (tier === 'basic') return 'pro';
  if (tier === 'pro') return 'premium';
  return null;
}
