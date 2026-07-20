import { useEffect, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BUSINESS_IMAGE_FALLBACK, resolveBusinessImageUrl } from '@/lib/business-image';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  /** Prefijo para el alt de cada foto (p. ej. nombre del negocio). */
  altPrefix?: string;
  /** Índice activo al cerrar (útil para sincronizar el carrusel). */
  onCloseIndex?: (index: number) => void;
}

export default function ImageLightbox({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  altPrefix = 'Foto',
  onCloseIndex,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const count = images.length;
  const hasMultiple = count > 1;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const currentUrl = images[safeIndex] ?? '';

  useEffect(() => {
    if (!open) return;
    setIndex(Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)));
  }, [open, initialIndex, count]);

  useEffect(() => {
    if (!open || !hasMultiple) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex(i => (i - 1 + count) % count);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(i => (i + 1) % count);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, hasMultiple, count]);

  if (count === 0) return null;

  const handleOpenChange = (next: boolean) => {
    if (!next) onCloseIndex?.(safeIndex);
    onOpenChange(next);
  };

  const goPrev = () => setIndex(i => (i - 1 + count) % count);
  const goNext = () => setIndex(i => (i + 1) % count);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/92 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-100 flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onOpenAutoFocus={event => event.preventDefault()}
          onClick={() => handleOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">
            {altPrefix} ampliada
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Vista ampliada de las fotos del negocio. Usa Escape para cerrar
            {hasMultiple ? ' y las flechas para cambiar de foto' : ''}.
          </DialogPrimitive.Description>

          <div
            className="flex items-center justify-between gap-3 p-3 sm:p-4"
            onClick={event => event.stopPropagation()}
          >
            <p className="text-sm font-medium text-white/80 tabular-nums">
              {hasMultiple ? `${safeIndex + 1} / ${count}` : '\u00a0'}
            </p>
            <DialogPrimitive.Close
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Cerrar imagen ampliada"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6 sm:px-12">
            {hasMultiple && (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-4"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <ResponsiveImage
              src={resolveBusinessImageUrl(currentUrl)}
              alt={`${altPrefix} — foto ${safeIndex + 1}`}
              sizesPreset="hero"
              fallbackSrc={BUSINESS_IMAGE_FALLBACK}
              className="max-h-full max-w-full object-contain"
              draggable={false}
              onClick={event => event.stopPropagation()}
            />

            {hasMultiple && (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-4"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Envuelve una imagen del carrusel para abrir el lightbox sin interferir con el swipe. */
export function LightboxTrigger({
  className,
  onOpen,
  children,
}: {
  className?: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn('relative block h-full w-full cursor-zoom-in', className)}
      aria-label="Ver imagen ampliada"
      onClick={event => {
        event.stopPropagation();
        onOpen();
      }}
    >
      {children}
    </button>
  );
}
