import { Mountain } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-card py-10">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Mountain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Andorra <span className="text-accent">Viva</span></span>
        </div>
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
