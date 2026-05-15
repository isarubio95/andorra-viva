import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Star, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Business } from '@/types/domain';
import { resolveBusinessImageUrl } from '@/lib/business-image';
import {
  CATEGORY_MARKER_CONFIG,
  CATEGORY_MARKER_DEFAULT_COLOR,
  getBusinessCategoryDivIcon,
} from '@/lib/map-category-marker';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import 'leaflet/dist/leaflet.css';

interface HeroMapProps {
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
}

function AttributionPrefixCleaner() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);

  return null;
}

export default function HeroMap({ businesses, onBusinessClick }: HeroMapProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  /** Vacío = sin filtro (todas las categorías). Con valores = solo esas categorías. */
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const clearCategoryFilters = () => setSelectedCategories([]);

  const visibleBusinesses = useMemo(() => {
    if (selectedCategories.length === 0) return businesses;
    return businesses.filter(b => selectedCategories.includes(b.category));
  }, [businesses, selectedCategories]);

  const hasCategoryFilter = selectedCategories.length > 0;

  return (
    <section id="mapa" className="relative">
      <MapContainer
        center={[42.5063, 1.5218]}
        zoom={12}
        scrollWheelZoom
        className="h-[50vh] w-full md:h-[60vh]"
      >
        <AttributionPrefixCleaner />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {visibleBusinesses.map(biz => (
          <Marker
            key={biz.id}
            position={[biz.latitude, biz.longitude]}
            icon={getBusinessCategoryDivIcon(biz.category)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-bold text-sm leading-tight">{biz.name}</h3>
                <img
                  src={resolveBusinessImageUrl(biz.image_url)}
                  alt=""
                  className="mt-1.5 h-20 w-full rounded-md border border-border/70 object-cover"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {biz.category} · {biz.location}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{biz.rating}</span>
                  <span className="text-xs text-muted-foreground">({biz.review_count})</span>
                </div>
                <button
                  type="button"
                  onClick={() => onBusinessClick(biz)}
                  className="mt-2 w-full cursor-pointer rounded bg-[hsl(160,30%,25%)] px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="pointer-events-auto h-10 gap-1.5 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm"
          onClick={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasCategoryFilter ? (
            <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 tabular-nums">
              {selectedCategories.length}
            </Badge>
          ) : null}
        </Button>

        <div className="pointer-events-none hidden max-w-[220px] flex-wrap gap-1.5 md:flex">
          {BUSINESS_CATEGORIES.map(cat => {
            const cfg = CATEGORY_MARKER_CONFIG[cat];
            const color = cfg?.color ?? CATEGORY_MARKER_DEFAULT_COLOR;
            return (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full border border-white/90 shadow-sm"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {cat}
              </span>
            );
          })}
        </div>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen} syncWithHistory={false}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filtros del mapa</SheetTitle>
            <SheetDescription>
              Activa categorías para mostrar solo esos negocios en el mapa. Sin ninguna selección se muestran todos.
            </SheetDescription>
          </SheetHeader>
          <div className="grid max-h-[50vh] gap-3 overflow-y-auto py-4 pr-1 sm:max-h-[60vh]">
            {BUSINESS_CATEGORIES.map(cat => {
              const cfg = CATEGORY_MARKER_CONFIG[cat];
              const color = cfg?.color ?? CATEGORY_MARKER_DEFAULT_COLOR;
              const checked =
                selectedCategories.length === 0 ? false : selectedCategories.includes(cat);
              const showHint = selectedCategories.length === 0;

              return (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={showHint ? false : checked}
                    onCheckedChange={() => toggleCategory(cat)}
                    className="shrink-0"
                  />
                  <span
                    className="h-9 w-9 shrink-0 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium leading-tight text-foreground">{cat}</span>
                </label>
              );
            })}
          </div>
          <SheetFooter className="gap-2 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={clearCategoryFilters}
              disabled={!hasCategoryFilter}
            >
              Mostrar todas las categorías
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
