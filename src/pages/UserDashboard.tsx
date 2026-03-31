import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Store, Settings, ChevronRight, Heart, Star, BarChart3, Medal } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getBusinesses, getMyBusinesses, getPlans } from '@/services/api';
import type { Business, Plan } from '@/data/mockData';
import BusinessCard from '@/components/BusinessCard';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const { user, displayName, role, signOut, hasProAccess, planId, refreshProfile, subscriptionStatus } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [myBusinessesLoading, setMyBusinessesLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [changingRecommendedId, setChangingRecommendedId] = useState<string | null>(null);

  useEffect(() => {
    getBusinesses().then(setAllBusinesses);
  }, []);

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

  const favoriteBusinesses = allBusinesses.filter(b => favorites.has(b.id));

  const isPro = hasProAccess;
  const canManageRecommendation =
    role === 'admin' || (planId === 'enterprise' && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing'));
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

  const handleChangePlan = async (nextPlanId: string) => {
    if (!user?.id) return;
    if (nextPlanId === planId) return;
    setChangingPlan(true);
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan_id: nextPlanId })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'No se pudo cambiar el plan', description: error.message, variant: 'destructive' });
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
        title: 'Plan Enterprise requerido',
        description: 'Solo cuentas enterprise pueden destacar un negocio como recomendado.',
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

  if (!user) {
    navigate('/login');
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

          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className={`grid w-full ${isPro ? 'grid-cols-5' : 'grid-cols-3'}`}>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              {isPro ? (
                <>
                  <TabsTrigger value="negocios">Mis Negocios</TabsTrigger>
                  <TabsTrigger value="metricas">Métricas</TabsTrigger>
                  <TabsTrigger value="plan">Plan</TabsTrigger>
                </>
              ) : (
                <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
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
                        <Badge variant={isPro ? 'default' : 'secondary'}>
                          {accountLabel}
                        </Badge>
                        {planId && planId !== 'free' && (
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
                            Solo puedes destacar un negocio. Requiere plan enterprise activo o en trial.
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {myBusinesses.map(biz => (
                            <div key={biz.id} className="space-y-3 rounded-xl border p-3">
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
                            </div>
                          ))}
                        </div>
                        {!canManageRecommendation && (
                          <p className="text-xs text-muted-foreground">
                            Para activar el distintivo recomendado necesitas plan enterprise con estado active o trialing.
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
                    <CardDescription>Estadísticas de tus negocios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-xs text-muted-foreground">Visitas este mes</p>
                      </div>
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-xs text-muted-foreground">Reseñas totales</p>
                      </div>
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">—</p>
                        <p className="text-xs text-muted-foreground">Valoración media</p>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Las métricas se actualizarán cuando registres un negocio
                    </p>
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
                      <Star className="h-5 w-5" />
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
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="relative flex flex-col rounded-xl border p-5">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="mt-2 h-4 w-24" />
                            <div className="mt-4 space-y-2">
                              <Skeleton className="h-3 w-5/6" />
                              <Skeleton className="h-3 w-4/6" />
                              <Skeleton className="h-3 w-3/6" />
                            </div>
                            <Skeleton className="mt-4 h-9 w-full rounded-md" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {plans
                          .filter(p => p.id !== 'free')
                          .map(plan => {
                            const selected = planId === plan.id;
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                disabled={changingPlan}
                                onClick={() => handleChangePlan(plan.id)}
                                className={`relative flex flex-col rounded-xl border p-5 text-left transition-all ${
                                  selected
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                                } ${changingPlan ? 'opacity-70' : ''}`}
                              >
                                {plan.is_popular && (
                                  <Badge className="absolute -top-2.5 right-4 bg-accent text-accent-foreground border-0 text-xs">
                                    Más popular
                                  </Badge>
                                )}
                                <div className="flex items-start justify-between gap-4">
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
                                <div className="mt-4 grid gap-1.5">
                                  {plan.features.slice(0, 5).map(f => (
                                    <div key={f} className="text-xs text-muted-foreground">
                                      - {f}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4">
                                  <Button
                                    type="button"
                                    className="w-full"
                                    variant={selected ? 'outline' : 'default'}
                                    disabled={changingPlan || selected}
                                  >
                                    {selected ? 'Plan actual' : changingPlan ? 'Cambiando…' : 'Cambiar a este plan'}
                                  </Button>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Basic: Favoritos Tab */}
            {!isPro && (
              <TabsContent value="favoritos">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Mis Favoritos
                    </CardTitle>
                    <CardDescription>Negocios que has guardado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {favoriteBusinesses.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {favoriteBusinesses.map(biz => (
                          <BusinessCard key={biz.id} business={biz} onClick={() => {}} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Heart className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No tienes favoritos aún</p>
                          <p className="text-sm text-muted-foreground">Explora el directorio y guarda tus negocios favoritos</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/directorio')}>
                          Explorar Directorio
                        </Button>
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
