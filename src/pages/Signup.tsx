import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mountain, Mail, Lock, User, Eye, EyeOff, Store, UserCircle, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import { sortPlansByPrice } from '@/lib/plan-display';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlans, upgradeToProfessional } from '@/services/api';
import type { UserRole } from '@/contexts/AuthContext';
import type { Plan } from '@/types/domain';

type SignupStep = 'role' | 'plan' | 'form' | 'business';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const reviewMode = searchParams.get('mode') === 'review';
  const upgradeParam = searchParams.get('mode') === 'upgrade';
  const next = searchParams.get('next');
  const { user, role, roleLoading, hasProAccess, refreshProfile } = useAuth();
  const upgradeFlow = upgradeParam || (!reviewMode && !!user && role === 'basic');
  const [step, setStep] = useState<SignupStep>(() => {
    if (reviewMode) return 'form';
    if (upgradeParam) return 'plan';
    return 'role';
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('basic');
  const [selectedPlan, setSelectedPlan] = useState<string>('basico');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (roleLoading) return;
    if (upgradeFlow && !user) {
      navigate(`/login?next=${encodeURIComponent('/signup?mode=upgrade')}`, { replace: true });
      return;
    }
    if (upgradeFlow && hasProAccess) {
      navigate('/mi-cuenta', { replace: true });
    }
  }, [upgradeFlow, user, roleLoading, hasProAccess, navigate]);

  useEffect(() => {
    if (upgradeFlow && user && !roleLoading) {
      setSelectedRole('professional');
      if (step === 'role' || step === 'form') {
        setStep(s => (s === 'form' ? 'business' : 'plan'));
      }
    }
  }, [upgradeFlow, user, roleLoading, step]);

  const stepSequence: SignupStep[] = upgradeFlow
    ? ['plan', 'business']
    : ['role', ...(selectedRole === 'professional' ? ['plan' as const] : []), 'form'];

  const handleContinueFromRole = () => {
    if (selectedRole === 'professional') {
      setStep('plan');
    } else {
      setStep('form');
    }
  };

  const handleContinueFromPlan = async () => {
    if (upgradeFlow) {
      setLoading(true);
      const result = await upgradeToProfessional(selectedPlan);
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
        description: `Plan ${plans.find(p => p.id === selectedPlan)?.name || selectedPlan}`,
      });
      setLoading(false);
      setStep('business');
      return;
    }
    setStep('form');
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

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
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
    if (step === 'business') {
      setStep('plan');
    } else if (step === 'form' && selectedRole === 'professional') {
      setStep('plan');
    } else if (step === 'form') {
      setStep('role');
    } else if (step === 'plan' && !upgradeFlow) {
      setStep('role');
    }
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
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Mountain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Andorra <span className="text-accent">Viva</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {reviewMode && 'Cuenta personal para valorar negocios'}
            {upgradeFlow && step === 'plan' && 'Elige tu plan profesional'}
            {upgradeFlow && step === 'business' && 'Registra tu negocio'}
            {!reviewMode && !upgradeFlow && step === 'role' && 'Elige tu tipo de cuenta'}
            {!upgradeFlow && step === 'plan' && 'Elige tu plan profesional'}
            {!upgradeFlow && step === 'form' && (selectedRole === 'professional' ? 'Crea tu cuenta profesional' : 'Crea tu cuenta')}
          </p>
          {!reviewMode && (
            <div className="flex items-center gap-2">
              {stepSequence.map((s, i, arr) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      step === s ? 'bg-primary text-primary-foreground' :
                      arr.indexOf(step) > i ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {arr.indexOf(step) > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 w-6 rounded ${arr.indexOf(step) > i ? 'bg-accent' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
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
                    onClick={() => setSelectedRole(card.role)}
                    className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex w-full items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {card.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                    </div>
                    <ul className="mt-1 space-y-1">
                      {card.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
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
              columns={sortPlansByPrice(plans).map(plan => ({
                plan,
                selected: selectedPlan === plan.id,
                onSelect: () => setSelectedPlan(plan.id),
              }))}
            />
            <div className="flex gap-3">
              {!upgradeFlow && (
                <Button variant="outline" onClick={goBack} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
              )}
              <Button className="flex-1" onClick={handleContinueFromPlan} disabled={loading}>
                {loading ? 'Actualizando…' : `Continuar con ${plans.find(p => p.id === selectedPlan)?.name || 'Básico'}`}
              </Button>
            </div>
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
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
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
