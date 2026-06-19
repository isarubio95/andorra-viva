import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Bed,
  Bike,
  Building2,
  CalendarDays,
  Clapperboard,
  Coffee,
  CookingPot,
  Compass,
  Dices,
  Dumbbell,
  Flower2,
  Gem,
  HandHeart,
  Heart,
  Hotel,
  Martini,
  Mountain,
  ShoppingBag,
  Shirt,
  Snowflake,
  Sparkles,
  SprayCan,
  Store,
  Tent,
  Ticket,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import type { BusinessCategory } from '@/constants/businessCategories';

type SubcategoryLink = {
  /** Debe coincidir EXACTO con una subcategoría canónica (`businessSubcategories.ts`). */
  subcategory: string;
  /** Etiqueta corta para la tarjeta de la home. */
  displayLabel: string;
  Icon: LucideIcon;
};

type CategoryCardConfig = {
  category: BusinessCategory;
  displayLabel: string;
  Icon: LucideIcon;
  /** Imagen de fondo representativa (en `public/categories`). */
  image: string;
  /** Degradado de la cabecera (de arriba a abajo). */
  gradient: { from: string; via: string; to: string };
  /** Color de los iconos de subcategoría en el pie. */
  accent: string;
  subcategories: SubcategoryLink[];
};

const CATEGORY_CARDS: CategoryCardConfig[] = [
  {
    category: 'Gastronomía',
    displayLabel: 'Dónde comer',
    Icon: UtensilsCrossed,
    image: '/categories/cat-gastronomia.png',
    gradient: { from: '#7f1d1d', via: '#b91c1c', to: '#450a0a' },
    accent: '#c2410c',
    subcategories: [
      { subcategory: 'Restaurante', displayLabel: 'Restaurantes', Icon: UtensilsCrossed },
      { subcategory: 'Cafetería y brunch', displayLabel: 'Cafeterías', Icon: Coffee },
      { subcategory: 'Bar y copas', displayLabel: 'Bar & copas', Icon: Wine },
      { subcategory: 'Borda y cocina de montaña', displayLabel: 'Cocina local', Icon: CookingPot },
    ],
  },
  {
    category: 'Alojamiento',
    displayLabel: 'Dónde dormir',
    Icon: Bed,
    image: '/categories/cat-alojamiento.png',
    gradient: { from: '#1e3a8a', via: '#1d4ed8', to: '#0c1f4d' },
    accent: '#1d4ed8',
    subcategories: [
      { subcategory: 'Hotel', displayLabel: 'Hoteles', Icon: Hotel },
      { subcategory: 'Apartamento turístico', displayLabel: 'Apartamentos', Icon: Building2 },
      { subcategory: 'Alojamiento de montaña', displayLabel: 'De montaña', Icon: Mountain },
      { subcategory: 'Camping y glamping', displayLabel: 'Camping', Icon: Tent },
    ],
  },
  {
    category: 'Ocio y entretenimiento',
    displayLabel: 'Ocio',
    Icon: Ticket,
    image: '/categories/cat-ocio.png',
    gradient: { from: '#4c1d95', via: '#6d28d9', to: '#2e1065' },
    accent: '#6d28d9',
    subcategories: [
      { subcategory: 'Eventos y salas', displayLabel: 'Eventos', Icon: CalendarDays },
      { subcategory: 'Cine y espectáculos', displayLabel: 'Espectáculos', Icon: Clapperboard },
      { subcategory: 'Vida nocturna', displayLabel: 'Vida nocturna', Icon: Martini },
      { subcategory: 'Casino y apuestas', displayLabel: 'Casino', Icon: Dices },
    ],
  },
  {
    category: 'Turismo y experiencias',
    displayLabel: 'Experiencias',
    Icon: Mountain,
    image: '/categories/cat-experiencias.png',
    gradient: { from: '#064e3b', via: '#047857', to: '#022c22' },
    accent: '#047857',
    subcategories: [
      { subcategory: 'Actividades al aire libre', displayLabel: 'Actividades', Icon: Bike },
      { subcategory: 'Estación de esquí y nieve', displayLabel: 'Esquí & nieve', Icon: Snowflake },
      { subcategory: 'Parque de aventura y naturaleza', displayLabel: 'Aventura', Icon: Mountain },
      { subcategory: 'Tours y guías', displayLabel: 'Tours', Icon: Compass },
    ],
  },
  {
    category: 'Compras',
    displayLabel: 'Shopping',
    Icon: ShoppingBag,
    image: '/categories/cat-compras.png',
    gradient: { from: '#831843', via: '#be185d', to: '#500724' },
    accent: '#be185d',
    subcategories: [
      { subcategory: 'Centro comercial', displayLabel: 'Tiendas', Icon: Store },
      { subcategory: 'Moda y complementos', displayLabel: 'Moda', Icon: Shirt },
      { subcategory: 'Joyería, relojería y lujo', displayLabel: 'Joyerías', Icon: Gem },
      { subcategory: 'Perfumería y cosmética', displayLabel: 'Perfumería', Icon: SprayCan },
    ],
  },
  {
    category: 'Bienestar',
    displayLabel: 'Wellness',
    Icon: Heart,
    image: '/categories/cat-bienestar.png',
    gradient: { from: '#134e4a', via: '#0e7490', to: '#042f2e' },
    accent: '#0e7490',
    subcategories: [
      { subcategory: 'Spa termal', displayLabel: 'Spas', Icon: Flower2 },
      { subcategory: 'Masajes y terapias', displayLabel: 'Masajes', Icon: HandHeart },
      { subcategory: 'Belleza y estética', displayLabel: 'Belleza', Icon: Sparkles },
      { subcategory: 'Gimnasio y fitness', displayLabel: 'Fitness', Icon: Dumbbell },
    ],
  },
];

