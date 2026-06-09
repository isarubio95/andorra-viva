import { useEffect, useState } from 'react';
import { X, Star, MapPin, Clock, Phone, MessageCircle, Navigation, CheckCircle, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { getReviewsByBusiness, trackBusinessVisit } from '@/services/api';
import type { Business, Review } from '@/types/domain';
import { getOrCreateVisitorKey } from '@/lib/visitor-key';
import { BUSINESS_IMAGE_FALLBACK, resolveBusinessImageUrl } from '@/lib/business-image';

interface ReviewsPanelProps {
  business: Business | null;
  onClose: () => void;
}

export default function ReviewsPanel({ business, onClose }: ReviewsPanelProps) {
  const [open, setOpen] = useState(false);
  /** Conserva el negocio visible hasta que termine la animación de cierre. */
  const [displayedBusiness, setDisplayedBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [imgSrc, setImgSrc] = useState(BUSINESS_IMAGE_FALLBACK);

  useEffect(() => {
    if (!business) return;
    setDisplayedBusiness(business);
    setOpen(true);
  }, [business]);

  useEffect(() => {
    if (!displayedBusiness) return;
    getReviewsByBusiness(displayedBusiness.id).then(setReviews);
  }, [displayedBusiness?.id]);

  useEffect(() => {
    if (!displayedBusiness) return;
    const visitorKey = getOrCreateVisitorKey();
    void trackBusinessVisit(displayedBusiness.id, visitorKey);
  }, [displayedBusiness?.id]);

  useEffect(() => {
    if (!displayedBusiness) return;
    setImgSrc(resolveBusinessImageUrl(displayedBusiness.image_url));
  }, [displayedBusiness?.image_url]);

  const handleClosed = () => {
    setDisplayedBusiness(null);
    setReviews([]);
    onClose();
  };

  if (!displayedBusiness) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      onClose={handleClosed}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent
        side="right"
        hideCloseButton
        className="flex w-full flex-col gap-0 bg-card p-0 md:w-[min(36rem,calc(100%-2.75rem))] md:max-w-xl"
      >
        <DrawerTitle className="sr-only">{displayedBusiness.name}</DrawerTitle>
        <DrawerDescription className="sr-only">
          Detalle y reseñas del negocio
        </DrawerDescription>

        {/* Header image */}
        <div className="relative h-56 shrink-0">
          <img
            src={imgSrc}
            alt={displayedBusiness.name}
            onError={() => setImgSrc(BUSINESS_IMAGE_FALLBACK)}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-card/80 p-2 hover:bg-card"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          {displayedBusiness.is_premium && (
            <Badge className="absolute left-4 top-4 border-0 bg-premium text-premium-foreground">
              <Medal className="mr-1 h-3.5 w-3.5" />
              Recomendado
            </Badge>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold">{displayedBusiness.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(displayedBusiness.rating) ? 'fill-premium text-premium' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="font-medium text-foreground">{displayedBusiness.rating}</span>
              <span>·</span>
              <span>({displayedBusiness.review_count} reseñas)</span>
              <span>·</span>
              <span>{displayedBusiness.subcategory ?? displayedBusiness.category}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <MessageCircle className="mr-2 h-4 w-4" /> Reservar WhatsApp
            </Button>
            <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${displayedBusiness.latitude},${displayedBusiness.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cómo llegar"
              >
                <Navigation className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> Ubicación en {displayedBusiness.location}, Andorra
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Horario hoy: 10:00 - 22:00
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2 font-semibold">Sobre este lugar</h3>
            <p className="text-sm text-muted-foreground">{displayedBusiness.description}</p>
          </div>

          {/* Services */}
          {displayedBusiness.services.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Servicios</h3>
              <div className="flex flex-wrap gap-2">
                {displayedBusiness.services.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
