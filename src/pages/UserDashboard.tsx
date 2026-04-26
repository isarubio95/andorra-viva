import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Store, Settings, ChevronRight, BarChart3, Medal, Copy, QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import {
  getMyBusinesses,
  getPlans,
  getMyBusinessMetrics,
  setMySubscriptionPlan,
  type BusinessMetricRow,
} from '@/services/api';
import type { Business, Plan } from '@/types/domain';
import BusinessCard from '@/components/BusinessCard';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const {
    user,
    displayName,
    role,
    signOut,
    hasProAccess,
    planId,
    refreshProfile,
    subscriptionStatus,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [myBusinessesLoading, setMyBusinessesLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [changingRecommendedId, setChangingRecommendedId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetricRow[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [mainTab, setMainTab] = useState('perfil');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

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
    if (!user?.id || !hasProAccess) {
      setMetrics([]);
      return;
    }
    setMetricsLoading(true);
    getMyBusinessMetrics(30)
      .then(setMetrics)
      .finally(() => setMetricsLoading(false));
  }, [user?.id, hasProAccess]);

  const isPro = hasProAccess;
  const canManageRecommendation =
    role === 'admin' || (planId === 'premium' && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing'));
  const accountLabel =
    role === 'admin' ? 'Admin' : isPro ? 'Profesional' : 'Usuario';
  const currentRecommendedId = myBusinesses.find(b => b.is_recommended)?.id ?? null;

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

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

  const refreshMyBusinesses = async () => {
    if (!user?.id || !hasProAccess) return;
    setMyBusinessesLoading(true);
    const rows = await getMyBusinesses(user.id);
    setMyBusinesses(rows);
    setMyBusinessesLoading(false);
  };

  const getReviewUrl = (businessId: string): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/valorar/${businessId}`;
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
    if (nextPlanId === planId) return;
    setChangingPlan(true);
    const result = await setMySubscriptionPlan(nextPlanId);

    if (!result.ok) {
      toast({
        title: 'No se pudo cambiar el plan',
        description: result.error ?? 'Error desconocido',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Plan actualizado', description: `Nuevo plan: ${nextPlanId}` });
      await refreshProfile();
    }
    setChangingPlan(false);
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <Badge variant={isPro ? 'default' : 'secondary'}>
                  {accountLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
            <TabsList
              className={cn(
                'h-auto min-h-10 w-full max-w-full gap-1.5 p-1',
                'flex flex-nowrap items-stretch justify-start overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x',
                '[&>*]:shrink-0',
                isPro
                  ? 'md:grid md:h-10 md:grid-cols-5 md:items-center md:justify-center md:overflow-hidden md:gap-0'
                  : 'md:grid md:h-10 md:grid-cols-2 md:items-center md:justify-center md:overflow-hidden md:gap-0'
              )}
            >
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              {isPro && (
                <>
                  <TabsTrigger value="negocios">Mis Negocios</TabsTrigger>
                  <TabsTrigger value="metricas">Métricas</TabsTrigger>
                  <TabsTrigger value="plan">Plan</TabsTrigger>
                </>
              )}
              <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de cuenta</Label>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="border-transparent bg-muted font-medium text-muted-foreground shadow-none"
                        >
                          {accountLabel}
                        </Badge>
                        {planId && planId !== 'basico' && planId !== 'free' && (
                          <span className="text-xs text-muted-foreground">
                            Plan: <span className="font-medium text-foreground">{planId}</span>
                          </span>
                        )}
                        {!isPro && (
                          <span className="text-xs text-muted-foreground">
                            ¿Tienes un negocio? <Link to="/signup" className="text-primary hover:underline">Actualiza tu cuenta</Link>
                          </span>
                        )}
                      </div>
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Guardando…' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional: Negocios Tab */}
            {isPro && (
              <TabsContent value="negocios">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Mis Negocios
                    </CardTitle>
                    <CardDescription>Gestiona los negocios que has registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myBusinessesLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            <Skeleton className="aspect-[4/3] w-full rounded-none" />
                            <div className="space-y-2 p-4">
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-3 w-1/2" />
                              <div className="pt-2">
                                <Skeleton className="h-4 w-20" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : myBusinesses.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Distintivo recomendado</p>
                          <p>
                            Solo puedes destacar un negocio. Requiere plan Premium activo o en prueba.
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {myBusinesses.map(biz => (
                            <div key={biz.id} className="min-w-0 space-y-3 rounded-xl border p-3">
                              <BusinessCard
                                business={biz}
                                onClick={() => {}}
                              />
                              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Medal className="h-4 w-4 text-premium" />
                                  <span className="font-medium text-foreground">Recomendado</span>
                                  {currentRecommendedId === biz.id && (
                                    <Badge variant="secondary">Activo</Badge>
                                  )}
                                </div>
                                <Switch
                                  checked={biz.is_recommended}
                                  disabled={
                                    !!changingRecommendedId ||
                                    !canManageRecommendation ||
                                    (!!currentRecommendedId && currentRecommendedId !== biz.id && !biz.is_recommended)
                                  }
                                  onCheckedChange={(checked) => handleToggleRecommended(biz.id, checked)}
                                  aria-label={`Marcar ${biz.name} como recomendado`}
                                />
                              </div>
                              <div className="min-w-0 rounded-lg border border-border p-3">
                                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                                  <QrCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="min-w-0">QR de valoraciones</span>
                                </div>
                                <p className="mb-3 max-w-full break-all rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                                  {getReviewUrl(biz.id)}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full min-w-0 cursor-pointer justify-center"
                                    onClick={() => handleCopyReviewUrl(biz.id)}
                                  >
                                    <Copy className="mr-2 h-4 w-4 shrink-0" />
                                    Copiar enlace
                                  </Button>
                                  <Button
                                    type="button"
                                    className="w-full min-w-0 cursor-pointer justify-center"
                                    onClick={() => handleDownloadReviewQr(biz)}
                                  >
                                    <Download className="mr-2 h-4 w-4 shrink-0" />
                                    Descargar QR
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!canManageRecommendation && (
                          <p className="text-xs text-muted-foreground">
                            Para la insignia Premium visible en el directorio necesitas plan Premium con estado activo o en prueba.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No tienes negocios registrados</p>
                          <p className="text-sm text-muted-foreground">Registra tu primer negocio para aparecer en el directorio</p>
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
            {isPro && (
              <TabsContent value="metricas">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Métricas
                    </CardTitle>
                    <CardDescription>Visitas, reseñas y evolución de los últimos 30 días por negocio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {metricsLoading ? (
                      <div className="space-y-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="rounded-xl border p-4">
                            <Skeleton className="h-5 w-48" />
                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                              {Array.from({ length: 4 }).map((__, j) => (
                                <Skeleton key={j} className="h-16 rounded-lg" />
                              ))}
                            </div>
                            <Skeleton className="mt-4 h-48 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : metrics.length > 0 ? (
                      <div className="space-y-6">
                        {metrics.map(row => (
                          <div key={row.business_id} className="rounded-xl border p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-semibold text-foreground">{row.business_name}</h3>
                              <Badge variant="secondary">Ultimos 30 dias</Badge>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div className="rounded-lg border border-border p-3 text-center">
                                <p className="text-xl font-bold text-foreground">{row.visits_month}</p>
                                <p className="text-xs text-muted-foreground">Visitas este mes</p>
                              </div>
                              <div className="rounded-lg border border-border p-3 text-center">
                                <p className="text-xl font-bold text-foreground">{row.visits_total}</p>
                                <p className="text-xs text-muted-foreground">Visitas totales</p>
                              </div>
                              <div className="rounded-lg border border-border p-3 text-center">
                                <p className="text-xl font-bold text-foreground">{row.reviews_total}</p>
                                <p className="text-xs text-muted-foreground">Reseñas totales</p>
                              </div>
                              <div className="rounded-lg border border-border p-3 text-center">
                                <p className="text-xl font-bold text-foreground">{row.rating_avg.toFixed(1)}</p>
                                <p className="text-xs text-muted-foreground">Valoracion media</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <ChartContainer
                                config={{
                                  visits: {
                                    label: 'Visitas',
                                    color: 'var(--primary)',
                                  },
                                }}
                                className="h-56 w-full"
                              >
                                <LineChart data={row.daily_visits}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => String(value).slice(5)}
                                  />
                                  <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="line" />}
                                  />
                                  <Line
                                    dataKey="visits"
                                    type="monotone"
                                    stroke="var(--color-visits)"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                </LineChart>
                              </ChartContainer>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        Las metricas apareceran cuando tengas negocios con visitas.
                      </p>
                    )}
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
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Plan actual</p>
                          <p className="font-semibold text-foreground">{planId ?? '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Estado</p>
                          <p className="font-medium text-foreground">{subscriptionStatus ?? '—'}</p>
                        </div>
                      </div>
                    </div>

                    {plansLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="relative flex h-full min-h-0 flex-col rounded-xl border p-5">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="mt-2 h-4 w-24" />
                            <div className="mt-4 min-h-0 flex-1 space-y-2">
                              <Skeleton className="h-3 w-5/6" />
                              <Skeleton className="h-3 w-4/6" />
                              <Skeleton className="h-3 w-3/6" />
                            </div>
                            <div className="mt-auto shrink-0 pt-4">
                              <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                        {plans
                          .filter(p => p.id !== 'free')
                          .map(plan => {
                            const selected = planId === plan.id;
                            return (
                              <div
                                key={plan.id}
                                role="button"
                                tabIndex={changingPlan ? -1 : 0}
                                aria-disabled={changingPlan}
                                onClick={() => {
                                  if (!changingPlan) handleChangePlan(plan.id);
                                }}
                                onKeyDown={e => {
                                  if (changingPlan) return;
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleChangePlan(plan.id);
                                  }
                                }}
                                className={`relative flex h-full min-h-0 cursor-pointer flex-col rounded-xl border p-5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                  selected
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                                } ${changingPlan ? 'pointer-events-none opacity-70' : ''}`}
                              >
                                <div className="shrink-0 flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {plan.price === 0 ? 'Gratis' : `${plan.price}${plan.currency}`}{plan.price > 0 ? `/${plan.interval}` : ''}
                                    </p>
                                  </div>
                                  {selected && (
                                    <Badge variant="default" className="h-fit">Actual</Badge>
                                  )}
                                </div>
                                <div className="mt-4 min-h-0 flex-1 grid gap-1.5 content-start">
                                  {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map(f => (
                                    <div key={f} className="text-xs text-muted-foreground">
                                      - {f}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-auto shrink-0 pt-4">
                                  <div
                                    className={cn(
                                      buttonVariants({
                                        variant: selected ? 'outline' : 'default',
                                        className: 'w-full pointer-events-none select-none',
                                      }),
                                      (changingPlan || selected) && 'opacity-50'
                                    )}
                                  >
                                    {selected ? 'Plan actual' : changingPlan ? 'Cambiando…' : 'Cambiar a este plan'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

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
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Correo electrónico</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Contraseña</p>
                        <p className="text-sm text-muted-foreground">Última actualización desconocida</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Cambiar</Button>
                  </div>

                  <Separator />

                  <Button variant="destructive" onClick={handleSignOut} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
