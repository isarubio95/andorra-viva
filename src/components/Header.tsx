import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Store, Heart, Shield } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
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
import { accountDashboardPath } from '@/lib/account-dashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Mapa', href: '/#mapa' },
  { label: 'Directorio', href: '/directorio' },
  { label: 'Noticias', href: '/noticias' },
];

function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === '/#mapa') return pathname === '/';
  const path = href.split('#')[0];
  if (path === '/directorio') {
    return pathname === '/directorio' || pathname.startsWith('/directorio/');
  }
  if (path === '/noticias') {
    return pathname === '/noticias' || pathname.startsWith('/noticias/');
  }
  return pathname === path;
}

type HeaderNavLinkProps = {
  href: string;
  children: ReactNode;
  variant?: 'desktop' | 'mobile';
  onClick?: () => void;
};

function HeaderNavLink({ href, children, variant = 'desktop', onClick }: HeaderNavLinkProps) {
  const { pathname } = useLocation();
  const isActive = isNavLinkActive(href, pathname);

  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        'relative transition-colors',
        variant === 'desktop'
          ? cn(
              'inline-flex flex-col items-stretch py-1 text-sm font-medium',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )
          : cn(
              'inline-flex w-full rounded-lg px-3 py-3 text-base font-medium text-foreground',
              isActive ? 'bg-muted' : 'hover:bg-muted/60',
            ),
      )}
    >
      <span>{children}</span>
      {variant === 'desktop' ? (
        <span
          aria-hidden
          className={cn(
            'mt-1.5 h-[1.25px] origin-left rounded-full bg-primary',
            isActive ? 'animate-nav-link-underline-in' : 'scale-x-0',
          )}
        />
      ) : null}
    </Link>
  );
}

type HeaderProps = {
  /** En móvil: cabecera fija sobre el contenido (p. ej. home con mapa). */
  mobileOverlay?: boolean;
  /** En móvil: oculta la cabecera deslizándola hacia arriba. */
  mobileHidden?: boolean;
};

export default function Header({ mobileOverlay = false, mobileHidden = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, displayName, role, signOut, loading, hasProAccess, roleLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isPro = hasProAccess;
  const roleBadge = role === 'admin' ? 'ADMIN' : isPro ? 'PRO' : 'USER';

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
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg transition-transform duration-300 ease-out',
        mobileOverlay && 'max-md:fixed max-md:inset-x-0 max-md:top-0',
        mobileHidden && 'max-md:-translate-y-full max-md:pointer-events-none',
      )}
    >
      <div className="container mx-auto grid h-16 grid-cols-[1fr_auto] items-center px-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-start">
          <AppLogo size="xs" asLink priority />
        </div>

        {/* Desktop nav: columna central del grid, centrada respecto al header completo */}
        <nav className="col-start-2 row-start-1 hidden items-center justify-center gap-8 md:flex">
          {navLinks.map(link => (
            <HeaderNavLink key={link.href} href={link.href}>
              {link.label}
            </HeaderNavLink>
          ))}
        </nav>

        {/* Auth + menú móvil (columna derecha del grid) */}
        <div className="col-start-2 flex min-h-10 items-center justify-end gap-3 md:col-start-3">
          <div className="hidden items-center gap-3 md:flex">
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
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 transition-colors hover:bg-muted"
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
                <DropdownMenuItem onClick={() => navigate('/favoritos')}>
                  <Heart className="mr-2 h-4 w-4" />
                  Favoritos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
                </DropdownMenuItem>
                {isPro && (
                  <DropdownMenuItem onClick={() => navigate(accountDashboardPath('negocios'))}>
                    <Store className="mr-2 h-4 w-4" />
                    Mi Negocio
                  </DropdownMenuItem>
                )}
                {role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Administración
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
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
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <Drawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        direction="right"
        shouldScaleBackground={false}
      >
        <DrawerContent
          side="right"
          className="flex w-full flex-col gap-0 bg-card p-0 pt-14"
        >
          <DrawerTitle className="sr-only">Menú de navegación</DrawerTitle>
          <DrawerDescription className="sr-only">
            Enlaces del sitio, favoritos y opciones de iniciar sesión o cerrar sesión.
          </DrawerDescription>
          <nav className="flex flex-1 flex-col gap-1 px-4 pb-6">
            {navLinks.map(link => (
              <HeaderNavLink
                key={link.href}
                href={link.href}
                variant="mobile"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </HeaderNavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-border px-4 py-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/mi-cuenta" onClick={() => setMobileOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Mi cuenta
                  </Link>
                </Button>
                {isPro && (
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={accountDashboardPath('negocios')} onClick={() => setMobileOpen(false)}>
                      <Store className="mr-2 h-4 w-4" />
                      Mi negocio
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/favoritos" onClick={() => setMobileOpen(false)}>
                    <Heart className="mr-2 h-4 w-4" />
                    Favoritos
                  </Link>
                </Button>
                {role === 'admin' && (
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/admin" onClick={() => setMobileOpen(false)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Administración
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setMobileOpen(false);
                    void handleSignOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    Registrar negocio
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}
