import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessCard from '@/components/BusinessCard';
import ReviewsPanel from '@/components/ReviewsPanel';
import { getBusinesses } from '@/services/api';
import type { Business } from '@/types/domain';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORY_GROUP_MAP } from '@/constants/categoryGroups';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';

const PRICE_LABELS: Record<number, string> = {
  1: '€',
  2: '€€',
  3: '€€€',
};

const AGE_OPTIONS = [
  { label: 'Todas las edades', value: 0 },
  { label: '+16', value: 16 },
  { label: '+18', value: 18 },
];

export default function Directory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([1, 3]);
  const [minAge, setMinAge] = useState<number>(0);

  useEffect(() => {
    const grupo = searchParams.get('grupo');
    const raw = searchParams.get('categoria');
    if (grupo && CATEGORY_GROUP_MAP[grupo]) {
      setSelectedCategories(CATEGORY_GROUP_MAP[grupo]);
      return;
    }
    if (raw) {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      setSelectedCategories(parts);
      return;
    }
    setSelectedCategories([]);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    getBusinesses()
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, []);

  /** Abre el detalle cuando llegamos desde favoritos u otro enlace con `?negocio=`. */
  useEffect(() => {
    const id = searchParams.get('negocio');
    if (!id || businesses.length === 0) return;
    const b = businesses.find(x => x.id === id);
    if (b) setSelectedBusiness(b);
  }, [searchParams, businesses]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([1, 3]);
    setMinAge(0);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('grupo');
      next.delete('categoria');
      return next;
    });
  };

  const hasActiveFilters = selectedCategories.length > 0 || priceRange[0] > 1 || priceRange[1] < 3 || minAge > 0;

  const filtered = useMemo(() => {
    return businesses.filter(b => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(b.category)) {
        return false;
      }
      if (b.price_range < priceRange[0] || b.price_range > priceRange[1]) {
        return false;
      }
      if (minAge > 0 && b.min_age !== null && b.min_age < minAge) {
        return false;
      }
      return true;
    });
  }, [businesses, selectedCategories, priceRange, minAge]);

  const grouped = useMemo(() => {
    const map: Record<string, Business[]> = {};
    filtered.forEach(b => {
      if (!map[b.category]) map[b.category] = [];
      map[b.category].push(b);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-primary px-4 py-12 text-center">
        <h1 className="text-3xl font-extrabold text-primary-foreground">Directorio de Negocios</h1>
        <p className="mt-2 text-sm text-primary-foreground/70">
          Explora todos los negocios de Andorra en un solo lugar
        </p>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter toggle + active badges */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>

          {hasActiveFilters && (
            <>
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleCategory(cat)}>
                  {cat} <X className="h-3 w-3" />
                </Badge>
              ))}
              {(priceRange[0] > 1 || priceRange[1] < 3) && (
                <Badge variant="secondary">
                  {PRICE_LABELS[priceRange[0]]} – {PRICE_LABELS[priceRange[1]]}
                </Badge>
              )}
              {minAge > 0 && (
                <Badge variant="secondary">+{minAge} años</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                Limpiar filtros
              </Button>
            </>
          )}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Categories */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Categorías</h3>
                <div className="flex flex-col gap-2">
                  {BUSINESS_CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-card-foreground cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Rango de precio</h3>
                <div className="space-y-4">
                  <Slider
                    min={1}
                    max={3}
                    step={1}
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>€ Económico</span>
                    <span>€€ Moderado</span>
                    <span>€€€ Premium</span>
                  </div>
                </div>
              </div>

              {/* Min age */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Edad mínima</h3>
                <div className="flex flex-col gap-2">
                  {AGE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-card-foreground cursor-pointer">
                      <Checkbox
                        checked={minAge === opt.value}
                        onCheckedChange={() => setMinAge(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="mb-4 flex items-center gap-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((__, i) => (
                    <div key={i} className="rounded-xl border bg-card overflow-hidden">
                      <Skeleton className="aspect-[4/3] w-full rounded-none" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="pt-2">
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length > 0 ? (
          grouped.map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                {category}
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {items.map(biz => (
                  <BusinessCard key={biz.id} business={biz} onClick={setSelectedBusiness} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No se encontraron negocios con los filtros seleccionados.
          </p>
        )}
      </div>
      </div>

      <Footer />

      {selectedBusiness && (
        <ReviewsPanel
          business={selectedBusiness}
          onClose={() => {
            setSelectedBusiness(null);
            if (searchParams.has('negocio')) {
              setSearchParams(
                prev => {
                  const next = new URLSearchParams(prev);
                  next.delete('negocio');
                  return next;
                },
                { replace: true }
              );
            }
          }}
        />
      )}
    </div>
  );
}
