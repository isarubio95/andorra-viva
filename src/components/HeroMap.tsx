import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Star } from 'lucide-react';
import { useEffect } from 'react';
import type { Business } from '@/data/mockData';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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
  return (
    <section id="mapa" className="relative">
      {/* Overlay header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-primary/80 to-transparent px-4 pb-16 pt-8 text-center">
        <h1 className="text-3xl font-extrabold text-primary-foreground md:text-5xl">
          Descubre Andorra
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">
          Encuentra los mejores servicios, restaurantes y ocio.
        </p>
      </div>

      <MapContainer
        center={[42.5063, 1.5218]}
        zoom={12}
        scrollWheelZoom
        className="h-[50vh] w-full md:h-[60vh]"
      >
        <AttributionPrefixCleaner />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {businesses.map(biz => (
          <Marker key={biz.id} position={[biz.latitude, biz.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-bold text-sm">{biz.name}</h3>
                <p className="text-xs text-gray-500">{biz.category} · {biz.location}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{biz.rating}</span>
                  <span className="text-xs text-gray-400">({biz.review_count})</span>
                </div>
                <button
                  onClick={() => onBusinessClick(biz)}
                  className="mt-2 w-full rounded bg-[hsl(160,30%,25%)] px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
