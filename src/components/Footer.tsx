import { AppLogo } from '@/components/AppLogo';
import { useSiteContent } from '@/contexts/SiteContentContext';

export default function Footer() {
  const { getText } = useSiteContent();

  return (
    <footer className="border-t bg-card py-10">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
        <AppLogo size="sm" />
        <p className="text-sm text-muted-foreground">{getText('footer_tagline')}</p>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Andorra Viva. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
