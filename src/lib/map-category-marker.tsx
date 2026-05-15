import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DivIcon } from 'leaflet';
import type { LucideIcon } from 'lucide-react';
import {
  Bed,
  Heart,
  MapPin,
  Mountain,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react';

export const CATEGORY_MARKER_DEFAULT_COLOR = 'hsl(160 30% 32%)';

/** Color de pin e icono interior (Lucide) por categoría canónica. */
export const CATEGORY_MARKER_CONFIG: Record<
  string,
  { color: string; Icon: LucideIcon }
> = {
  Gastronomía: { color: '#c2410c', Icon: UtensilsCrossed },
  Alojamiento: { color: '#1d4ed8', Icon: Bed },
  'Ocio y entretenimiento': { color: '#6d28d9', Icon: Ticket },
  'Turismo y experiencias': { color: '#047857', Icon: Mountain },
  Compras: { color: '#be185d', Icon: ShoppingBag },
  Bienestar: { color: '#0e7490', Icon: Heart },
};

/** Bump when cambian tamaños/anclas del pin (evita DivIcon cacheado obsoleto en HMR). */
const MARKER_LAYOUT_VERSION = 4;
const markerIconCache = new Map<string, DivIcon>();

function buildPinHtml(color: string, innerSvg: string): string {
  return `<div class="hero-map-pin" style="--pin-color:${color}"><div class="hero-map-pin-shape"><span class="hero-map-pin-icon">${innerSvg}</span></div></div>`;
}

export function getBusinessCategoryDivIcon(category: string): DivIcon {
  const cacheKey = `${MARKER_LAYOUT_VERSION}:${category}`;
  const cached = markerIconCache.get(cacheKey);
  if (cached) return cached;

  const { color, Icon } = CATEGORY_MARKER_CONFIG[category] ?? {
    color: CATEGORY_MARKER_DEFAULT_COLOR,
    Icon: MapPin,
  };

  const innerSvg = renderToStaticMarkup(
    <Icon size={15} color="white" strokeWidth={2.25} aria-hidden />,
  );

  /* Tamaño alineado con .hero-map-pin; ancla en la punta inferior del pin (lat/lng). */
  const icon = new DivIcon({
    html: buildPinHtml(color, innerSvg),
    className: 'hero-map-marker-wrap',
    iconSize: [52, 58],
    iconAnchor: [26, 58],
    /* +X → popup más a la derecha; +Y → más abajo, pegado al pin */
    popupAnchor: [27, 15],
  });

  markerIconCache.set(cacheKey, icon);
  return icon;
}
