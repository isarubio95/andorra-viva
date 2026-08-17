import { describe, expect, it } from 'vitest';
import {
  canAccessAdvancedMetrics,
  clampDescriptionForTier,
  getMaxDescriptionForTier,
  getMaxPhotosForTier,
  getMaxServicesForTier,
  isProfileGroupAvailable,
  resolveProfilePlanTier,
} from '@/lib/business-profile-plan';

describe('business-profile-plan', () => {
  it('resuelve el plan del perfil', () => {
    expect(resolveProfilePlanTier('free', 'professional')).toBe('free');
    expect(resolveProfilePlanTier('basic', 'professional')).toBe('basic');
    expect(resolveProfilePlanTier('pro', 'professional')).toBe('pro');
    expect(resolveProfilePlanTier('premium', 'professional')).toBe('premium');
    expect(resolveProfilePlanTier('free', 'admin')).toBe('premium');
  });

  it('diferencia fotos y descripción por membresía', () => {
    expect(getMaxPhotosForTier('free')).toBe(1);
    expect(getMaxPhotosForTier('basic')).toBe(3);
    expect(getMaxPhotosForTier('pro')).toBe(6);
    expect(getMaxPhotosForTier('premium')).toBe(10);

    expect(getMaxDescriptionForTier('free')).toBe(160);
    expect(getMaxDescriptionForTier('basic')).toBe(500);
    expect(clampDescriptionForTier('x'.repeat(200), 'free')).toHaveLength(160);
  });

  it('limita servicios y bloquea extras en Free', () => {
    expect(getMaxServicesForTier('free')).toBe(2);
    expect(getMaxServicesForTier('basic')).toBe(5);

    expect(isProfileGroupAvailable('free', 'gallery')).toBe(true);
    expect(isProfileGroupAvailable('free', 'services')).toBe(true);
    expect(isProfileGroupAvailable('free', 'contact')).toBe(false);
    expect(isProfileGroupAvailable('free', 'details')).toBe(false);
    expect(isProfileGroupAvailable('free', 'actions')).toBe(false);
    expect(isProfileGroupAvailable('basic', 'contact')).toBe(true);
    expect(isProfileGroupAvailable('basic', 'social')).toBe(false);
    expect(isProfileGroupAvailable('pro', 'social')).toBe(true);
    expect(isProfileGroupAvailable('premium', 'locations')).toBe(true);
  });

  it('reserva métricas avanzadas a Pro y Premium', () => {
    expect(canAccessAdvancedMetrics('free')).toBe(false);
    expect(canAccessAdvancedMetrics('basic')).toBe(false);
    expect(canAccessAdvancedMetrics('pro')).toBe(true);
    expect(canAccessAdvancedMetrics('premium')).toBe(true);
  });
});
