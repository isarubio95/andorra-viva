import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { useSiteContent } from '@/contexts/SiteContentContext';

export default function Footer() {
  const { getText } = useSiteContent();

  return (
    <footer className="border-t bg-card py-10">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
        <AppLogo size="sm" />
        <p className="text-sm text-muted-foreground">{getText('footer_tagline')}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link to="/aviso-legal" className="hover:text-foreground hover:underline">
            Aviso legal
          </Link>
          <Link to="/politica-proteccion-datos" className="hover:text-foreground hover:underline">
            Política de protección de datos
          </Link>
          <Link to="/condiciones-de-uso" className="hover:text-foreground hover:underline">
            Condiciones de uso
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Andorra Viva. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
