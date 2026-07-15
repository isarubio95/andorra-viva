import type { LucideIcon } from 'lucide-react';
import {
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
  Hotel,
  MapPin,
  Martini,
  Mountain,
  Music,
  Palmtree,
  Shirt,
  ShoppingBag,
  Snowflake,
  Sparkles,
  SprayCan,
  Store,
  Tag,
  Tent,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wine,
} from 'lucide-react';

/** Etiquetas cortas por defecto para la home y el directorio. */
export const DEFAULT_SUBCATEGORY_LABELS: Record<string, string> = {
  Restaurante: 'Restaurantes',
  'Borda y cocina de montaña': 'Cocina local',
  'Bar y copas': 'Bar & copas',
  'Cafetería y brunch': 'Cafeterías',
  Hotel: 'Hoteles',
  'Apartamento turístico': 'Apartamentos',
  'Alojamiento de montaña': 'De montaña',
  'Camping y glamping': 'Camping',
  'Cine y espectáculos': 'Espectáculos',
  'Vida nocturna': 'Vida nocturna',
  'Casino y apuestas': 'Casino',
  'Eventos y salas': 'Eventos',
  'Estación de esquí y nieve': 'Esquí & nieve',
  'Parque de aventura y naturaleza': 'Aventura',
  'Actividades al aire libre': 'Actividades',
  'Tours y guías': 'Tours',
  'Centro comercial': 'Tiendas',
  'Moda y complementos': 'Moda',
  'Perfumería y cosmética': 'Perfumería',
  'Joyería, relojería y lujo': 'Joyerías',
  'Spa termal': 'Spas',
  'Masajes y terapias': 'Masajes',
  'Belleza y estética': 'Belleza',
  'Gimnasio y fitness': 'Fitness',
};

