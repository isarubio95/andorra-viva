import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
const navLinks = [
  { label: 'Mapa', href: '#mapa' },
  { label: 'Directorio', href: '#directorio' },
  { label: 'Precios', href: '#precios' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Mountain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Andorra <span className="text-accent">Viva</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm">Iniciar Sesión</Button>
          <Button size="sm">Registrar Negocio</Button>
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
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            <Button size="sm">Registrar Negocio</Button>
          </div>
        </div>
      )}
    </header>
  );
}
