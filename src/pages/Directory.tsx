import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessCard from '@/components/BusinessCard';
import ReviewsPanel from '@/components/ReviewsPanel';
import { getBusinesses } from '@/services/api';
import type { Business } from '@/data/mockData';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';

const ALL_CATEGORIES = [
  'Restaurante',
  'SPA & Wellness',
  'Hotel',
  'Bar',
  'Discoteca',
  'Tienda',
  'Museo',
  'Actividades',
];

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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([1, 3]);
  const [minAge, setMinAge] = useState<number>(0);

  useEffect(() => {
    getBusinesses().then(setBusinesses);
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([1, 3]);
    setMinAge(0);
  };

  const hasActiveFilters = selectedCategories.length > 0 || priceRange[0] > 1 || priceRange[1] < 3 || minAge > 0;

  const filtered = useMemo(() => {
    return businesses.filter(b => {
      if (selectedCategories.length > 0 && !selectedCategories.some(c => b.category.toLowerCase().includes(c.toLowerCase()))) {
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
    <div className="min-h-screen bg-background">
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
                  {ALL_CATEGORIES.map(cat => (
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
        {grouped.length > 0 ? (
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

      <Footer />

      {selectedBusiness && (
        <ReviewsPanel
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </div>
  );
}
