import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain, Menu, X, LogOut, User, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSyncOverlayWithHistory } from '@/hooks/use-sync-overlay-with-history';

const navLinks = [
  { label: 'Mapa', href: '/#mapa' },
  { label: 'Directorio', href: '/directorio' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useSyncOverlayWithHistory(mobileOpen, () => setMobileOpen(false));
  const { user, displayName, role, signOut, loading, hasProAccess, roleLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isPro = hasProAccess;
  const roleBadge = role === 'admin' ? 'ADMIN' : isPro ? 'PRO' : 'USER';

  const mobileNavLinks = navLinks;

  const linkClass =
    'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Sesión cerrada' });
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Mountain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Andorra <span className="text-accent">Viva</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth: placeholder mientras Supabase restaura sesión (evita salto logo/nav → contenido) */}
        <div className="hidden min-h-10 min-w-[200px] items-center justify-end gap-3 md:flex">
          {loading ? (
            <div
              className="h-9 w-full max-w-[240px] rounded-full bg-muted/45"
              aria-hidden
            />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 transition-colors hover:bg-muted"
                  aria-busy={roleLoading}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  {roleLoading ? (
                    <span
                      className="inline-flex h-5 min-w-[2.75rem] rounded-md border border-border bg-muted/70 px-1.5"
                      aria-hidden
                    />
                  ) : (
                    <Badge
                      variant={isPro || role === 'admin' ? 'default' : 'secondary'}
                      className="min-w-[2.75rem] justify-center text-[10px] px-1.5 py-0 transition-opacity duration-200"
                    >
                      {roleBadge}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </DropdownMenuItem>
                {isPro && (
                  <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>
                    <Store className="mr-2 h-4 w-4" />
                    Mis Negocios
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Registrar Negocio</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {mobileNavLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/mi-cuenta" onClick={() => setMobileOpen(false)}>Mi Cuenta</Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Iniciar Sesión</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>Registrar Negocio</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
