import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Store, Settings, ChevronRight, BarChart3, Medal, Copy, QrCode, Download, Lock, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import {
  getMyBusinesses,
  getPlans,
  getMyBusinessMetrics,
  downgradeToPersonal,
  setMySubscriptionPlan,
  deleteMyBusiness,
  type BusinessMetricRow,
} from '@/services/api';
import { createStripeCheckoutSession } from '@/services/admin-api';
import type { Business, Plan } from '@/types/domain';
import BusinessCard from '@/components/BusinessCard';
import BusinessMetricsPanel from '@/components/BusinessMetricsPanel';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import NewsPublisherPanel from '@/components/NewsPublisherPanel';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { getPlanTheme, sortPlansByPrice, DASHBOARD_HIDDEN_PLAN_IDS, getPlanRenewalDaysLabel } from '@/lib/plan-display';
import {
  DEFAULT_METRICS_PERIOD_ID,
  getMetricsPeriodDays,
  type MetricsPeriodId,
} from '@/lib/metrics-period';
import { buildPublicUrl } from '@/lib/site-url';
import {
  isCurrentAccountDashboardTab,
  isProOnlyAccountDashboardTab,
  isPlanProAccountDashboardTab,
  navigateAccountDashboardTab,
  parseAccountDashboardTab,
} from '@/lib/account-dashboard';
import ContentTrimWizard, { contentTrimDaysRemaining } from '@/components/ContentTrimWizard';
import {
  canAccessAdvancedMetrics,
  getMaxPhotosForTier,
  getMaxServicesForTier,
  resolveProfilePlanTier,
} from '@/lib/business-profile-plan';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FREE_PLAN_IDS = new Set(['free']);
const STRIPE_CHECKOUT_PLAN_IDS = new Set(['basic', 'pro', 'premium']);

