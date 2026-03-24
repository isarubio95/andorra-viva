import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Store, Settings, ChevronRight, Heart, Star, BarChart3 } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const { user, displayName, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);

  const isPro = role === 'professional';

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
                  {isPro ? 'Profesional' : 'Usuario'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className={`grid w-full ${isPro ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              {isPro ? (
                <>
                  <TabsTrigger value="negocios">Mis Negocios</TabsTrigger>
                  <TabsTrigger value="metricas">Métricas</TabsTrigger>
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
                          {isPro ? 'Profesional' : 'Usuario'}
                        </Badge>
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
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No tienes negocios registrados</p>
                        <p className="text-sm text-muted-foreground">Registra tu primer negocio para aparecer en el directorio</p>
                      </div>
                      <Button>
                        <Store className="mr-2 h-4 w-4" />
                        Registrar Negocio
                      </Button>
                    </div>
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

// Need Link import for the upgrade CTA
import { Link } from 'react-router-dom';
