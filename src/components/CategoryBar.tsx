import { UtensilsCrossed, Sparkles, Music, ShoppingBag, MountainSnow, Landmark } from 'lucide-react';
import catGastro from '@/assets/cat-gastronomia.jpg';
import catWellness from '@/assets/cat-wellness.jpg';
import catNoche from '@/assets/cat-noche.jpg';
import catShopping from '@/assets/cat-shopping.jpg';
import catMontana from '@/assets/cat-montana.jpg';
import catCultura from '@/assets/cat-cultura.jpg';

const categories = [
  { label: 'Gastronomía', icon: UtensilsCrossed, image: catGastro },
  { label: 'Wellness', icon: Sparkles, image: catWellness },
  { label: 'Noche', icon: Music, image: catNoche },
  { label: 'Shopping', icon: ShoppingBag, image: catShopping },
  { label: 'Montaña', icon: MountainSnow, image: catMontana },
  { label: 'Cultura', icon: Landmark, image: catCultura },
];

interface CategoryBarProps {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="mb-6 text-xl font-bold">Categorías</h2>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {categories.map(cat => {
          const isActive = selected === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onSelect(isActive ? null : cat.label)}
              className={`group relative overflow-hidden rounded-xl aspect-[4/3] transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-accent ring-offset-2' : ''}`}
            >
              <img
                src={cat.image}
                alt={cat.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <cat.icon className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white">{cat.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
