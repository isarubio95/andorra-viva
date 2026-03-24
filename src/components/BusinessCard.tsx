import { Star, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Business } from '@/data/mockData';

interface BusinessCardProps {
  business: Business;
  onClick: (business: Business) => void;
}

export default function BusinessCard({ business, onClick }: BusinessCardProps) {
  const handleActivate = () => onClick(business);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={business.image_url}
          alt={business.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {business.is_premium && (
          <Badge className="absolute right-3 top-3 bg-premium text-premium-foreground border-0 text-xs font-bold">
            PREMIUM
          </Badge>
        )}
        <button
          onClick={e => { e.stopPropagation(); }}
          className="absolute right-3 bottom-3 rounded-full bg-card/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-card"
          aria-label="Favorito"
        >
          <Heart className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-card-foreground">{business.name}</h3>
        <p className="text-xs text-muted-foreground">
          {business.location} · {business.category}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-premium text-premium" />
            <span className="text-sm font-semibold">{business.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">Ver más →</span>
        </div>
      </div>
    </article>
  );
}
