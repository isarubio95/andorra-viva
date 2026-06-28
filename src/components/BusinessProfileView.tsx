import { useEffect, useMemo, useState } from 'react';
import {
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle,
  Medal,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useCarouselAutoplay } from '@/hooks/use-carousel-autoplay';
import type { Business, Review } from '@/types/domain';
import { BUSINESS_IMAGE_FALLBACK, resolveBusinessImageUrl } from '@/lib/business-image';
import { getMaxPhotosForTier, isProfileGroupAvailable, type ProfilePlanTier } from '@/lib/business-profile-plan';
import { cn } from '@/lib/utils';
import BusinessHoursDisplay from '@/components/BusinessHoursDisplay';

interface BusinessProfileViewProps {
  business: Business;
  reviews?: Review[];
  showReviews?: boolean;
  className?: string;
  /** Si se indica, limita secciones visibles según el plan (vista previa del editor). */
  planTier?: ProfilePlanTier;
  /** Muestra insignia premium según plan del propietario (vista previa del editor). */
  previewPremium?: boolean;
}

function groupVisible(planTier: ProfilePlanTier | undefined, group: Parameters<typeof isProfileGroupAvailable>[1]): boolean {
  if (!planTier) return true;
  return isProfileGroupAvailable(planTier, group);
}

function buildPhotoList(business: Business): string[] {
  const seen = new Set<string>();
  const photos: string[] = [];

  const push = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    photos.push(trimmed);
  };

  push(business.image_url);
  business.gallery?.forEach(push);

  return photos;
}

/** Evita que el drawer (Vaul) interprete el deslizamiento horizontal como cierre. */
function stopDrawerPointerBubble(event: React.PointerEvent | React.TouchEvent) {
  event.stopPropagation();
}

function CarouselSlideImage({ url, alt }: { url: string; alt: string }) {
  const [src, setSrc] = useState(() => resolveBusinessImageUrl(url));

  useEffect(() => {
    setSrc(resolveBusinessImageUrl(url));
  }, [url]);

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setSrc(BUSINESS_IMAGE_FALLBACK)}
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

export default function BusinessProfileView({
  business,
  reviews = [],
  showReviews = true,
  className,
  planTier,
  previewPremium,
}: BusinessProfileViewProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoplay = useCarouselAutoplay();

  const showPremiumBadge = previewPremium ?? business.is_premium;
  const showContact = groupVisible(planTier, 'contact');
  const showServices = groupVisible(planTier, 'services');
  const showActions = groupVisible(planTier, 'actions') || !planTier;
  const photos = useMemo(() => {
    const list = buildPhotoList(business);
    const limit = planTier ? getMaxPhotosForTier(planTier) : list.length;
    const visible = list.slice(0, limit);
    return visible.length > 0 ? visible : [business.image_url || ''];
  }, [business.image_url, business.gallery, planTier]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onSelect);
    };
  }, [carouselApi, photos]);

  useEffect(() => {
    carouselApi?.scrollTo(0, true);
    setCurrentSlide(0);
  }, [business.id, photos, carouselApi]);

  const hasMultiplePhotos = photos.length > 1;

  return (
    <div className={className ?? 'flex h-full flex-col bg-card'}>
      <div
        className="relative aspect-3/2 w-full shrink-0 touch-pan-x overflow-hidden bg-muted"
        data-vaul-no-drag=""
        onPointerDown={stopDrawerPointerBubble}
        onTouchStart={stopDrawerPointerBubble}
      >
        <Carousel
          key={photos.join('\0')}
          setApi={setCarouselApi}
          opts={{ loop: hasMultiplePhotos, align: 'start', axis: 'x' }}
          plugins={hasMultiplePhotos ? [autoplay] : undefined}
          className="h-full w-full"
        >
          <CarouselContent className="-ml-0 h-full">
            {photos.map((url, index) => (
              <CarouselItem key={`${url}-${index}`} className="h-full basis-full pl-0">
                <CarouselSlideImage url={url} alt={`${business.name} — foto ${index + 1}`} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {hasMultiplePhotos && (
            <>
              <CarouselPrevious className="left-3 top-1/2 h-8 w-8 -translate-y-1/2 border-0 bg-card/80 shadow-sm hover:bg-card" />
              <CarouselNext className="right-3 top-1/2 h-8 w-8 -translate-y-1/2 border-0 bg-card/80 shadow-sm hover:bg-card" />
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((url, index) => (
                  <button
                    key={`dot-${url}-${index}`}
                    type="button"
                    aria-label={`Ir a la foto ${index + 1}`}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      index === currentSlide ? 'w-5 bg-card' : 'w-1.5 bg-card/50',
                    )}
                  />
                ))}
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                {currentSlide + 1} / {photos.length}
              </div>
            </>
          )}
        </Carousel>

        {showPremiumBadge && (
          <Badge className="recommended-badge pointer-events-none absolute left-4 top-4 z-10 border-0">
            <Medal className="mr-1 h-3.5 w-3.5" />
            Recomendado
          </Badge>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-6">
        <div>
          <h2 className="text-2xl font-bold">{business.name || 'Nombre del negocio'}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(business.rating) ? 'fill-premium text-premium' : 'text-muted'}`}
                />
              ))}
            </div>
            <span className="font-medium text-foreground">{business.rating}</span>
            <span>·</span>
            <span>({business.review_count} reseñas)</span>
            <span>·</span>
            <span>{business.subcategory ?? business.category ?? 'Categoría'}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-3">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <MessageCircle className="mr-2 h-4 w-4" /> Reservar WhatsApp
            </Button>
            {showContact && business.phone && (
              <Button variant="outline" size="icon" asChild>
                <a href={`tel:${business.phone}`} aria-label="Llamar">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="outline" size="icon" asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cómo llegar"
              >
                <Navigation className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            Ubicación en {business.location || '—'}, Andorra
          </div>
          {showContact && business.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="truncate">{business.website}</span>
            </div>
          )}
          <BusinessHoursDisplay hours={business.opening_hours} />
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Sobre este lugar</h3>
          <p className="text-sm text-muted-foreground">
            {business.description || 'Añade una descripción para contar qué ofrece tu negocio.'}
          </p>
        </div>

        {showServices && business.services.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">Servicios</h3>
            <div className="flex flex-wrap gap-2">
              {business.services.map(s => (
                <Badge key={s} variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showReviews && (
          <div>
            <h3 className="mb-4 font-semibold">Reseñas ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.user_name}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? 'fill-premium text-premium' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">{review.created_at}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay reseñas para este negocio.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
