export type MapThemeId =
  | 'voyager'
  | 'positron'
  | 'dark_matter'
  | 'voyager_nolabels'
  | 'positron_nolabels'
  | 'dark_nolabels'
  | 'osm'
  | 'osm_hot'
  | 'opentopomap'
  | 'esri_streets'
  | 'esri_topo'
  | 'satellite';

export interface MapThemeConfig {
  id: MapThemeId;
  label: string;
  description: string;
  url: string;
  attribution: string;
}

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const DEFAULT_MAP_THEME: MapThemeId = 'voyager';

export const MAP_THEME_OPTIONS: MapThemeConfig[] = [
  {
    id: 'voyager',
    label: 'Voyager',
    description: 'Estilo cálido y colorido, ideal para un aspecto acogedor.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'positron',
    label: 'Positron',
    description: 'Mapa claro y minimalista, con tonos neutros.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'dark_matter',
    label: 'Oscuro',
    description: 'Estilo nocturno con alto contraste respecto al fondo claro.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'voyager_nolabels',
    label: 'Voyager sin etiquetas',
    description: 'Voyager sin nombres de calles ni lugares; los marcadores destacan más.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'positron_nolabels',
    label: 'Positron sin etiquetas',
    description: 'Positron limpio, sin texto superpuesto en el mapa.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'dark_nolabels',
    label: 'Oscuro sin etiquetas',
    description: 'Modo oscuro sin etiquetas, ideal si hay muchos marcadores.',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    description: 'Estilo clásico de OpenStreetMap, familiar y detallado.',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'osm_hot',
    label: 'Humanitario',
    description: 'Estilo HOT con más contraste en calles y edificios.',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by HOT',
  },
  {
    id: 'opentopomap',
    label: 'Topográfico',
    description: 'Relieve y curvas de nivel; muy útil en terreno montañoso como Andorra.',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  },
  {
    id: 'esri_streets',
    label: 'Calles',
    description: 'Callejero detallado con nombres de vías y puntos de interés.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
  },
  {
    id: 'esri_topo',
    label: 'Topográfico Esri',
    description: 'Mapa topográfico con relieve suave y carreteras bien definidas.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
  },
  {
    id: 'satellite',
    label: 'Satélite',
    description: 'Imagen aérea real del terreno.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
];

export const MAP_THEMES = Object.fromEntries(
  MAP_THEME_OPTIONS.map(theme => [theme.id, theme]),
) as Record<MapThemeId, MapThemeConfig>;

export function resolveMapTheme(value: unknown): MapThemeId {
  if (typeof value === 'string' && value in MAP_THEMES) {
    return value as MapThemeId;
  }
  return DEFAULT_MAP_THEME;
}

export function getMapThemeConfig(themeId: MapThemeId): MapThemeConfig {
  return MAP_THEMES[themeId] ?? MAP_THEMES[DEFAULT_MAP_THEME];
}

/** Persistido en el cliente para pintar el mapa con el tema del admin desde el primer frame. */
const MAP_THEME_STORAGE_KEY = 'andorra-viva:map-theme';

export function readCachedMapTheme(): MapThemeId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MAP_THEME_STORAGE_KEY);
    if (raw === null) return null;
    if (raw in MAP_THEMES) return raw as MapThemeId;
    return null;
  } catch {
    return null;
  }
}

/** Tema inicial síncrono: caché del admin si existe; si no, el fallback. */
export function getInitialMapTheme(): MapThemeId {
  return readCachedMapTheme() ?? DEFAULT_MAP_THEME;
}

export function writeCachedMapTheme(themeId: MapThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAP_THEME_STORAGE_KEY, themeId);
  } catch {
    // ignore quota / private mode
  }
}
