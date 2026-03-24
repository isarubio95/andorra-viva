import { useEffect, useState } from 'react';
import { X, Star, MapPin, Clock, Phone, MessageCircle, Navigation, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getReviewsByBusiness } from '@/services/api';
import type { Business, Review } from '@/data/mockData';

interface ReviewsPanelProps {
  business: Business;
  onClose: () => void;
}

export default function ReviewsPanel({ business, onClose }: ReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    getReviewsByBusiness(business.id).then(setReviews);
  }, [business.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-card shadow-2xl animate-in slide-in-from-right">
        {/* Header image */}
        <div className="relative h-56 flex-shrink-0">
          <img src={business.image_url} alt={business.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-card/80 p-2 hover:bg-card"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          {business.is_premium && (
            <Badge className="absolute left-4 top-4 bg-premium text-premium-foreground border-0">Premium</Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold">{business.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
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
              <span>{business.category}</span>
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
                href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
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
              <MapPin className="h-4 w-4" /> Ubicación en {business.location}, Andorra
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Horario hoy: 10:00 - 22:00
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2 font-semibold">Sobre este lugar</h3>
            <p className="text-sm text-muted-foreground">{business.description}</p>
          </div>

          {/* Services */}
          {business.services.length > 0 && (
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

          {/* Reviews */}
          <div>
            <h3 className="mb-4 font-semibold">Reseñas ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{review.user_name}</span>
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
      </div>
    </div>
  );
}
