import { UtensilsCrossed, Sparkles, Music, ShoppingBag, MountainSnow, Landmark } from 'lucide-react';
import catGastro from '@/assets/cat-gastronomia.jpg';
import catWellness from '@/assets/cat-wellness.jpg';
import catNoche from '@/assets/cat-noche.jpg';
import catShopping from '@/assets/cat-shopping.jpg';
import catMontana from '@/assets/cat-montana.jpg';
import catCultura from '@/assets/cat-cultura.jpg';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const categories = [
  { label: 'Gastronomía', icon: UtensilsCrossed, image: catGastro },
  { label: 'Wellness', icon: Sparkles, image: catWellness },
  { label: 'Noche', icon: Music, image: catNoche },
  { label: 'Shopping', icon: ShoppingBag, image: catShopping },
  { label: 'Montaña', icon: MountainSnow, image: catMontana },
  { label: 'Cultura', icon: Landmark, image: catCultura },
];

interface CategoryBarProps {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

function CategoryButton({ cat, isActive, onSelect }: { cat: typeof categories[0]; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl aspect-[4/3] w-full transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-accent ring-offset-2' : ''}`}
    >
      <img
        src={cat.image}
        alt={cat.label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <cat.icon className="h-4 w-4 text-white/80" />
        <span className="text-sm font-semibold text-white">{cat.label}</span>
      </div>
    </button>
  );
}

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  const isMobile = useIsMobile();

  return (
    <section className="container mx-auto px-4 py-6 sm:py-10">
      <h2 className="mb-4 sm:mb-6 text-xl font-bold">Categorías</h2>

      {isMobile ? (
        <Carousel
          opts={{ align: 'start', loop: false }}
          className="w-full"
        >
          <CarouselContent className="-ml-2.5">
            {categories.map(cat => {
              const isActive = selected === cat.label;
              return (
                <CarouselItem key={cat.label} className="pl-2.5 basis-[44%]">
                  <CategoryButton
                    cat={cat}
                    isActive={isActive}
                    onSelect={() => onSelect(isActive ? null : cat.label)}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map(cat => {
            const isActive = selected === cat.label;
            return (
              <CategoryButton
                key={cat.label}
                cat={cat}
                isActive={isActive}
                onSelect={() => onSelect(isActive ? null : cat.label)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
