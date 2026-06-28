import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getParishForLocation, PARISH_MAP_CENTERS } from '@/constants/businessForm';
import {
  addressMatchesSelectedLocation,
  filterResultsByLocation,
  isAddressConfirmed,
  searchAddresses,
  type GeocodingResult,
  type BusinessAddressParts,
} from '@/lib/geocoding';
import 'leaflet/dist/leaflet.css';

export type BusinessAddressValue = BusinessAddressParts;

interface BusinessAddressPickerProps {
  value: BusinessAddressValue;
  onChange: (next: BusinessAddressValue) => void;
  parish?: string;
  onParishSuggest?: (location: string) => void;
  disabled?: boolean;
  showError?: boolean;
  id?: string;
}

const CONFIRM_PIN = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;margin-left:-14px;margin-top:-28px;display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#dc2626" stroke="none"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 16, { animate: false });
  }, [map, lat, lng]);

  return null;
}

function AddressConfirmMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-[180px] w-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapRecenter lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={CONFIRM_PIN} />
      </MapContainer>
    </div>
  );
}

export default function BusinessAddressPicker({
  value,
  onChange,
  parish,
  onParishSuggest,
  disabled = false,
  showError = false,
  id,
}: BusinessAddressPickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-suggestions`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [parishError, setParishError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const prevParishRef = useRef(parish);

  const confirmed = isAddressConfirmed(value);
  const showValidationError = showError && !confirmed;
  const inputDisabled = disabled || !parish;

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  const parishBias = parish ? getParishForLocation(parish) : null;
  const biasCenter = parishBias ? PARISH_MAP_CENTERS[parishBias] : undefined;

  const runSearch = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        setSearchError(null);
        setSearching(false);
        return;
      }

      if (!parish) {
        setSuggestions([]);
        setSearchError('Selecciona primero la parroquia o localidad');
        setSearching(false);
        return;
      }

      setSearching(true);
      setSearchError(null);
      setParishError(null);

      try {
        const rawResults = await searchAddresses(trimmed, {
          lat: biasCenter?.[0],
          lng: biasCenter?.[1],
        });
        const results = filterResultsByLocation(rawResults, parish);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(results.length > 0 ? 0 : -1);
        if (results.length === 0) {
          setSearchError(`No encontramos esa dirección en ${parish}`);
        }
      } catch {
        setSuggestions([]);
        setSearchError('No se pudo buscar la dirección. Inténtalo de nuevo.');
      } finally {
        setSearching(false);
      }
    },
    [biasCenter, parish],
  );

  useEffect(() => {
    if (disabled) return;

    const trimmed = query.trim();
    if (confirmed && trimmed === value.address.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, runSearch, disabled, confirmed, value.address]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (prevParishRef.current === parish) return;
    prevParishRef.current = parish;

    if (!parish || !isAddressConfirmed(value)) return;

    void (async () => {
      const matches = await addressMatchesSelectedLocation(
        { lat: value.lat!, lng: value.lng!, parishHint: null },
        parish,
      );
      if (!matches) {
        onChange({ address: '', portal: '', floor: '', lat: null, lng: null });
        setQuery('');
        setParishError(`La dirección anterior no corresponde a ${parish}. Vuelve a buscarla.`);
      }
    })();
  }, [parish, value, onChange]);

  const selectSuggestion = async (result: GeocodingResult) => {
    if (parish) {
      setValidating(true);
      setParishError(null);
      try {
        const matches = await addressMatchesSelectedLocation(result, parish);
        if (!matches) {
          setParishError(`Esta dirección no pertenece a ${parish}.`);
          return;
        }
      } finally {
        setValidating(false);
      }
    }

    setQuery(result.label);
    setSuggestions([]);
    setOpen(false);
    setSearchError(null);
    onChange({
      address: result.label,
      portal: value.portal,
      floor: value.floor,
      lat: result.lat,
      lng: result.lng,
    });

    if (result.parishHint && onParishSuggest && !parish) {
      onParishSuggest(result.parishHint);
    }
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (text.trim() !== value.address.trim()) {
      onChange({ address: text, portal: value.portal, floor: value.floor, lat: null, lng: null });
    }
    setOpen(true);
  };

  const updateDetail = (field: 'portal' | 'floor', text: string) => {
    onChange({ ...value, [field]: text });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) void selectSuggestion(selected);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor={inputId}>Dirección *</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          placeholder={parish ? 'Calle, número, localidad…' : 'Primero selecciona parroquia'}
          value={query}
          onChange={event => handleInputChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={inputDisabled}
          className={cn('pl-10 pr-10', (showValidationError || parishError) && 'border-destructive')}
          autoComplete="off"
        />
        {(searching || validating) && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
          >
            {suggestions.map((result, index) => (
              <li key={`${result.label}-${result.lat}-${result.lng}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                    index === activeIndex && 'bg-muted',
                  )}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => void selectSuggestion(result)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{result.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchError && query.trim().length >= 3 && !searching && !confirmed && (
        <p className="text-xs text-muted-foreground">{searchError}</p>
      )}

      {parishError && (
        <p className="text-xs text-destructive">{parishError}</p>
      )}

      {showValidationError && (
        <p className="text-xs text-destructive">
          Selecciona una dirección de la lista para confirmar la ubicación.
        </p>
      )}

      {confirmed && value.lat != null && value.lng != null && (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${inputId}-portal`}>Portal</Label>
              <Input
                id={`${inputId}-portal`}
                placeholder="Ej: 2, B, Principal…"
                value={value.portal}
                onChange={event => updateDetail('portal', event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${inputId}-floor`}>Piso / planta</Label>
              <Input
                id={`${inputId}-floor`}
                placeholder="Ej: 3, Ático, Sótano -1…"
                value={value.floor}
                onChange={event => updateDetail('floor', event.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Opcional. Indica portal y piso si el negocio no está en planta baja.
          </p>
          <p className="text-xs text-muted-foreground">Ubicación confirmada en el mapa:</p>
          <AddressConfirmMap lat={value.lat} lng={value.lng} />
        </div>
      )}
    </div>
  );
}
