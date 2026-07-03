import { AppLogo } from '@/components/AppLogo';

export default function Footer() {
  return (
    <footer className="border-t bg-card py-10">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
        <AppLogo size="sm" />
        <p className="text-sm text-muted-foreground">
          La guía exclusiva de experiencias en el Principado.
        </p>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Andorra Viva. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
