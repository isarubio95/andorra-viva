import {
  BUSINESS_LOCATIONS,
  getParishForLocation,
} from '@/constants/businessForm';

export interface GeocodingResult {
  label: string;
  lat: number;
  lng: number;
  parishHint: string | null;
}

const ANDORRA_BBOX = '1.407,42.428,1.786,42.656';
const PHOTON_API = 'https://photon.komoot.io/api/';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  locality?: string;
  state?: string;
  country?: string;
  countrycode?: string;
}

function formatPhotonLabel(props: PhotonProperties): string {
  const parts: string[] = [];
  if (props.street) {
    parts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  const place = props.locality || props.city || props.state;
  if (place) parts.push(place);
  return parts.join(', ') || 'Dirección sin nombre';
}

export function locationHintMatchesSelected(
  hint: string | null,
  selectedLocation: string,
): boolean {
  if (!hint?.trim() || !selectedLocation.trim()) return false;

  const normalizedHint = hint.trim();
  const normalizedSelected = selectedLocation.trim();

  if (normalizedHint.toLowerCase() === normalizedSelected.toLowerCase()) {
    return true;
  }

  const selectedParish = getParishForLocation(normalizedSelected);
  if (!selectedParish) return false;

  return getParishForLocation(normalizedHint) === selectedParish;
}

function inferLocationHint(props: PhotonFeature['properties']): string | null {
  const candidates = [props.locality, props.city, props.name, props.state].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    if ((BUSINESS_LOCATIONS as readonly string[]).includes(candidate)) {
      return candidate;
    }
    const match = BUSINESS_LOCATIONS.find(
      location => location.toLowerCase() === candidate.toLowerCase(),
    );
    if (match) return match;
  }

  for (const candidate of candidates) {
    const parish = getParishForLocation(candidate);
    if (parish) return parish;
  }

  return null;
}

export async function searchAddresses(
  query: string,
  options?: { lat?: number; lng?: number },
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    bbox: ANDORRA_BBOX,
    limit: '8',
  });

  if (options?.lat != null && options?.lng != null) {
    params.set('lat', String(options.lat));
    params.set('lon', String(options.lng));
  }

  const response = await fetch(`${PHOTON_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as { features?: PhotonFeature[] };

  return (data.features ?? [])
    .filter(feature => feature.properties.countrycode === 'AD' || feature.properties.country === 'Andorra')
    .map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return {
        label: formatPhotonLabel(feature.properties),
        lat,
        lng,
        parishHint: inferLocationHint(feature.properties),
      };
    });
}

export function filterResultsByLocation(
  results: GeocodingResult[],
  selectedLocation: string,
): GeocodingResult[] {
  if (!selectedLocation.trim()) return results;

  return results.filter(
    result => !result.parishHint || locationHintMatchesSelected(result.parishHint, selectedLocation),
  );
}

export async function resolveLocationHintFromCoords(
  lat: number,
  lng: number,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
  });

  const response = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { features?: PhotonFeature[] };
  const feature = data.features?.[0];
  if (!feature) return null;

  return inferLocationHint(feature.properties);
}

export async function addressMatchesSelectedLocation(
  address: { lat: number; lng: number; parishHint?: string | null },
  selectedLocation: string,
): Promise<boolean> {
  if (!selectedLocation.trim()) return false;

  if (address.parishHint && locationHintMatchesSelected(address.parishHint, selectedLocation)) {
    return true;
  }

  const resolved = await resolveLocationHintFromCoords(address.lat, address.lng);
  return locationHintMatchesSelected(resolved, selectedLocation);
}

export function isAddressConfirmed(value: {
  address: string;
  lat: number | null;
  lng: number | null;
}): boolean {
  return (
    value.address.trim().length > 0 &&
    value.lat != null &&
    value.lng != null &&
    !Number.isNaN(value.lat) &&
    !Number.isNaN(value.lng)
  );
}

export type BusinessAddressParts = {
  address: string;
  portal: string;
  floor: string;
  lat: number | null;
  lng: number | null;
};

const ADDRESS_SEGMENT = ' · ';

/** Dirección completa para guardar o mostrar (calle + portal + piso). */
export function formatStoredAddress(parts: Pick<BusinessAddressParts, 'address' | 'portal' | 'floor'>): string {
  const segments = [parts.address.trim()];
  const portal = parts.portal.trim();
  const floor = parts.floor.trim();
  if (portal) segments.push(`Portal ${portal}`);
  if (floor) segments.push(`Piso ${floor}`);
  return segments.filter(Boolean).join(ADDRESS_SEGMENT);
}

/** Separa calle geocodificada de portal/piso al cargar desde la base de datos. */
export function parseStoredAddress(stored: string | null | undefined): Pick<BusinessAddressParts, 'address' | 'portal' | 'floor'> {
  if (!stored?.trim()) {
    return { address: '', portal: '', floor: '' };
  }

  const segments = stored.split(ADDRESS_SEGMENT);
  const baseParts: string[] = [];
  let portal = '';
  let floor = '';

  for (const segment of segments) {
    if (segment.startsWith('Portal ')) {
      portal = segment.slice('Portal '.length);
    } else if (segment.startsWith('Piso ')) {
      floor = segment.slice('Piso '.length);
    } else {
      baseParts.push(segment);
    }
  }

  return {
    address: baseParts.join(ADDRESS_SEGMENT),
    portal,
    floor,
  };
}
