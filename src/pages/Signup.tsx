import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain, Mail, Lock, User, Eye, EyeOff, Store, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/contexts/AuthContext';

export default function Signup() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>('basic');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: 'Error al crear la cuenta', description: error.message, variant: 'destructive' });
    } else if (data.user) {
      // Insert role into user_roles table
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: selectedRole });
      toast({ title: '¡Cuenta creada!', description: 'Revisa tu correo para confirmar tu cuenta.' });
      navigate('/login');
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
    },
    {
      role: 'professional' as UserRole,
      icon: Store,
      title: 'Profesional',
      description: 'Registra tu negocio y llega a más clientes en Andorra',
      features: ['Registrar negocios', 'Ver métricas', 'Planes de suscripción'],
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
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
            {step === 'role' ? 'Elige tu tipo de cuenta' : selectedRole === 'professional' ? 'Registra tu negocio' : 'Crea tu cuenta'}
          </p>
        </div>

        {step === 'role' ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {roleCards.map(card => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;
                return (
                  <button
                    key={card.role}
                    onClick={() => setSelectedRole(card.role)}
                    className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-6 w-6" />
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
            <Button className="w-full" onClick={() => setStep('form')}>
              Continuar como {selectedRole === 'professional' ? 'Profesional' : 'Usuario'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        ) : (
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {selectedRole === 'professional' ? <Store className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </div>
              <CardTitle className="text-2xl">
                Cuenta {selectedRole === 'professional' ? 'Profesional' : 'de Usuario'}
              </CardTitle>
              <CardDescription>
                {selectedRole === 'professional'
                  ? 'Completa tus datos para registrar tu negocio'
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
                <button type="button" onClick={() => setStep('role')} className="text-sm text-muted-foreground hover:text-foreground">
                  ← Cambiar tipo de cuenta
                </button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