export const SUBCATEGORY_ICON_OPTIONS = [
  { id: 'utensils-crossed', label: 'Restaurante', Icon: UtensilsCrossed },
  { id: 'coffee', label: 'Cafetería', Icon: Coffee },
  { id: 'wine', label: 'Bar / copas', Icon: Wine },
  { id: 'cooking-pot', label: 'Cocina', Icon: CookingPot },
  { id: 'hotel', label: 'Hotel', Icon: Hotel },
  { id: 'building', label: 'Edificio', Icon: Building2 },
  { id: 'mountain', label: 'Montaña', Icon: Mountain },
  { id: 'tent', label: 'Camping', Icon: Tent },
  { id: 'calendar-days', label: 'Eventos', Icon: CalendarDays },
  { id: 'clapperboard', label: 'Espectáculos', Icon: Clapperboard },
  { id: 'martini', label: 'Vida nocturna', Icon: Martini },
  { id: 'dices', label: 'Casino', Icon: Dices },
  { id: 'bike', label: 'Bicicleta / actividad', Icon: Bike },
  { id: 'snowflake', label: 'Nieve', Icon: Snowflake },
  { id: 'compass', label: 'Tours', Icon: Compass },
  { id: 'store', label: 'Tienda', Icon: Store },
  { id: 'shirt', label: 'Moda', Icon: Shirt },
  { id: 'gem', label: 'Joyería / lujo', Icon: Gem },
  { id: 'spray-can', label: 'Perfumería', Icon: SprayCan },
  { id: 'flower', label: 'Spa / flor', Icon: Flower2 },
  { id: 'hand-heart', label: 'Masajes', Icon: HandHeart },
  { id: 'sparkles', label: 'Belleza', Icon: Sparkles },
  { id: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { id: 'map-pin', label: 'Ubicación', Icon: MapPin },
  { id: 'music', label: 'Música', Icon: Music },
  { id: 'palmtree', label: 'Playa / relax', Icon: Palmtree },
  { id: 'tree-pine', label: 'Naturaleza', Icon: TreePine },
  { id: 'waves', label: 'Agua / spa', Icon: Waves },
  { id: 'shopping-bag', label: 'Compras', Icon: ShoppingBag },
  { id: 'tag', label: 'Genérico', Icon: Tag },
] as const;

export type SubcategoryIconId = (typeof SUBCATEGORY_ICON_OPTIONS)[number]['id'];

const ICON_BY_ID = Object.fromEntries(
  SUBCATEGORY_ICON_OPTIONS.map(option => [option.id, option.Icon]),
) as Record<SubcategoryIconId, LucideIcon>;

export const DEFAULT_SUBCATEGORY_ICON_ID: SubcategoryIconId = 'tag';

/** Icono por defecto según nombre canónico de subcategoría. */
export const DEFAULT_SUBCATEGORY_ICONS: Record<string, SubcategoryIconId> = {
  Restaurante: 'utensils-crossed',
  'Cafetería y brunch': 'coffee',
  'Bar y copas': 'wine',
  'Borda y cocina de montaña': 'cooking-pot',
  Hotel: 'hotel',
  'Apartamento turístico': 'building',
  'Alojamiento de montaña': 'mountain',
  'Camping y glamping': 'tent',
  'Eventos y salas': 'calendar-days',
  'Cine y espectáculos': 'clapperboard',
  'Vida nocturna': 'martini',
  'Casino y apuestas': 'dices',
  'Actividades al aire libre': 'bike',
  'Estación de esquí y nieve': 'snowflake',
  'Parque de aventura y naturaleza': 'mountain',
  'Tours y guías': 'compass',
  'Centro comercial': 'store',
  'Moda y complementos': 'shirt',
  'Joyería, relojería y lujo': 'gem',
  'Perfumería y cosmética': 'spray-can',
  'Spa termal': 'flower',
  'Masajes y terapias': 'hand-heart',
  'Belleza y estética': 'sparkles',
  'Gimnasio y fitness': 'dumbbell',
};

export function isSubcategoryIconId(value: string): value is SubcategoryIconId {
  return value in ICON_BY_ID;
}

/** Un valor de icono es "personalizado" cuando apunta a una URL subida a R2. */
export function isCustomIconValue(value?: string | null): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

export type ResolvedSubcategoryIcon =
  | { kind: 'preset'; iconId: SubcategoryIconId; Icon: LucideIcon }
  | { kind: 'custom'; url: string };

export function resolveSubcategoryIcon(
  subcategory: string,
  icons: Record<string, string> = {},
): ResolvedSubcategoryIcon {
  const value = icons[subcategory];
  if (isCustomIconValue(value)) {
    return { kind: 'custom', url: value };
  }
  const iconId =
    value && isSubcategoryIconId(value)
      ? value
      : DEFAULT_SUBCATEGORY_ICONS[subcategory] ?? DEFAULT_SUBCATEGORY_ICON_ID;
  return { kind: 'preset', iconId, Icon: ICON_BY_ID[iconId] ?? Tag };
}

export function resolveSubcategoryIconId(
  subcategory: string,
  icons: Record<string, string> = {},
): SubcategoryIconId {
  const value = icons[subcategory];
  if (value && !isCustomIconValue(value) && isSubcategoryIconId(value)) return value;
  return DEFAULT_SUBCATEGORY_ICONS[subcategory] ?? DEFAULT_SUBCATEGORY_ICON_ID;
}

export function getSubcategoryIconComponent(
  subcategory: string,
  icons: Record<string, string> = {},
): LucideIcon {
  const resolved = resolveSubcategoryIcon(subcategory, icons);
  return resolved.kind === 'preset' ? resolved.Icon : Tag;
}

export function getSubcategoryIconOption(iconId: SubcategoryIconId) {
  return SUBCATEGORY_ICON_OPTIONS.find(option => option.id === iconId) ?? SUBCATEGORY_ICON_OPTIONS.at(-1)!;
}

export function getSubcategoryDisplayLabel(
  subcategory: string,
  labels: Record<string, string> = DEFAULT_SUBCATEGORY_LABELS,
): string {
  return labels[subcategory] ?? subcategory;
}

/** @deprecated Usar getSubcategoryIconComponent con mapa de iconos. */
export function getSubcategoryIcon(subcategory: string): LucideIcon {
  return getSubcategoryIconComponent(subcategory);
}

export const SUBCATEGORY_ICONS = Object.fromEntries(
  Object.entries(DEFAULT_SUBCATEGORY_ICONS).map(([name, id]) => [name, ICON_BY_ID[id]]),
) as Record<string, LucideIcon>;
