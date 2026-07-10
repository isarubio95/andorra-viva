import type { UserRole } from '@/contexts/AuthContext';

export type SignupStep = 'role' | 'plan' | 'form' | 'business';

export function getSignupStepSequence(upgradeFlow: boolean, role: UserRole): SignupStep[] {
  return upgradeFlow
    ? ['plan', 'business']
    : ['role', ...(role === 'professional' ? (['plan'] as const) : []), 'form'];
}

export function resolveSignupStep(params: {
  stepParam: string | null;
  role: UserRole;
  planParam: string | null;
  reviewMode: boolean;
  upgradeFlow: boolean;
}): SignupStep {
  const { stepParam, role, planParam, reviewMode, upgradeFlow } = params;

  if (reviewMode) return 'form';

  if (upgradeFlow) {
    if (stepParam === 'business') return 'business';
    return 'plan';
  }

  const sequence = getSignupStepSequence(false, role);

  if (planParam && !stepParam && role === 'professional') {
    return 'plan';
  }

  if (stepParam && (sequence as string[]).includes(stepParam)) {
    return stepParam as SignupStep;
  }

  if (stepParam === 'plan' && role !== 'professional') {
    return 'form';
  }

  return 'role';
}

export function parseSignupRole(roleParam: string | null): UserRole {
  return roleParam === 'professional' ? 'professional' : 'basic';
}

export function buildSignupSearchParams(
  current: URLSearchParams,
  updates: { step?: SignupStep; role?: UserRole; plan?: string },
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (updates.step !== undefined) next.set('step', updates.step);
  if (updates.role !== undefined) next.set('role', updates.role);
  if (updates.plan !== undefined) next.set('plan', updates.plan);
  return next;
}
