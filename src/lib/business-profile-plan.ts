export type ProfilePlanTier = 'free' | 'basic' | 'pro' | 'premium';

export type ProfileFieldGroup =
  | 'essential'
  | 'contact'
  | 'services'
  | 'gallery'
  | 'actions'
  | 'details'
  | 'social'
  | 'locations';

const GROUP_MIN_TIER: Record<ProfileFieldGroup, ProfilePlanTier> = {
  essential: 'free',
  gallery: 'free',
  services: 'free',
  contact: 'basic',
  details: 'basic',
  actions: 'basic',
  social: 'pro',
  locations: 'premium',
};

export const PROFILE_SERVICE_LIMITS: Record<ProfilePlanTier, number> = {
  free: 2,
  basic: 5,
  pro: 7,
  premium: 12,
};

export const PROFILE_PHOTO_LIMITS: Record<ProfilePlanTier, number> = {
  free: 1,
  basic: 3,
  pro: 6,
  premium: 10,
};

export const PROFILE_DESCRIPTION_LIMITS: Record<ProfilePlanTier, number> = {
  free: 160,
  basic: 500,
  pro: 500,
  premium: 500,
};

/** Días de gracia para elegir fotos/servicios tras un downgrade (SQL: interval '7 days'). */
export const CONTENT_TRIM_GRACE_DAYS = 7;

/** Máximo de ubicaciones (principal + sucursales). Solo Premium permite 2. */
export const PROFILE_LOCATION_LIMITS: Record<ProfilePlanTier, number> = {
  free: 1,
  basic: 1,
  pro: 1,
  premium: 2,
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

export function isPlanAtLeast(tier: ProfilePlanTier, minimum: ProfilePlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minimum];
}

export function isProfileGroupAvailable(tier: ProfilePlanTier, group: ProfileFieldGroup): boolean {
  return isPlanAtLeast(tier, GROUP_MIN_TIER[group]);
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

export function getMaxLocationsForTier(tier: ProfilePlanTier): number {
  return PROFILE_LOCATION_LIMITS[tier];
}

export function getMaxDescriptionForTier(tier: ProfilePlanTier): number {
  return PROFILE_DESCRIPTION_LIMITS[tier];
}

export function canAccessAdvancedMetrics(tier: ProfilePlanTier): boolean {
  return isPlanAtLeast(tier, 'pro');
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

export function clampDescriptionForTier(text: string, tier: ProfilePlanTier): string {
  return text.trim().slice(0, getMaxDescriptionForTier(tier));
}
