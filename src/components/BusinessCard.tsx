import { Star, Heart, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '@/data/mockData';

interface BusinessCardProps {
  business: Business;
  onClick: (business: Business) => void;
}

export default function BusinessCard({ business, onClick }: BusinessCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const liked = isFavorite(business.id);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Inicia sesión para guardar favoritos', variant: 'destructive' });
      return;
    }
    await toggleFavorite(business.id);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick(business)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(business);
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={business.image_url}
          alt={business.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {business.is_recommended && (
          <Badge className="absolute right-3 top-3 bg-premium text-premium-foreground border-0 text-xs font-bold">
            <Medal className="mr-1 h-3.5 w-3.5" />
            RECOMENDADO
          </Badge>
        )}
        <button
          type="button"
          onClick={handleFavorite}
          className={`absolute right-3 bottom-3 cursor-pointer rounded-full p-1.5 transition-all ${
            liked
              ? 'bg-destructive/10'
              : 'bg-card/80 hover:bg-card'
          }`}
          aria-label={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            }`}
          />
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