function CategoryCard({
  card,
  onCategory,
  onSubcategory,
}: {
  card: CategoryCardConfig;
  onCategory: (category: string) => void;
  onSubcategory: (category: string, subcategory: string) => void;
}) {
  const { Icon } = card;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onCategory(card.category)}
        aria-label={`Ver ${card.displayLabel}`}
        className="relative flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:h-44"
      >
        <img
          src={card.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${card.gradient.from}cc 0%, ${card.gradient.via}99 50%, ${card.gradient.to}f2 100%)`,
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.18), transparent 60%)' }}
          aria-hidden
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-amber-300/70 backdrop-blur-sm transition-transform duration-500 ease-out group-hover:scale-105 sm:h-18 sm:w-18">
          <Icon className="h-8 w-8 text-white" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="relative text-base font-extrabold uppercase tracking-wide text-white drop-shadow-sm sm:text-lg">
          {card.displayLabel}
        </span>
      </button>

      <div className="grid grid-cols-4 gap-1 px-2 py-4">
        {card.subcategories.map(sub => {
          const SubIcon = sub.Icon;
          return (
            <button
              key={sub.subcategory}
              type="button"
              onClick={() => onSubcategory(card.category, sub.subcategory)}
              aria-label={sub.displayLabel}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SubIcon className="h-5 w-5 shrink-0" style={{ color: card.accent }} strokeWidth={2} aria-hidden />
              <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
                {sub.displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CategoryBar() {
  const navigate = useNavigate();

  const goToCategory = useCallback(
    (grupo: string) => {
      navigate(`/directorio?grupo=${encodeURIComponent(grupo)}`);
    },
    [navigate],
  );

  const goToSubcategory = useCallback(
    (grupo: string, subcategoria: string) => {
      navigate(
        `/directorio?grupo=${encodeURIComponent(grupo)}&subcategoria=${encodeURIComponent(subcategoria)}`,
      );
    },
    [navigate],
  );

  return (
    <section className="container mx-auto px-4 pt-10 pb-4">
      <h2 className="mb-6 text-xl font-bold text-foreground">¿Qué quieres hacer hoy?</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_CARDS.map(card => (
          <CategoryCard
            key={card.category}
            card={card}
            onCategory={goToCategory}
            onSubcategory={goToSubcategory}
          />
        ))}
      </div>
    </section>
  );
}
