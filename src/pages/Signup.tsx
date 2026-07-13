import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Store, UserCircle, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { Badge } from '@/components/ui/badge';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import PlanBenefitsBar from '@/components/PlanBenefitsBar';
import { getPlanTheme, sortPlansByPrice } from '@/lib/plan-display';
import {
  buildSignupSearchParams,
  getSignupStepSequence,
  parseSignupRole,
  resolveSignupStep,
  type SignupStep,
} from '@/lib/signup-wizard';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlans, upgradeToProfessional } from '@/services/api';
import type { UserRole } from '@/contexts/AuthContext';
import type { Plan } from '@/types/domain';

export default function Signup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewMode = searchParams.get('mode') === 'review';
  const upgradeParam = searchParams.get('mode') === 'upgrade';
  const next = searchParams.get('next');
  const stepParam = searchParams.get('step');
  const roleParam = searchParams.get('role');
  const planParam = searchParams.get('plan');
  const { user, role, roleLoading, hasProAccess, refreshProfile } = useAuth();
  const upgradeFlow = upgradeParam || (!reviewMode && !!user && role === 'basic');
  const selectedRole = parseSignupRole(roleParam);
  const selectedPlan = planParam || 'free';
  const step = useMemo(
    () =>
      resolveSignupStep({
        stepParam,
        role: selectedRole,
        planParam,
        reviewMode,
        upgradeFlow,
      }),
    [stepParam, selectedRole, planParam, reviewMode, upgradeFlow],
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getLegalPage } = useSiteContent();
  const privacyPolicyVersion = getLegalPage('privacy_policy').version;

  const pushWizardParams = (updates: { step?: SignupStep; role?: UserRole; plan?: string }) => {
    setSearchParams(current => buildSignupSearchParams(current, updates));
  };

  const replaceWizardParams = (updates: { step?: SignupStep; role?: UserRole; plan?: string }) => {
    setSearchParams(current => buildSignupSearchParams(current, updates), { replace: true });
  };

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (reviewMode) {
      if (stepParam !== 'form') {
        replaceWizardParams({ step: 'form' });
      }
      return;
    }

    if (upgradeFlow) return;

    if (planParam && !stepParam) {
      replaceWizardParams({ step: 'plan', role: 'professional', plan: planParam });
      return;
    }

    if (!stepParam) {
      replaceWizardParams({ step: 'role', role: selectedRole });
      return;
    }

    const validStep = resolveSignupStep({
      stepParam,
      role: selectedRole,
      planParam,
      reviewMode,
      upgradeFlow,
    });
    if (validStep !== stepParam) {
      replaceWizardParams({
        step: validStep,
        role: selectedRole,
        ...(planParam ? { plan: planParam } : {}),
      });
    }
  }, [reviewMode, upgradeFlow, planParam, stepParam, selectedRole]);

  useEffect(() => {
    if (roleLoading) return;
    if (upgradeFlow && !user) {
      const returnUrl = buildSignupSearchParams(new URLSearchParams('mode=upgrade'), {
        step: (stepParam as SignupStep | null) ?? 'plan',
        role: 'professional',
        ...(planParam ? { plan: planParam } : {}),
      });
      navigate(`/login?next=${encodeURIComponent(`/signup?${returnUrl.toString()}`)}`, { replace: true });
      return;
    }
    if (upgradeFlow && hasProAccess) {
      navigate('/mi-cuenta', { replace: true });
    }
  }, [upgradeFlow, user, roleLoading, hasProAccess, navigate, stepParam, planParam]);

  useEffect(() => {
    if (!upgradeFlow || !user || roleLoading) return;

    if (stepParam === 'role' || stepParam === 'form' || !stepParam) {
      replaceWizardParams({
        step: stepParam === 'form' ? 'business' : 'plan',
        role: 'professional',
        ...(planParam ? { plan: planParam } : {}),
      });
    }
  }, [upgradeFlow, user, roleLoading, stepParam, planParam]);

  const stepSequence: SignupStep[] = getSignupStepSequence(upgradeFlow, selectedRole);

  const handleContinueFromRole = () => {
    pushWizardParams({
      step: selectedRole === 'professional' ? 'plan' : 'form',
      role: selectedRole,
    });
  };

  const handleContinueFromPlan = async (planId: string = selectedPlan) => {
    if (upgradeFlow) {
      setLoading(true);
      replaceWizardParams({ plan: planId });
      const result = await upgradeToProfessional(planId);
      if (!result.ok) {
        toast({
          title: 'No se pudo actualizar la cuenta',
          description: result.error,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      await refreshProfile();
      toast({
        title: '¡Cuenta profesional activada!',
        description: `Plan ${plans.find(p => p.id === planId)?.name || planId}`,
      });
      setLoading(false);
      pushWizardParams({ step: 'business', plan: planId, role: 'professional' });
      return;
    }
    pushWizardParams({ step: 'form', plan: planId, role: selectedRole });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', description: 'Verifica que ambas contraseñas sean iguales.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (!acceptedPrivacyPolicy) {
      toast({
        title: 'Debes aceptar la política de protección de datos',
        description: 'Lee y marca la casilla de la política de protección de datos para crear tu cuenta.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
          privacy_policy_accepted_at: new Date().toISOString(),
          privacy_policy_version: privacyPolicyVersion,
          ...(selectedRole === 'professional' ? { plan: selectedPlan } : {}),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: 'Error al crear la cuenta', description: error.message, variant: 'destructive' });
    } else if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      toast({
        title: 'Este email ya está registrado',
        description: 'Ya existe una cuenta con este correo. Inicia sesión o usa otro email.',
        variant: 'destructive',
      });
    } else if (data.user) {
      toast({ title: '¡Cuenta creada!', description: 'Revisa tu correo para confirmar tu cuenta.' });
      navigate(`/login${reviewMode ? `?mode=review${next ? `&next=${next}` : ''}` : ''}`);
    }

    setLoading(false);
  };

  const roleCards = [
    {
      role: 'basic' as UserRole,
      icon: UserCircle,
      title: 'Usuario',
      description: 'Explora negocios, deja reseñas y guarda tus favoritos',
      features: ['Explorar directorio', 'Dejar reseñas', 'Guardar favoritos'],
      badge: 'Gratis',
    },
    {
      role: 'professional' as UserRole,
      icon: Store,
      title: 'Profesional',
      description: 'Registra tu negocio y llega a más clientes en Andorra',
      features: ['Registrar negocios', 'Ver métricas', 'Planes de suscripción'],
      badge: 'Desde 0€',
    },
  ];

  const goBack = () => {
    navigate(-1);
  };

  if (upgradeFlow && (roleLoading || !user || hasProAccess)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
      <div className={cn('w-full space-y-8', step === 'plan' ? 'max-w-7xl' : 'max-w-lg')}>
        <div className="flex flex-col items-center gap-3">
          <AppLogo size="md" asLink />
          <p className="text-sm text-muted-foreground">
            {reviewMode && 'Cuenta personal para valorar negocios'}
            {upgradeFlow && step === 'plan' && 'Elige tu plan profesional'}
            {upgradeFlow && step === 'business' && 'Registra tu negocio'}
            {!reviewMode && !upgradeFlow && step === 'role' && 'Elige tu tipo de cuenta'}
            {!upgradeFlow && step === 'plan' && 'Elige tu plan profesional'}
            {!upgradeFlow && step === 'form' && (selectedRole === 'professional' ? 'Crea tu cuenta profesional' : 'Crea tu cuenta')}
          </p>
          {!reviewMode && (
            <div className="flex items-center">
              {stepSequence.map((s, i, arr) => {
                const currentIndex = arr.indexOf(step);
                const isCompleted = currentIndex > i;
                const isActive = step === s || isCompleted;

                return (
                  <Fragment key={s}>
                    <div
                      className={cn(
                        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className={cn(
                          'w-10 shrink-0',
                          isCompleted ? 'h-0.5 bg-primary' : 'h-0.5 bg-white',
                        )}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>

        {step === 'role' && !upgradeFlow && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {roleCards.map(card => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => replaceWizardParams({ role: card.role })}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-start gap-3 overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-md'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="flex w-full items-start justify-between">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge
                        variant={isSelected ? 'default' : 'secondary'}
                        className={cn('text-xs', isSelected && 'mr-9')}
                      >
                        {card.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
                    </div>
                    <ul className="mt-1 space-y-1.5">
                      {card.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-primary' : 'bg-muted-foreground/40')} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <Button className="w-full" onClick={handleContinueFromRole}>
              Continuar como {selectedRole === 'professional' ? 'Profesional' : 'Usuario'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        )}

        {step === 'plan' && (
          <div className="space-y-4">
            <PlanComparisonGrid
              comparePlans={plans}
              columns={sortPlansByPrice(plans).map(plan => {
                const theme = getPlanTheme(plan.id);
                return {
                  plan,
                  selected: selectedPlan === plan.id,
                  onSelect: () => replaceWizardParams({ plan: plan.id }),
                  action: (
                    <Button
                      className={cn('w-full rounded-full', theme.buttonClass)}
                      disabled={loading}
                      onClick={e => {
                        e.stopPropagation();
                        void handleContinueFromPlan(plan.id);
                      }}
                    >
                      {loading && selectedPlan === plan.id
                        ? 'Actualizando…'
                        : `Continuar con ${plan.name}`}
                    </Button>
                  ),
                };
              })}
            />
            <PlanBenefitsBar className="mt-6 w-full" />
            {!upgradeFlow && (
              <div className="flex">
                <Button variant="outline" onClick={goBack} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'business' && upgradeFlow && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl">¿Tienes un negocio?</CardTitle>
              <CardDescription>
                Plan {plans.find(p => p.id === selectedPlan)?.name || 'Básico'} activado.
                Registra tu negocio (uno por plan) para aparecer en el directorio o hazlo más tarde desde tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={() => navigate('/registrar-negocio')}>
                Registrar mi negocio
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/mi-cuenta')}>
                Omitir por ahora
              </Button>
            </CardContent>
            <CardFooter>
              <button type="button" onClick={goBack} className="w-full text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                ← Cambiar plan
              </button>
            </CardFooter>
          </Card>
        )}

        {step === 'form' && !upgradeFlow && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {selectedRole === 'professional' ? <Store className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </div>
              <CardTitle className="text-2xl">
                Cuenta {selectedRole === 'professional' ? 'Profesional' : 'de Usuario'}
              </CardTitle>
              <CardDescription>
                {reviewMode
                  ? 'Completa tus datos para poder valorar este negocio'
                  : selectedRole === 'professional'
                  ? `Plan ${plans.find(p => p.id === selectedPlan)?.name || 'Básico'} · Completa tus datos`
                  : 'Completa tus datos para explorar el directorio'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="fullName" placeholder="Tu nombre" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repite la contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-1">
                  <Checkbox
                    id="privacyPolicy"
                    checked={acceptedPrivacyPolicy}
                    onCheckedChange={value => setAcceptedPrivacyPolicy(value === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="privacyPolicy" className="cursor-pointer text-xs leading-snug text-muted-foreground">
                    He leído y acepto la{' '}
                    <Link
                      to="/politica-proteccion-datos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      Política de Protección de Datos
                    </Link>
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading || !acceptedPrivacyPolicy}>
                  {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
                </Button>
                {!reviewMode && (
                  <button type="button" onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    ← {selectedRole === 'professional' ? 'Cambiar plan' : 'Cambiar tipo de cuenta'}
                  </button>
                )}
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
