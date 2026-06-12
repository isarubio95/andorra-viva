import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import HeroMap from '@/components/HeroMap';
import CategoryBar from '@/components/CategoryBar';
import BusinessCard from '@/components/BusinessCard';
import ReviewsPanel from '@/components/ReviewsPanel';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { getBusinesses, getTopVisitedBusinessesOfMonth, type TopVisitedBusiness } from '@/services/api';
import type { Business } from '@/types/domain';

const FEATURED_LIMIT = 6;

function BusinessCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function FeaturedSection({
  title,
  icon,
  loading,
  businesses,
  onBusinessClick,
}: {
  title: string;
  icon: string;
  loading: boolean;
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
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

  useEffect(() => {
    if (!api) return;
    api.reInit();
  }, [api, loading, businesses]);

  if (!loading && businesses.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pt-10">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <span>{icon}</span> {title}
      </h2>
      <Carousel
        opts={{ align: 'start', loop: false }}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent className="-ml-3">
          {loading
            ? Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
                <CarouselItem key={i} className="pl-3 basis-[85%] sm:basis-[48%] lg:basis-[32%]">
                  <BusinessCardSkeleton />
                </CarouselItem>
              ))
            : businesses.map(biz => (
                <CarouselItem key={biz.id} className="pl-3 basis-[85%] sm:basis-[48%] lg:basis-[32%]">
                  <BusinessCard business={biz} onClick={onBusinessClick} />
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
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-out ${
                i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Index() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [topVisitedLoading, setTopVisitedLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [topVisited, setTopVisited] = useState<TopVisitedBusiness[]>([]);

  useEffect(() => {
    setLoading(true);
    getBusinesses()
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTopVisitedLoading(true);
    getTopVisitedBusinessesOfMonth(FEATURED_LIMIT)
      .then(setTopVisited)
      .finally(() => setTopVisitedLoading(false));
  }, []);

  const topRated = useMemo(
    () =>
      [...businesses]
        .filter(b => b.review_count > 0)
        .sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.review_count - a.review_count;
        })
        .slice(0, FEATURED_LIMIT),
    [businesses],
  );

  const premium = useMemo(
    () => businesses.filter(b => b.is_premium).slice(0, FEATURED_LIMIT),
    [businesses],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col">
        <Header />
        <HeroMap businesses={loading ? [] : businesses} onBusinessClick={setSelectedBusiness} />
        <CategoryBar />

        <FeaturedSection
          title="Nuestras recomendaciones"
          icon="🏅"
          loading={loading}
          businesses={premium}
          onBusinessClick={setSelectedBusiness}
        />
        <FeaturedSection
          title="Mejor valorados"
          icon="⭐"
          loading={loading}
          businesses={topRated}
          onBusinessClick={setSelectedBusiness}
        />
        <FeaturedSection
          title="Más visitados del mes"
          icon="🔥"
          loading={topVisitedLoading}
          businesses={topVisited}
          onBusinessClick={setSelectedBusiness}
        />

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
            <p className="text-base text-muted-foreground md:text-lg">
              Descubre todos los negocios de Andorra con filtros, búsqueda y reseñas de la comunidad.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/directorio">
                Ir al directorio completo
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <Footer />

      <ReviewsPanel
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
      />
    </div>
  );
}
