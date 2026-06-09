import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { LocateFixed, Minus, Plus, Star } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { toast } from 'sonner';
import type { Business } from '@/types/domain';
import { resolveBusinessImageUrl } from '@/lib/business-image';
import {
  CATEGORY_MARKER_CONFIG,
  CATEGORY_MARKER_DEFAULT_COLOR,
  getBusinessCategoryDivIcon,
} from '@/lib/map-category-marker';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { getSubcategoriesForCategory } from '@/constants/businessSubcategories';
import 'leaflet/dist/leaflet.css';

const MAP_FILTER_PILL_LABELS: Record<string, string> = {
  'Ocio y entretenimiento': 'Ocio',
  'Turismo y experiencias': 'Turismo',
};

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

function MapInstanceBridge({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();

  useEffect(() => {
    map.zoomControl?.remove();
    onReady(map);
  }, [map, onReady]);

  return null;
}

const MAP_CONTROL_BTN =
  'flex h-10 w-10 items-center justify-center bg-background/90 text-foreground backdrop-blur-sm transition-colors hover:bg-background active:scale-95 disabled:pointer-events-none disabled:opacity-50';

export default function HeroMap({ businesses, onBusinessClick }: HeroMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subcategoriesOpen, setSubcategoriesOpen] = useState(false);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const handleMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map);
  }, []);

  const handleZoomIn = () => {
    mapInstance?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstance?.zoomOut();
  };

  const handleLocate = () => {
    if (!mapInstance) return;

    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(coords);
        mapInstance.flyTo(coords, 15, { duration: 0.8 });
        setLocating(false);
      },
      error => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Permiso de ubicación denegado');
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('No se pudo obtener tu ubicación');
          return;
        }
        toast.error('Tiempo de espera agotado al buscar tu ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    if (!subcategoriesOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (filterRef.current?.contains(target)) return;
      setSubcategoriesOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [subcategoriesOpen]);

  const handleCategoryClick = (cat: string) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
      setSelectedSubcategories([]);
      setSubcategoriesOpen(false);
      return;
    }
    setSelectedCategory(cat);
    setSelectedSubcategories([]);
    setSubcategoriesOpen(true);
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub],
    );
  };

  const visibleBusinesses = useMemo(() => {
    if (!selectedCategory) return businesses;
    const inCategory = businesses.filter(b => b.category === selectedCategory);
    if (selectedSubcategories.length === 0) return inCategory;
    return inCategory.filter(
      b => b.subcategory && selectedSubcategories.includes(b.subcategory),
    );
  }, [businesses, selectedCategory, selectedSubcategories]);

  const selectedColor = selectedCategory
    ? (CATEGORY_MARKER_CONFIG[selectedCategory]?.color ?? CATEGORY_MARKER_DEFAULT_COLOR)
    : null;

  const hasSubcategoryFilter = selectedSubcategories.length > 0;
  /** Vista colapsada: panel cerrado pero con subcategorías activas (tras tocar fuera). */
  const isCollapsedWithSubs = !subcategoriesOpen && hasSubcategoryFilter;

  /** La categoría activa pasa al final solo cuando el panel se ha colapsado. */
  const orderedCategories = useMemo(() => {
    if (isCollapsedWithSubs && selectedCategory) {
      return [
        ...BUSINESS_CATEGORIES.filter(cat => cat !== selectedCategory),
        selectedCategory,
      ];
    }
    return [...BUSINESS_CATEGORIES];
  }, [isCollapsedWithSubs, selectedCategory]);

  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());

  /** Anima el reordenamiento de las pills (FLIP) cuando cambia el orden. */
  useLayoutEffect(() => {
    const nodes = pillRefs.current;

    nodes.forEach(node => {
      node.style.transition = 'none';
      node.style.transform = 'none';
    });

    const newRects = new Map<string, DOMRect>();
    nodes.forEach((node, key) => newRects.set(key, node.getBoundingClientRect()));

    nodes.forEach((node, key) => {
      const prev = prevRects.current.get(key);
      const next = newRects.get(key);
      if (!prev || !next) return;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) return;

      node.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        node.style.transition = 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)';
        node.style.transform = '';
      });
    });

    prevRects.current = newRects;
  }, [orderedCategories]);

  const pillBase =
    'pointer-events-auto inline-flex w-full min-w-[100px] items-center rounded-full border bg-background/90 px-2 py-1 text-left text-[10px] font-medium leading-tight shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-background md:min-w-[168px] md:px-2.5 md:py-1.5 md:text-[11px]';

  const renderCategoryPill = (cat: string) => {
    const cfg = CATEGORY_MARKER_CONFIG[cat];
    const color = cfg?.color ?? CATEGORY_MARKER_DEFAULT_COLOR;
    const isSelected = selectedCategory === cat;
    const isDimmed = selectedCategory !== null && !isSelected;

    return (
      <button
        key={cat}
        ref={node => {
          if (node) pillRefs.current.set(cat, node);
          else pillRefs.current.delete(cat);
        }}
        type="button"
        onClick={() => handleCategoryClick(cat)}
        aria-pressed={isSelected}
        aria-expanded={isSelected && subcategoriesOpen}
        aria-label={cat}
        title={isSelected ? `Quitar filtro ${cat}` : cat}
        style={isSelected ? { backgroundColor: `${color}14`, borderColor: `${color}30` } : undefined}
        className={`${pillBase} items-center gap-1.5 md:gap-2 ${
          isSelected ? 'text-foreground' : 'border-border/60 text-foreground'
        } ${isDimmed ? 'scale-[0.97] opacity-35' : 'opacity-100'}`}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="truncate">{MAP_FILTER_PILL_LABELS[cat] ?? cat}</span>
      </button>
    );
  };

  const renderSubcategoryPill = (sub: string, index: number) => {
    const isSubSelected = selectedSubcategories.includes(sub);
    const subColor = selectedColor ?? CATEGORY_MARKER_DEFAULT_COLOR;

    return (
      <button
        key={sub}
        type="button"
        onClick={() => toggleSubcategory(sub)}
        aria-pressed={isSubSelected}
        style={{
          animationDelay: `${index * 45}ms`,
          ...(isSubSelected
            ? { backgroundColor: `${subColor}14`, borderColor: `${subColor}30` }
            : {}),
        }}
        className={`${pillBase} animate-subfilter-rise-in motion-reduce:animate-none ${
          isSubSelected ? 'text-foreground' : 'border-border/60 text-foreground'
        }`}
      >
        <span className="truncate">{sub}</span>
      </button>
    );
  };

  const subcategoryList = (() => {
    if (!selectedCategory) return null;
    const subs = subcategoriesOpen
      ? getSubcategoriesForCategory(selectedCategory)
      : selectedSubcategories;
    if (subs.length === 0) return null;
    const listKey = subcategoriesOpen
      ? `${selectedCategory}-open`
      : `${selectedCategory}-collapsed-${selectedSubcategories.join('|')}`;
    return (
      <div
        key={listKey}
        className="flex shrink-0 flex-col gap-1.5 overflow-hidden border-l border-border/40 pl-1"
        role="group"
        aria-label={`Subcategorías de ${selectedCategory}`}
      >
        {subs.map((sub, index) => renderSubcategoryPill(sub, index))}
      </div>
    );
  })();

  return (
    <section id="mapa" className="relative">
      <MapContainer
        center={[42.5063, 1.5218]}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="h-[50vh] w-full md:h-[60vh]"
      >
        <AttributionPrefixCleaner />
        <MapInstanceBridge onReady={handleMapReady} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {userPosition && (
          <CircleMarker
            center={userPosition}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: '#2563eb',
              fillOpacity: 1,
            }}
          />
        )}
        {visibleBusinesses.map(biz => (
          <Marker
            key={biz.id}
            position={[biz.latitude, biz.longitude]}
            icon={getBusinessCategoryDivIcon(biz.category)}
          >
            <Popup minWidth={200} maxWidth={200} className="hero-map-popup">
              <div className="w-full max-w-[200px]">
                <h3 className="wrap-break-word font-bold text-sm leading-tight">{biz.name}</h3>
                <img
                  src={resolveBusinessImageUrl(biz.image_url)}
                  alt=""
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = resolveBusinessImageUrl(null);
                  }}
                  className="mt-1.5 h-20 w-full rounded-md border border-border/70 object-cover"
                />
                <p className="mt-1.5 wrap-break-word text-xs leading-snug text-muted-foreground">
                  {biz.subcategory ?? biz.category} · {biz.location}
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

      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
        <div className="pointer-events-auto overflow-hidden rounded-xl border border-border/60 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={!mapInstance}
            aria-label="Acercar mapa"
            title="Acercar"
            className={`${MAP_CONTROL_BTN} border-b border-border/60`}
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!mapInstance}
            aria-label="Alejar mapa"
            title="Alejar"
            className={MAP_CONTROL_BTN}
          >
            <Minus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating || !mapInstance}
          aria-label="Ir a mi ubicación"
          title="Mi ubicación"
          className={`${MAP_CONTROL_BTN} pointer-events-auto rounded-xl border border-border/60 shadow-sm ${
            locating ? 'text-primary' : ''
          }`}
        >
          <LocateFixed className={`h-[18px] w-[18px] ${locating ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div
        ref={filterRef}
        className="pointer-events-none absolute bottom-4 left-4 z-10 max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] pr-1"
      >
        <div className="overflow-hidden">
          <div className={`flex gap-1 overflow-hidden ${isCollapsedWithSubs ? 'items-end' : 'items-start'}`}>
            <div className="flex shrink-0 flex-col gap-1.5">
              {orderedCategories.map(renderCategoryPill)}
            </div>
            {(subcategoriesOpen || isCollapsedWithSubs) && subcategoryList}
          </div>
        </div>
      </div>
    </section>
  );
}
