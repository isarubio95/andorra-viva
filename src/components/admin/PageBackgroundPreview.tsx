import {
  Component,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppLogo } from '@/components/AppLogo';
import {
  PAGE_BACKGROUND_LABELS,
  type PageBackground,
  type PageBackgroundId,
} from '@/constants/page-backgrounds';
import { cn } from '@/lib/utils';
import Index from '@/pages/Index';
import Directory from '@/pages/Directory';
import News from '@/pages/News';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import LegalNotice from '@/pages/LegalNotice';

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 900;

function previewFrameClass(background: PageBackground): string {
  if (background.mode === 'default') return 'page-bg-site-default';
  return 'page-bg-custom';
}

function previewFrameStyle(background: PageBackground): CSSProperties {
  if (background.mode === 'color') {
    return {
      backgroundColor: background.color,
      backgroundImage: 'none',
      backgroundAttachment: 'local',
    };
  }
  if (background.mode === 'image') {
    return {
      backgroundImage: `url("${background.imageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'local',
    };
  }
  return { backgroundAttachment: 'local' };
}

/** Shell ligero para páginas que redirigen al montar (navigate en useEffect). */
function PreviewAuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PreviewRegisterBusiness() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 py-10">
      <div className="mb-8">
        <AppLogo size="md" />
      </div>
      <div className="w-full max-w-lg rounded-xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-xl font-semibold">Registrar negocio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vista previa del fondo. El formulario completo no se carga aquí para evitar redirecciones.
        </p>
      </div>
    </div>
  );
}

function PreviewAccount() {
  return (
    <PreviewAuthShell
      title="Mi cuenta"
      description="Vista previa del fondo de la zona de cuenta."
    />
  );
}

function PreviewFavorites() {
  return (
    <PreviewAuthShell
      title="Mis favoritos"
      description="Vista previa del fondo de la página de favoritos."
    />
  );
}

/**
 * Render directo por id: nada de <Routes>/<MemoryRouter> aquí.
 * Un Router anidado está prohibido y `<Routes location>` rompe el invariant
 * de react-router porque la ruta padre es /admin/fondos.
 */
const PREVIEW_PAGES: Record<PageBackgroundId, ComponentType> = {
  home: Index,
  directory: Directory,
  news: News,
  login: Login,
  signup: Signup,
  account: PreviewAccount,
  favorites: PreviewFavorites,
  register_business: PreviewRegisterBusiness,
  legal: LegalNotice,
};

/** Aísla el panel: un fallo de la página previsualizada no debe tumbar /admin/fondos. */
class PreviewErrorBoundary extends Component<
  { pageId: PageBackgroundId; children: ReactNode },
  { message: string | null }
> {
  state: { message: string | null } = { message: null };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(prevProps: { pageId: PageBackgroundId }) {
    if (prevProps.pageId !== this.props.pageId && this.state.message) {
      this.setState({ message: null });
    }
  }

  render() {
    if (this.state.message) {
      return (
        <div className="flex min-h-full items-center justify-center p-10">
          <div className="max-w-md rounded-lg border border-destructive/40 bg-card/90 p-4 text-sm">
            <p className="font-medium text-destructive">
              No se pudo previsualizar {PAGE_BACKGROUND_LABELS[this.props.pageId]}
            </p>
            <p className="mt-1 text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface PageBackgroundPreviewProps {
  pageId: PageBackgroundId;
  background: PageBackground;
  className?: string;
}

export default function PageBackgroundPreview({
  pageId,
  background,
  className,
}: PageBackgroundPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const PreviewPage = PREVIEW_PAGES[pageId];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      setScale(Math.min(1, width / FRAME_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{PAGE_BACKGROUND_LABELS[pageId]}</p>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border bg-muted/30 shadow-sm"
        style={{ height: FRAME_HEIGHT * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <div
            className={cn(
              'h-full w-full overflow-auto overscroll-contain',
              previewFrameClass(background),
            )}
            style={previewFrameStyle(background)}
          >
            <div key={pageId} className="pointer-events-none min-h-full select-none">
              <PreviewErrorBoundary pageId={pageId}>
                <PreviewPage />
              </PreviewErrorBoundary>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Página a {FRAME_WIDTH}px, escalada al panel. El fondo del borrador se aplica al instante.
      </p>
    </div>
  );
}
