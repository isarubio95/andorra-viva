import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { CATEGORY_IMAGE_RESPONSIVE_SIZES, type CategoryTheme } from '@/constants/categoryDisplay';
import SubcategoryIcon from '@/components/SubcategoryIcon';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { buildResponsiveImage } from '@/lib/responsive-image';

type SubcategoryLink = {
  subcategory: string;
  displayLabel: string;
};

type CategoryCardConfig = CategoryTheme & {
  category: string;
  subcategories: SubcategoryLink[];
};

function CategoryCard({
  card,
  displayLabel,
  onCategory,
  onSubcategory,
}: {
  card: CategoryCardConfig;
  displayLabel: string;
  onCategory: (category: string) => void;
  onSubcategory: (category: string, subcategory: string) => void;
}) {
  const gridCols =
    card.subcategories.length <= 3
      ? 'grid-cols-3'
      : card.subcategories.length === 4
        ? 'grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onCategory(card.category)}
        aria-label={`Ver ${displayLabel}`}
        className="relative flex h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:h-48"
      >
        <ResponsiveImage
          src={card.image.src}
          srcSet={card.image.srcSet || buildResponsiveImage(card.image.src).srcSet}
          sizes={CATEGORY_IMAGE_RESPONSIVE_SIZES}
          sizesPreset="categoryCover"
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${card.gradient.from}cc 0%, ${card.gradient.via}99 50%, ${card.gradient.to}f2 100%)`,
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.18), transparent 60%)' }}
          aria-hidden
        />
        <div className="-mt-4 relative flex flex-col items-center gap-2.5 sm:gap-0.5">
          <img
            src={card.emblem}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-28 w-28 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out group-hover:scale-105 sm:h-36 sm:w-36"
            aria-hidden
          />
          <span className="-mt-7 text-base font-extrabold uppercase tracking-wide text-white drop-shadow-sm sm:text-lg">
            {displayLabel}
          </span>
        </div>
      </button>

      <div className={`grid ${gridCols} gap-1 px-2 py-4`}>
        {card.subcategories.map(sub => (
          <button
            key={sub.subcategory}
            type="button"
            onClick={() => onSubcategory(card.category, sub.subcategory)}
            aria-label={sub.displayLabel}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SubcategoryIcon
              subcategory={sub.subcategory}
              className="h-5 w-5 shrink-0"
              color={card.accent}
            />
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
              {sub.displayLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryCarousel({
  cards,
  getLabel,
  onCategory,
  onSubcategory,
}: {
  cards: CategoryCardConfig[];
  getLabel: (category: string) => string;
  onCategory: (category: string) => void;
  onSubcategory: (category: string, subcategory: string) => void;
}) {
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
    return () => {
      api.off('select', onApiSelect);
    };
  }, [api, onApiSelect]);

  const canLoop = cards.length > 1;

  return (
    <>
      <Carousel
        opts={{ align: 'start', loop: canLoop }}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent className="-ml-3">
          {cards.map(card => (
            <CarouselItem key={card.category} className="pl-3 basis-[85%]">
              <CategoryCard
                card={card}
                displayLabel={getLabel(card.category)}
                onCategory={onCategory}
                onSubcategory={onSubcategory}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {count > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a la categoría ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-out ${
                i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function CategoryBar() {
  const navigate = useNavigate();
  const {
    categories,
    getCategoryLabel,
    getCategoryTheme,
    getSubcategoryLabel,
    getSubcategoriesForCategory,
  } = useSiteContent();

  const categoryCards = useMemo<CategoryCardConfig[]>(
    () =>
      categories.flatMap(category => {
        const theme = getCategoryTheme(category);
        if (!theme) return [];
        return [
          {
            category,
            ...theme,
            subcategories: getSubcategoriesForCategory(category).map(subcategory => ({
              subcategory,
              displayLabel: getSubcategoryLabel(subcategory),
            })),
          },
        ];
      }),
    [categories, getCategoryTheme, getSubcategoriesForCategory, getSubcategoryLabel],
  );

  const goToCategory = useCallback(
    (grupo: string) => {
      navigate(`/directorio?grupo=${encodeURIComponent(grupo)}`);
    },
    [navigate],
  );

  const goToSubcategory = useCallback(
    (grupo: string, subcategoria: string) => {
      navigate(
        `/directorio?grupo=${encodeURIComponent(grupo)}&subcategoria=${encodeURIComponent(subcategoria)}`,
      );
    },
    [navigate],
  );

  return (
    <section className="container mx-auto px-4 pt-10 pb-4">
      <h2 className="mb-6 text-xl font-bold text-foreground">¿Qué quieres hacer hoy?</h2>

      <div className="sm:hidden">
        <CategoryCarousel
          cards={categoryCards}
          getLabel={getCategoryLabel}
          onCategory={goToCategory}
          onSubcategory={goToSubcategory}
        />
      </div>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {categoryCards.map(card => (
          <CategoryCard
            key={card.category}
            card={card}
            displayLabel={getCategoryLabel(card.category)}
            onCategory={goToCategory}
            onSubcategory={goToSubcategory}
          />
        ))}
      </div>
    </section>
  );
}