const PLAN_RANK: Record<string, number> = {
  free: 0,
  basico: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

function isPlanDowngrade(fromPlanId: string | null | undefined, toPlanId: string): boolean {
  if (!fromPlanId) return false;
  return (PLAN_RANK[fromPlanId] ?? 0) > (PLAN_RANK[toPlanId] ?? 0);
}

export default function UserDashboard() {
  const {
    user,
    displayName,
    role,
    signOut,
    hasProAccess,
    planId,
    pendingPlanId,
    refreshProfile,
    subscriptionStatus,
    currentPeriodEnd,
    contentTrimDueAt,
    loading: authLoading,
    roleLoading,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const planTier = resolveProfilePlanTier(planId, role);
  const canViewMetrics = canAccessAdvancedMetrics(planTier);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [myBusinessesLoading, setMyBusinessesLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [downgradeConfirmOpen, setDowngradeConfirmOpen] = useState(false);
  const [downgradeTargetPlanId, setDowngradeTargetPlanId] = useState<string | null>(null);
  const [downgradeAccountOpen, setDowngradeAccountOpen] = useState(false);
  const [downgradingAccount, setDowngradingAccount] = useState(false);
  const [trimWizardOpen, setTrimWizardOpen] = useState(false);
  const [changingRecommendedId, setChangingRecommendedId] = useState<string | null>(null);
  const [deleteBusinessId, setDeleteBusinessId] = useState<string | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState(false);
  const [metrics, setMetrics] = useState<BusinessMetricRow[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsPeriodId, setMetricsPeriodId] = useState<MetricsPeriodId>(DEFAULT_METRICS_PERIOD_ID);

  const mainTab = useMemo(
    () => parseAccountDashboardTab(searchParams.get('tab')),
    [searchParams],
  );
  const lastTabNavigationRef = useRef<string | null>(null);

  const handleMainTabChange = (value: string) => {
    const tab = parseAccountDashboardTab(value);
    // Radix Tabs (activación automática) dispara onValueChange dos veces por clic
    // (foco + pulsación). Comparamos contra la URL en vivo —que history.push actualiza
    // de forma síncrona— y contra una ref para no empujar entradas duplicadas al historial.
    if (lastTabNavigationRef.current === tab) return;
    if (isCurrentAccountDashboardTab(window.location.pathname, window.location.search, tab)) {
      return;
    }
    lastTabNavigationRef.current = tab;
    navigateAccountDashboardTab(navigate, tab);
  };

  useEffect(() => {
    lastTabNavigationRef.current = null;
  }, [mainTab]);

  useEffect(() => {
    if (location.pathname !== '/mi-cuenta') return;

    const stateTab = (location.state as { tab?: string } | null)?.tab;
    if (!stateTab) return;

    const queryTab = searchParams.get('tab');

    if (!queryTab) {
      navigateAccountDashboardTab(navigate, parseAccountDashboardTab(stateTab), { replace: true });
      return;
    }

    navigate(
      { pathname: '/mi-cuenta', search: location.search },
      { replace: true, state: null },
    );
  }, [location.pathname, location.search, location.state, navigate, searchParams]);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (hasProAccess || !isProOnlyAccountDashboardTab(mainTab)) return;
    navigateAccountDashboardTab(navigate, 'perfil', { replace: true });
  }, [authLoading, roleLoading, hasProAccess, mainTab, navigate]);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!isPlanProAccountDashboardTab(mainTab) || canViewMetrics) return;
    navigateAccountDashboardTab(navigate, hasProAccess ? 'negocios' : 'perfil', { replace: true });
  }, [authLoading, roleLoading, mainTab, canViewMetrics, hasProAccess, navigate]);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<Date | null>(null);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [showEmailChangePassword, setShowEmailChangePassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const checkoutFeedbackHandled = useRef(false);
  const emailUpdatedFeedbackHandled = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (!checkout || !user?.id || checkoutFeedbackHandled.current) return;
    checkoutFeedbackHandled.current = true;

    const cleanUrl = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      navigate(
        { pathname: '/mi-cuenta', search: next.toString() ? `?${next.toString()}` : '' },
        { replace: true },
      );
    };

    void (async () => {
      if (checkout === 'success') {
        await refreshProfile();
        toast({
          title: 'Pago confirmado',
          description: 'Tu plan se ha actualizado correctamente.',
        });
      } else if (checkout === 'cancel') {
        toast({
          title: 'Pago cancelado',
          description: 'No se ha aplicado ningún cambio de plan.',
        });
      }
      cleanUrl();
    })();
  }, [searchParams, user?.id, refreshProfile, navigate, toast]);

  useEffect(() => {
    if (searchParams.get('email_updated') !== '1' || emailUpdatedFeedbackHandled.current) return;
    emailUpdatedFeedbackHandled.current = true;

    toast({
      title: 'Correo actualizado',
      description: 'Tu dirección de correo se ha confirmado correctamente.',
    });

    const next = new URLSearchParams(searchParams);
    next.delete('email_updated');
    navigate(
      { pathname: '/mi-cuenta', search: next.toString() ? `?${next.toString()}` : '' },
      { replace: true },
    );
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    setPlansLoading(true);
    getPlans()
      .then(setPlans)
      .finally(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id || !hasProAccess) {
      setMyBusinesses([]);
      return;
    }
    setMyBusinessesLoading(true);
    getMyBusinesses(user.id)
      .then(setMyBusinesses)
      .finally(() => setMyBusinessesLoading(false));
  }, [user?.id, hasProAccess]);

  useEffect(() => {
    if (!user?.id || !hasProAccess || !canViewMetrics) {
      setMetrics([]);
      return;
    }
    setMetricsLoading(true);
    getMyBusinessMetrics(getMetricsPeriodDays(metricsPeriodId))
      .then(setMetrics)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        toast({
          title: 'No se pudieron cargar las métricas',
          description: message,
          variant: 'destructive',
        });
      })
      .finally(() => setMetricsLoading(false));
  }, [user?.id, hasProAccess, canViewMetrics, metricsPeriodId, toast]);

  const isPro = hasProAccess;
  const isProfessionalRole = role === 'professional';
  const isOnPaidPlan = !!planId && !FREE_PLAN_IDS.has(planId);
  const dashboardPlans = plans.filter(p => !DASHBOARD_HIDDEN_PLAN_IDS.has(p.id));
  const freePlanName = plans.find(p => p.id === 'free')?.name ?? 'Free';
  const currentPlanName = plans.find(p => p.id === planId)?.name ?? planId ?? '—';
  const pendingPlanName =
    plans.find(p => p.id === pendingPlanId)?.name ?? pendingPlanId ?? null;
  const planRenewalLabel = getPlanRenewalDaysLabel(currentPeriodEnd, {
    planId,
    planName: currentPlanName,
    pendingPlanId,
    pendingPlanName,
    subscriptionStatus,
  });
  const downgradeTargetPlanName =
    plans.find(p => p.id === downgradeTargetPlanId)?.name ?? downgradeTargetPlanId ?? '—';
  const periodEndLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const canManageRecommendation =
    role === 'admin' || (planId === 'premium' && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing'));
  const accountLabel =
    role === 'admin' ? 'Admin' : isPro ? 'Profesional' : 'Usuario';
  const tabTriggerClass = cn(
    'shrink-0 rounded-full border border-border bg-background px-4 py-2 shadow-sm',
    'data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none',
  );
  const currentRecommendedId = myBusinesses.find(b => b.is_recommended)?.id ?? null;
  const myBusiness = myBusinesses[0] ?? null;
  const maxPhotos = getMaxPhotosForTier(planTier);
  const maxServices = getMaxServicesForTier(planTier);
  const trimPhotoUrls = useMemo(() => {
    if (!myBusiness) return [];
    if (myBusiness.gallery?.length) return myBusiness.gallery;
    return myBusiness.image_url ? [myBusiness.image_url] : [];
  }, [myBusiness]);
  const needsContentTrim =
    !!contentTrimDueAt &&
    !!myBusiness &&
    (trimPhotoUrls.length > maxPhotos || (myBusiness.services?.length ?? 0) > maxServices);
  const trimDaysLeft = contentTrimDaysRemaining(contentTrimDueAt);
  const businessToDelete = deleteBusinessId
    ? myBusinesses.find(b => b.id === deleteBusinessId) ?? null
    : null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) {
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil actualizado correctamente' });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Sesión cerrada' });
    navigate('/');
  };

  const hasPasswordAuth = user?.identities?.some(identity => identity.provider === 'email') ?? false;
  const pendingNewEmail = user?.new_email ?? null;

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
  };

  const resetEmailForm = () => {
    setNewEmail('');
    setEmailChangePassword('');
    setShowEmailChangePassword(false);
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const trimmedEmail = newEmail.trim().toLowerCase();
    const currentEmail = user.email.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({
        title: 'Correo no válido',
        description: 'Introduce una dirección de correo electrónico correcta.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedEmail === currentEmail) {
      toast({
        title: 'Mismo correo',
        description: 'El nuevo correo debe ser distinto al actual.',
        variant: 'destructive',
      });
      return;
    }

    if (pendingNewEmail && trimmedEmail === pendingNewEmail.toLowerCase()) {
      toast({
        title: 'Cambio ya solicitado',
        description: `Revisa la bandeja de ${pendingNewEmail} para confirmar el cambio.`,
      });
      return;
    }

    setChangingEmail(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: emailChangePassword,
    });

    if (verifyError) {
      toast({
        title: 'Contraseña incorrecta',
        description: 'Comprueba la contraseña e inténtalo de nuevo.',
        variant: 'destructive',
      });
      setChangingEmail(false);
      return;
    }

    const emailRedirectTo = `${window.location.origin}/mi-cuenta?tab=seguridad&email_updated=1`;
    const { error: updateError } = await supabase.auth.updateUser(
      { email: trimmedEmail },
      { emailRedirectTo },
    );

    if (updateError) {
      const alreadyRegistered =
        /already|registered|exists|en uso|already been/i.test(updateError.message);
      toast({
        title: 'No se pudo cambiar el correo',
        description: alreadyRegistered
          ? 'Ese correo ya está asociado a otra cuenta.'
          : updateError.message,
        variant: 'destructive',
      });
    } else {
      resetEmailForm();
      setChangeEmailOpen(false);
      toast({
        title: 'Confirma tu nuevo correo',
        description: `Te hemos enviado un enlace a ${trimmedEmail}. El cambio no será efectivo hasta que lo confirmes.`,
      });
    }

    setChangingEmail(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Verifica que la nueva contraseña y su confirmación sean iguales.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Contraseña muy corta',
        description: 'La nueva contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword === currentPassword) {
      toast({
        title: 'Contraseña igual a la actual',
        description: 'Elige una contraseña distinta a la que usas ahora.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      toast({
        title: 'Contraseña actual incorrecta',
        description: 'Comprueba la contraseña e inténtalo de nuevo.',
        variant: 'destructive',
      });
      setChangingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      toast({
        title: 'No se pudo cambiar la contraseña',
        description: updateError.message,
        variant: 'destructive',
      });
    } else {
      setPasswordUpdatedAt(new Date());
      resetPasswordForm();
      setChangePasswordOpen(false);
      toast({ title: 'Contraseña actualizada correctamente' });
    }

    setChangingPassword(false);
  };

  const refreshMyBusinesses = async () => {
    if (!user?.id || !hasProAccess) return;
    setMyBusinessesLoading(true);
    const rows = await getMyBusinesses(user.id);
    setMyBusinesses(rows);
    setMyBusinessesLoading(false);
  };

  const handleDeleteBusiness = async () => {
    if (!deleteBusinessId) return;
    setDeletingBusiness(true);
    const result = await deleteMyBusiness(deleteBusinessId);
    if (!result.ok) {
      toast({
        title: 'No se pudo eliminar el negocio',
        description: result.error ?? 'Error desconocido',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Negocio eliminado',
        description: 'Ya no aparecerá en el directorio.',
      });
      setDeleteBusinessId(null);
      await refreshMyBusinesses();
      if (user?.id && hasProAccess && canViewMetrics) {
        setMetricsLoading(true);
        getMyBusinessMetrics(getMetricsPeriodDays(metricsPeriodId))
          .then(setMetrics)
          .finally(() => setMetricsLoading(false));
      }
    }
    setDeletingBusiness(false);
  };

  const getReviewUrl = (businessId: string): string => {
    return buildPublicUrl(`/valorar/${businessId}`);
  };

  const handleCopyReviewUrl = async (businessId: string) => {
    const url = getReviewUrl(businessId);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: 'Ya puedes pegarlo en tu QR o material impreso.' });
    } catch {
      toast({
        title: 'No se pudo copiar automáticamente',
        description: `Copia este enlace manualmente: ${url}`,
      });
    }
  };

  const handleDownloadReviewQr = async (business: Business) => {
    const url = getReviewUrl(business.id);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 768,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      const a = document.createElement('a');
      const safeName = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.href = dataUrl;
      a.download = `qr-valorar-${safeName || business.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: 'QR descargado', description: 'PNG listo para imprimir.' });
    } catch (error) {
      console.error('Error generating QR image:', error);
      toast({ title: 'No se pudo generar el QR', variant: 'destructive' });
    }
  };

  const handleChangePlan = async (nextPlanId: string) => {
    if (!user?.id) return;
    if (nextPlanId === planId && !pendingPlanId) return;
    if (nextPlanId === pendingPlanId) return;
    setChangingPlan(true);

    const currentRank = PLAN_RANK[planId ?? 'free'] ?? 0;
    const nextRank = PLAN_RANK[nextPlanId] ?? 0;
    const isDowngrade = nextRank < currentRank;
    const isUpgradeToPaid =
      STRIPE_CHECKOUT_PLAN_IDS.has(nextPlanId) && nextRank > currentRank;
    const isPaidDowngrade =
      isOnPaidPlan && (STRIPE_CHECKOUT_PLAN_IDS.has(nextPlanId) || FREE_PLAN_IDS.has(nextPlanId)) && isDowngrade;

    if (isUpgradeToPaid || isPaidDowngrade) {
      const checkout = await createStripeCheckoutSession(nextPlanId);
      if (checkout.error && !checkout.localOnly) {
        toast({
          title: isDowngrade ? 'No se pudo programar el cambio' : 'No se pudo iniciar el pago',
          description: checkout.error,
          variant: 'destructive',
        });
        setChangingPlan(false);
        return;
      }
      if (checkout.updated) {
        const planLabel = plans.find(p => p.id === nextPlanId)?.name ?? nextPlanId;
        if (checkout.scheduled) {
          const when = checkout.currentPeriodEnd
            ? new Date(checkout.currentPeriodEnd).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : periodEndLabel;
          toast({
            title: 'Cambio programado',
            description: when
              ? `Mantienes ${currentPlanName} hasta el ${when}. Después pasarás a ${planLabel}.`
              : `Mantienes tu plan actual hasta el final del periodo. Después pasarás a ${planLabel}.`,
          });
        } else {
          toast({
            title: 'Plan actualizado',
            description: `Nuevo plan: ${planLabel}`,
          });
        }
        await refreshProfile();
        setChangingPlan(false);
        return;
      }
      if (checkout.url) {
        window.location.href = checkout.url;
        setChangingPlan(false);
        return;
      }
      // localOnly u otro caso: caer al update local de BD
    }

    const result = await setMySubscriptionPlan(nextPlanId);

    if (!result.ok) {
      toast({
        title: 'No se pudo cambiar el plan',
        description: result.error ?? 'Error desconocido',
        variant: 'destructive',
      });
    } else {
      const planLabel = plans.find(p => p.id === nextPlanId)?.name ?? nextPlanId;
      toast({
        title: 'Plan actualizado',
        description: FREE_PLAN_IDS.has(nextPlanId)
          ? `Ahora tienes el plan ${planLabel}.`
          : `Nuevo plan: ${planLabel}`,
      });
      await refreshProfile();
    }
    setChangingPlan(false);
  };

  const openDowngradeConfirm = (targetPlanId: string) => {
    setDowngradeTargetPlanId(targetPlanId);
    setDowngradeConfirmOpen(true);
  };

  const handleConfirmDowngrade = async () => {
    if (!downgradeTargetPlanId) return;
    const targetPlanId = downgradeTargetPlanId;
    setDowngradeConfirmOpen(false);
    setDowngradeTargetPlanId(null);
    await handleChangePlan(targetPlanId);
  };

  const handleDowngradeToPersonal = async () => {
    if (!user?.id) return;
    setDowngradingAccount(true);
    const result = await downgradeToPersonal();
    if (!result.ok) {
      toast({
        title: 'No se pudo cambiar el tipo de cuenta',
        description: result.error ?? 'Error desconocido',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cuenta actualizada',
        description: 'Tu cuenta es ahora personal. Tus negocios siguen publicados.',
      });
      await refreshProfile();
      navigateAccountDashboardTab(navigate, 'perfil', { replace: true });
    }
    setDowngradingAccount(false);
    setDowngradeAccountOpen(false);
  };

  const handleToggleRecommended = async (businessId: string, checked: boolean) => {
    if (!user?.id) return;
    if (!canManageRecommendation) {
      toast({
        title: 'Plan Premium requerido',
        description: 'Solo el plan Premium permite destacar un negocio y mostrar la insignia Premium.',
        variant: 'destructive',
      });
      return;
    }

    setChangingRecommendedId(businessId);

    if (checked) {
      const { error: unsetError } = await supabase
        .from('businesses')
        .update({ is_recommended: false })
        .eq('owner_id', user.id)
        .eq('is_recommended', true);
      if (unsetError) {
        toast({ title: 'No se pudo actualizar', description: unsetError.message, variant: 'destructive' });
        setChangingRecommendedId(null);
        return;
      }
    }

    const { error } = await supabase
      .from('businesses')
      .update({ is_recommended: checked })
      .eq('id', businessId)
      .eq('owner_id', user.id);

    if (error) {
      toast({ title: 'No se pudo guardar', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: checked ? 'Negocio recomendado activado' : 'Negocio recomendado desactivado',
        description: checked ? 'Este negocio aparecerá en "Nuestras recomendaciones".' : 'Ya no aparecerá como recomendado.',
      });
      await refreshMyBusinesses();
    }
    setChangingRecommendedId(null);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Profile Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {needsContentTrim && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                Ajusta las fotos y servicios de tu negocio al plan {currentPlanName}
              </p>
              <p className="mt-1 text-muted-foreground">
                {trimDaysLeft == null
                  ? 'Elige qué conservar; el resto se eliminará.'
                  : trimDaysLeft <= 0
                    ? 'Hoy se aplicará el recorte automático si no eliges.'
                    : `Te quedan ${trimDaysLeft} día${trimDaysLeft === 1 ? '' : 's'} para elegir qué conservar.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => setTrimWizardOpen(true)}>
                  Elegir ahora
                </Button>
                {myBusiness && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/mi-cuenta/negocios/${myBusiness.id}`)}
                  >
                    Ir al editor
                  </Button>
                )}
              </div>
            </div>
          )}

          <Tabs value={mainTab} onValueChange={handleMainTabChange} className="space-y-6">
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="perfil" className={tabTriggerClass}>Perfil</TabsTrigger>
              {isPro && (
                <>
                  <TabsTrigger value="negocios" className={tabTriggerClass}>Mi Negocio</TabsTrigger>
                  {canViewMetrics && (
                    <TabsTrigger value="metricas" className={tabTriggerClass}>Métricas</TabsTrigger>
                  )}
                  <TabsTrigger value="plan" className={tabTriggerClass}>Planes</TabsTrigger>
                </>
              )}
              <TabsTrigger value="seguridad" className={tabTriggerClass}>Seguridad</TabsTrigger>
              <TabsTrigger value="noticias" className={tabTriggerClass}>Noticias</TabsTrigger>
            </TabsList>

            {/* Perfil Tab */}
            <TabsContent value="perfil">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>Actualiza tu información de perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-display">Correo electrónico</Label>
                      <Input id="email-display" value={user.email || ''} disabled />
                      {pendingNewEmail ? (
                        <p className="text-xs text-muted-foreground">
                          Pendiente de confirmar:{' '}
                          <span className="font-medium text-foreground">{pendingNewEmail}</span>. Revisa
                          tu bandeja de entrada.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Para cambiarlo, ve a la pestaña Seguridad.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de cuenta</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="border-transparent bg-muted font-medium text-muted-foreground shadow-none"
                        >
                          {accountLabel}
                        </Badge>
                        {planId && !FREE_PLAN_IDS.has(planId) && (
                          <span className="text-xs text-muted-foreground">
                            Plan: <span className="font-medium text-foreground">{currentPlanName}</span>
                          </span>
                        )}
                      </div>
                      {isProfessionalRole && (
                        <p className="text-xs text-muted-foreground">
                          <button
                            type="button"
                            disabled={downgradingAccount}
                            onClick={() => setDowngradeAccountOpen(true)}
                            className="underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
                          >
                            Cambiar a cuenta personal
                          </button>
                        </p>
                      )}
                      {!isPro && (
                        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                              <Store className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">¿Tienes un negocio?</p>
                              <p className="text-xs text-muted-foreground">
                                Pasa a cuenta profesional para registrar negocios y ver métricas.
                              </p>
                            </div>
                          </div>
                          <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
                            <Link to="/signup?mode=upgrade">
                              Actualiza tu cuenta
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Guardando…' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional: Mi Negocio Tab */}
            {isPro && (
              <TabsContent value="negocios">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Mi Negocio
                    </CardTitle>
                    <CardDescription>Gestiona el negocio de tu plan (un negocio por suscripción)</CardDescription>
                  </CardHeader>
                  <CardContent className="w-full">
                    {myBusinessesLoading ? (
                      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="mx-auto w-full max-w-sm shrink-0 overflow-hidden rounded-xl border bg-card lg:mx-0">
                          <Skeleton className="aspect-4/3 w-full rounded-none" />
                          <div className="space-y-2 p-4">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                        <div className="mx-auto w-full max-w-sm shrink-0 space-y-3 lg:mx-0">
                          <Skeleton className="h-12 w-full rounded-lg" />
                          <Skeleton className="h-40 w-full rounded-lg" />
                        </div>
                      </div>
                    ) : myBusiness ? (
                      <div className="w-full space-y-4">
                        <div className="w-full rounded-lg border border-border p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Distintivo recomendado</p>
                          <p>Requiere plan Premium activo o en prueba.</p>
                        </div>
                        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="mx-auto w-full max-w-sm shrink-0 space-y-3 lg:mx-0">
                            <BusinessCard
                              business={myBusiness}
                              onClick={() => navigate(`/mi-cuenta/negocios/${myBusiness.id}`)}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="min-w-0 flex-1 gap-1.5"
                                onClick={() => navigate(`/mi-cuenta/negocios/${myBusiness.id}`)}
                              >
                                <Pencil className="h-4 w-4 shrink-0" />
                                Editar negocio
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteBusinessId(myBusiness.id)}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                                Eliminar negocio
                              </Button>
                            </div>
                          </div>
                          <div className="mx-auto w-full max-w-sm shrink-0 space-y-3 lg:mx-0">
                            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <Medal className="h-4 w-4 text-premium" />
                                <span className="font-medium text-foreground">Recomendado</span>
                                {planId !== 'premium' && role !== 'admin' && (
                                  <button
                                    type="button"
                                    className="text-xs font-normal text-primary hover:underline cursor-pointer"
                                    onClick={() => navigateAccountDashboardTab(navigate, 'plan')}
                                  >
                                    (solo plan premium)
                                  </button>
                                )}
                                {currentRecommendedId === myBusiness.id && (
                                  <Badge variant="secondary">Activo</Badge>
                                )}
                              </div>
                              <Switch
                                checked={myBusiness.is_recommended}
                                disabled={
                                  !!changingRecommendedId ||
                                  !canManageRecommendation ||
                                  (!!currentRecommendedId && currentRecommendedId !== myBusiness.id && !myBusiness.is_recommended)
                                }
                                onCheckedChange={(checked) => handleToggleRecommended(myBusiness.id, checked)}
                                aria-label={`Marcar ${myBusiness.name} como recomendado`}
                              />
                            </div>
                            <div className="rounded-lg border border-border p-3">
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                                <QrCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0">QR de valoraciones</span>
                              </div>
                              <p className="mb-3 max-w-full break-all rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                                {getReviewUrl(myBusiness.id)}
                              </p>
                              <div className="flex flex-col gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full min-w-0 cursor-pointer justify-center"
                                  onClick={() => handleCopyReviewUrl(myBusiness.id)}
                                >
                                  <Copy className="mr-2 h-4 w-4 shrink-0" />
                                  Copiar enlace
                                </Button>
                                <Button
                                  type="button"
                                  className="w-full min-w-0 cursor-pointer justify-center"
                                  onClick={() => handleDownloadReviewQr(myBusiness)}
                                >
                                  <Download className="mr-2 h-4 w-4 shrink-0" />
                                  Descargar QR
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!canManageRecommendation && (
                          <p className="text-xs text-muted-foreground">
                            Para la insignia Premium visible en el directorio necesitas plan Premium con estado activo o en prueba.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex w-full flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No tienes un negocio registrado</p>
                          <p className="text-sm text-muted-foreground">Registra tu negocio para aparecer en el directorio</p>
                        </div>
                        <Button onClick={() => navigate('/registrar-negocio')}>
                          <Store className="mr-2 h-4 w-4" />
                          Registrar Negocio
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Professional: Métricas Tab */}
            {isPro && canViewMetrics && (
              <TabsContent value="metricas">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Métricas
                    </CardTitle>
                    <CardDescription>
                      Visitas, valoraciones y clics de contacto — elige el periodo que quieras analizar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BusinessMetricsPanel
                      metrics={metrics}
                      loading={metricsLoading}
                      periodId={metricsPeriodId}
                      onPeriodChange={setMetricsPeriodId}
                      hasBusinesses={myBusinesses.length > 0}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Professional: Plan Tab */}
            {isPro && (
              <TabsContent value="plan">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Tu Plan
                    </CardTitle>
                    <CardDescription>
                      Cambia tu plan profesional cuando lo necesites.
                    </CardDescription>
                    {planRenewalLabel ? (
                      <Badge variant="secondary" className="mt-1 w-fit font-normal">
                        {planRenewalLabel}
                      </Badge>
                    ) : null}
                  </CardHeader>
                  <CardContent className="overflow-visible">
                    {plansLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="relative flex h-full min-h-0 flex-col rounded-2xl border-2 p-6">
                            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                            <Skeleton className="mx-auto mt-3 h-6 w-24" />
                            <Skeleton className="mx-auto mt-2 h-8 w-20" />
                            <div className="mt-6 min-h-0 flex-1 space-y-2">
                              <Skeleton className="h-3 w-5/6" />
                              <Skeleton className="h-3 w-4/6" />
                              <Skeleton className="h-3 w-3/6" />
                            </div>
                            <div className="mt-6 shrink-0">
                              <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <PlanComparisonGrid
                        comparePlans={dashboardPlans}
                        columns={sortPlansByPrice(dashboardPlans).map(plan => {
                          const isFreePlan = FREE_PLAN_IDS.has(plan.id);
                          const isCurrentFree = !!planId && FREE_PLAN_IDS.has(planId);
                          const selected = isFreePlan ? isCurrentFree : planId === plan.id;
                          const isPendingTarget = pendingPlanId === plan.id;
                          const isDowngradeTarget = isPlanDowngrade(planId, plan.id);
                          const theme = getPlanTheme(plan.id);
                          return {
                            plan,
                            selected,
                            disabled: changingPlan || isPendingTarget,
                            onSelect: () => {
                              if (selected || isPendingTarget) return;
                              if (isDowngradeTarget) {
                                openDowngradeConfirm(plan.id);
                                return;
                              }
                              void handleChangePlan(plan.id);
                            },
                            topBadge: selected ? (
                              <Badge className="border-0">Actual</Badge>
                            ) : isPendingTarget ? (
                              <Badge variant="secondary" className="border-0 font-normal">
                                Desde renovación
                              </Badge>
                            ) : undefined,
                            showPopularBadge: !selected && !isPendingTarget,
                            action: (
                              <div
                                className={cn(
                                  buttonVariants({
                                    variant:
                                      selected || isDowngradeTarget || isPendingTarget
                                        ? 'outline'
                                        : 'default',
                                    className: cn(
                                      'w-full rounded-full pointer-events-none select-none',
                                      !selected &&
                                        !isDowngradeTarget &&
                                        !isPendingTarget &&
                                        theme.buttonClass,
                                    ),
                                  }),
                                  (changingPlan || selected || isPendingTarget) && 'opacity-50',
                                )}
                              >
                                {selected
                                  ? 'Plan actual'
                                  : isPendingTarget
                                    ? 'Programado'
                                    : changingPlan
                                      ? 'Cambiando…'
                                      : isFreePlan
                                        ? 'Cambiar a plan gratuito'
                                        : `Elegir ${plan.name}`}
                              </div>
                            ),
                          };
                        })}
                      />
                    )}

                    {isOnPaidPlan && !plansLoading && !dashboardPlans.some(p => FREE_PLAN_IDS.has(p.id)) && (
                      <div className="mt-6 border-t border-border/50 pt-4 text-center">
                        <button
                          type="button"
                          disabled={changingPlan || pendingPlanId === 'free'}
                          onClick={() => openDowngradeConfirm('free')}
                          className="cursor-pointer text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-50"
                        >
                          {pendingPlanId === 'free'
                            ? `Plan gratuito programado${periodEndLabel ? ` para el ${periodEndLabel}` : ''}`
                            : `Cambiar al plan ${freePlanName} (gratuito)`}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <AlertDialog
                  open={downgradeConfirmOpen}
                  onOpenChange={open => {
                    setDowngradeConfirmOpen(open);
                    if (!open) setDowngradeTargetPlanId(null);
                  }}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cambiar al plan {downgradeTargetPlanName}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {periodEndLabel ? (
                          <>
                            Seguirás con el plan {currentPlanName} hasta el {periodEndLabel} (fin del periodo
                            ya pagado). A partir de entonces pasarás a {downgradeTargetPlanName}
                            {downgradeTargetPlanId === 'pro'
                              ? ' y dejarás las funciones exclusivas de Premium.'
                              : downgradeTargetPlanId === 'basic'
                                ? ' y dejarás las funciones de Pro o Premium.'
                                : ' y dejarás las funciones de pago.'}{' '}
                            Tu cuenta profesional y tus negocios registrados se mantienen.
                          </>
                        ) : downgradeTargetPlanId === 'pro' ? (
                          <>
                            Dejarás de tener las funciones exclusivas de Premium (insignia Premium, negocio
                            recomendado, etc.). Tu cuenta profesional y tus negocios registrados se mantienen.
                          </>
                        ) : downgradeTargetPlanId === 'basic' ? (
                          <>
                            Dejarás de tener las funciones de Pro o Premium. Tu cuenta profesional y tus negocios
                            registrados se mantienen.
                          </>
                        ) : (
                          <>
                            Dejarás de tener las funciones de pago (estadísticas avanzadas, insignia Premium,
                            etc.). Tu cuenta profesional y tus negocios registrados se mantienen.
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={changingPlan}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={changingPlan}
                        className="bg-muted text-muted-foreground hover:bg-muted/80"
                        onClick={e => {
                          e.preventDefault();
                          void handleConfirmDowngrade();
                        }}
                      >
                        {changingPlan
                          ? 'Cambiando…'
                          : `Confirmar plan ${downgradeTargetPlanName}`}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>
            )}

            <AlertDialog open={downgradeAccountOpen} onOpenChange={setDowngradeAccountOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cambiar a cuenta personal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dejarás de gestionar negocios y métricas desde el panel profesional.
                    Tus negocios publicados seguirán visibles en el directorio.
                    El plan pasará al {freePlanName} gratuito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={downgradingAccount}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={downgradingAccount}
                    className="bg-muted text-muted-foreground hover:bg-muted/80"
                    onClick={e => {
                      e.preventDefault();
                      void handleDowngradeToPersonal();
                    }}
                  >
                    {downgradingAccount ? 'Cambiando…' : 'Confirmar cuenta personal'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={!!deleteBusinessId}
              onOpenChange={open => {
                if (!open && !deletingBusiness) setDeleteBusinessId(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este negocio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {businessToDelete
                      ? `Se eliminará «${businessToDelete.name}» del directorio de forma permanente, junto con sus valoraciones y métricas. Esta acción no se puede deshacer.`
                      : 'Se eliminará el negocio del directorio de forma permanente. Esta acción no se puede deshacer.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingBusiness}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingBusiness}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={e => {
                      e.preventDefault();
                      void handleDeleteBusiness();
                    }}
                  >
                    {deletingBusiness ? 'Eliminando…' : 'Eliminar negocio'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <TabsContent value="noticias">
              <NewsPublisherPanel />
            </TabsContent>

            {/* Seguridad Tab */}
            <TabsContent value="seguridad">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Seguridad
                  </CardTitle>
                  <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Correo electrónico</p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                        {pendingNewEmail && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            Pendiente de confirmar: {pendingNewEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={!hasPasswordAuth}
                      onClick={() => {
                        setNewEmail(pendingNewEmail || '');
                        setChangeEmailOpen(true);
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Contraseña</p>
                        <p className="text-sm text-muted-foreground">
                          {passwordUpdatedAt
                            ? `Actualizada el ${passwordUpdatedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            : hasPasswordAuth
                              ? 'Protege tu cuenta con una contraseña segura'
                              : 'Iniciaste sesión con un proveedor externo'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPasswordAuth}
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      Cambiar
                    </Button>
                  </div>

                  <Separator />

                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog
            open={changeEmailOpen}
            onOpenChange={open => {
              setChangeEmailOpen(open);
              if (!open) resetEmailForm();
            }}
          >
            <DialogContent animation="fade" className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cambiar correo electrónico</DialogTitle>
                <DialogDescription>
                  Introduce el nuevo correo y confirma con tu contraseña. Te enviaremos un enlace de
                  verificación; el cambio no será efectivo hasta que lo confirmes.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email-display">Correo actual</Label>
                  <Input id="current-email-display" value={user.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Nuevo correo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      placeholder="nuevo@correo.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-change-password">Contraseña actual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-change-password"
                      type={showEmailChangePassword ? 'text' : 'password'}
                      value={emailChangePassword}
                      onChange={e => setEmailChangePassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowEmailChangePassword(!showEmailChangePassword)}
                      aria-label={showEmailChangePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showEmailChangePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={changingEmail}
                    onClick={() => setChangeEmailOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={changingEmail}>
                    {changingEmail ? 'Enviando…' : 'Enviar confirmación'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={changePasswordOpen}
            onOpenChange={open => {
              setChangePasswordOpen(open);
              if (!open) resetPasswordForm();
            }}
          >
            <DialogContent animation="fade" className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>
                  Introduce tu contraseña actual y elige una nueva. Mínimo 6 caracteres.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña actual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type={showPasswordFields ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPasswordFields ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPasswordFields ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPasswordFields ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                    >
                      {showPasswordFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={changingPassword}
                    onClick={() => setChangePasswordOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Guardando…' : 'Guardar contraseña'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />

      {myBusiness && (
        <ContentTrimWizard
          open={trimWizardOpen && needsContentTrim}
          onOpenChange={setTrimWizardOpen}
          mandatory={false}
          planTier={planTier}
          maxPhotos={maxPhotos}
          maxServices={maxServices}
          photoUrls={trimPhotoUrls}
          services={myBusiness.services ?? []}
          dueAt={contentTrimDueAt}
          onResolved={() => {
            void refreshProfile();
            if (!user?.id) return;
            void getMyBusinesses(user.id).then(setMyBusinesses);
            toast({
              title: 'Contenido actualizado',
              description: 'Se han eliminado las fotos y servicios que no conservaste.',
            });
          }}
        />
      )}
    </div>
  );
}
