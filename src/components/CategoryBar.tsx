import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, BedDouble, Music, Map, ShoppingBag, Sparkles } from 'lucide-react';
import catGastro from '@/assets/cat-gastronomia.jpg';
import catMontana from '@/assets/cat-montana.jpg';
import catNoche from '@/assets/cat-noche.jpg';
import catCultura from '@/assets/cat-cultura.jpg';
import catShopping from '@/assets/cat-shopping.jpg';
import catWellness from '@/assets/cat-wellness.jpg';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

const CATEGORY_UI: Record<
  (typeof BUSINESS_CATEGORIES)[number],
  { icon: typeof UtensilsCrossed; image: string }
> = {
  'Gastronomía': { icon: UtensilsCrossed, image: catGastro },
  'Alojamiento': { icon: BedDouble, image: catMontana },
  'Ocio y entretenimiento': { icon: Music, image: catNoche },
  'Turismo y experiencias': { icon: Map, image: catCultura },
  'Compras': { icon: ShoppingBag, image: catShopping },
  'Bienestar': { icon: Sparkles, image: catWellness },
};

const categories = BUSINESS_CATEGORIES.map(label => ({
  label,
  ...CATEGORY_UI[label],
}));

function CategoryButton({ cat, onSelect }: { cat: typeof categories[0]; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative overflow-hidden rounded-xl aspect-4/3 w-full cursor-pointer transition-[transform,box-shadow,translate] duration-300 ease-in-out hover:shadow-md hover:-translate-y-1"
    >
      <img
        src={cat.image}
        alt={cat.label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <cat.icon className="h-4 w-4 text-white/80" />
        <span className="text-sm font-semibold text-white">{cat.label}</span>
      </div>
    </button>
  );
}

export default function CategoryBar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const goToDirectory = useCallback(
    (grupo: string) => {
      navigate(`/directorio?grupo=${encodeURIComponent(grupo)}`);
    },
    [navigate]
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const onApiSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on('select', onApiSelect);
    return () => { api.off('select', onApiSelect); };
  }, [api, onApiSelect]);

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="mb-6 text-xl font-bold">Categorías</h2>

      {isMobile ? (
        <div>
          <Carousel
            opts={{ align: 'start', loop: false }}
            className="w-full"
            setApi={setApi}
          >
            <CarouselContent className="-ml-3">
              {categories.map(cat => (
                <CarouselItem key={cat.label} className="pl-3 basis-[44%]">
                  <CategoryButton cat={cat} onSelect={() => goToDirectory(cat.label)} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-out ${
                  i === current ? 'w-6 bg-accent' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {categories.map(cat => (
            <CategoryButton key={cat.label} cat={cat} onSelect={() => goToDirectory(cat.label)} />
          ))}
        </div>
      )}
    </section>
  );
}