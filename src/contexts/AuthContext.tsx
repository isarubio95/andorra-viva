import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { mergeAnonymousVisitsForUser } from '@/services/api';
import { computeHasPremiumAccess } from '@/lib/news-access';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'basic' | 'professional' | 'admin';

interface MyAccessPayload {
  role?: string;
  plan_id?: string;
  subscription_status?: string | null;
  has_pro_access?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  role: UserRole | null;
  roleLoading: boolean;
  planId: string | null;
  /** Plan programado tras el fin del periodo (downgrade diferido). */
  pendingPlanId: string | null;
  subscriptionStatus: string | null;
  /** Fin del periodo de facturación actual (renovación automática). */
  currentPeriodEnd: string | null;
  /** True si Stripe cancelará al final del periodo (p. ej. pasar a free). */
  cancelAtPeriodEnd: boolean;
  /** Calculado en BD (`get_my_access`) o fallback en cliente si el RPC no existe. */
  hasProAccess: boolean;
  /** Plan premium activo o rol admin. */
  hasPremiumAccess: boolean;
  /** Tras cambios de plan en BD o checkout, fuerza recarga del perfil. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: '',
  role: null,
  roleLoading: true,
  planId: null,
  pendingPlanId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  hasProAccess: false,
  hasPremiumAccess: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PAID_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

/** Planes sin pago recurrente. */
const NON_PAID_PLAN_IDS = new Set(['free']);

function normalizeRole(value: unknown): UserRole | null {
  if (value === 'admin' || value === 'professional' || value === 'basic') return value;
  return null;
}

function computeHasProAccess(
  role: UserRole | null,
  planId: string | null,
  subscriptionStatus: string | null
): boolean {
  const paidPlan =
    !!planId &&
    !NON_PAID_PLAN_IDS.has(planId) &&
    !!subscriptionStatus &&
    PAID_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  return role === 'professional' || role === 'admin' || paidPlan;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const clearProfile = useCallback(() => {
    setRole(null);
    setPlanId(null);
    setPendingPlanId(null);
    setSubscriptionStatus(null);
    setCurrentPeriodEnd(null);
    setCancelAtPeriodEnd(false);
    setHasProAccess(false);
    setHasPremiumAccess(false);
  }, []);

  const applySubscriptionExtras = useCallback(
    (row: {
      current_period_end?: string | null;
      pending_plan_id?: string | null;
      cancel_at_period_end?: boolean | null;
    } | null) => {
      setCurrentPeriodEnd(row?.current_period_end ?? null);
      setPendingPlanId(row?.pending_plan_id ?? null);
      setCancelAtPeriodEnd(!!row?.cancel_at_period_end);
    },
    [],
  );

  const applyFallbackProfile = useCallback(async (userId: string, metadataRole?: unknown) => {
    const [roleRes, subRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      supabase
        .from('subscriptions')
        .select('plan_id, status, current_period_end, pending_plan_id, cancel_at_period_end')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (roleRes.error) {
      console.warn('[auth] user_roles:', roleRes.error.message);
    }
    if (subRes.error) {
      console.warn('[auth] subscriptions:', subRes.error.message);
    }

    const fromDb = normalizeRole(roleRes.data?.role);
    const nextRole: UserRole =
      fromDb ?? (metadataRole === 'professional' ? 'professional' : 'basic');
    setRole(nextRole);

    const pid = subRes.data?.plan_id ?? null;
    const st = subRes.data?.status ?? null;
    setPlanId(pid);
    setSubscriptionStatus(st);
    applySubscriptionExtras(subRes.data);
    setHasProAccess(computeHasProAccess(nextRole, pid, st));
    setHasPremiumAccess(computeHasPremiumAccess(nextRole, pid, st));
  }, [applySubscriptionExtras]);

  const fetchProfile = useCallback(
    async (userId: string, metadataRole?: unknown) => {
      setRoleLoading(true);

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_access');

      if (
        !rpcError &&
        rpcData &&
        typeof rpcData === 'object' &&
        !Array.isArray(rpcData) &&
        'has_pro_access' in rpcData
      ) {
        const d = rpcData as MyAccessPayload;
        const nextRole = normalizeRole(d.role) ?? 'basic';
        const pid = d.plan_id ?? 'free';
        const st = d.subscription_status ?? null;
        setRole(nextRole);
        setPlanId(pid);
        setSubscriptionStatus(st);
        setHasProAccess(!!d.has_pro_access);
        setHasPremiumAccess(computeHasPremiumAccess(nextRole, pid, st));

        const { data: subRow, error: subError } = await supabase
          .from('subscriptions')
          .select('current_period_end, pending_plan_id, cancel_at_period_end')
          .eq('user_id', userId)
          .maybeSingle();
        if (subError) {
          console.warn('[auth] subscription extras:', subError.message);
          applySubscriptionExtras(null);
        } else {
          applySubscriptionExtras(subRow);
        }

        setRoleLoading(false);
        return;
      }

      if (rpcError) {
        console.warn('[auth] get_my_access fallback:', rpcError.message);
      }

      await applyFallbackProfile(userId, metadataRole);
      setRoleLoading(false);
    },
    [applyFallbackProfile, applySubscriptionExtras]
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id, user.user_metadata?.role);
  }, [user?.id, user?.user_metadata?.role, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          void mergeAnonymousVisitsForUser(session.user.id);
          setTimeout(() => fetchProfile(session.user.id, session.user.user_metadata?.role), 0);
        } else {
          clearProfile();
          setRoleLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        void mergeAnonymousVisitsForUser(session.user.id);
        fetchProfile(session.user.id, session.user.user_metadata?.role);
      } else {
        setRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, clearProfile]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !user?.id) return;
      void fetchProfile(user.id, user.user_metadata?.role);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, user?.user_metadata?.role, fetchProfile]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    '';

  const signOut = async () => {
    await supabase.auth.signOut();
    clearProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        displayName,
        role,
        roleLoading,
        planId,
        pendingPlanId,
        subscriptionStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        hasProAccess,
        hasPremiumAccess,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
