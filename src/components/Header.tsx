import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain, Menu, X, LogOut, User, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navLinks = [
  { label: 'Mapa', href: '/#mapa' },
  { label: 'Directorio', href: '/directorio' },
  { label: 'Precios', href: '/#precios' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, displayName, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          {navLinks.map(link =>
            link.href.startsWith('/') && !link.href.includes('#') ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Auth area */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 transition-colors hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>
                  <Store className="mr-2 h-4 w-4" />
                  Mis Negocios
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Registrar Negocio</Link>
              </Button>
            </>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map(link =>
              link.href.startsWith('/') && !link.href.includes('#') ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
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
