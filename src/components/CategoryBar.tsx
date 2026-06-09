import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '@/constants/businessCategories';
import { CATEGORY_MARKER_CONFIG, CATEGORY_MARKER_DEFAULT_COLOR } from '@/lib/map-category-marker';

const HOME_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  Gastronomía: 'Dónde comer',
  'Turismo y experiencias': 'Qué hacer',
  Compras: 'Ir de compras',
  Alojamiento: 'Dónde dormir',
  'Ocio y entretenimiento': 'Ocio y entretenimiento',
  Bienestar: 'Bienestar',
};

const categories = BUSINESS_CATEGORIES.map(label => ({
  label,
  displayLabel: HOME_CATEGORY_LABELS[label],
  ...CATEGORY_MARKER_CONFIG[label],
}));

function CategoryCard({
  cat,
  onSelect,
}: {
  cat: (typeof categories)[number];
  onSelect: () => void;
}) {
  const color = cat.color ?? CATEGORY_MARKER_DEFAULT_COLOR;
  const Icon = cat.Icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full min-h-30 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border bg-card px-3 py-5 text-center transition-[transform,box-shadow,translate] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon
        className="h-8 w-8 shrink-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        style={{ color }}
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-sm font-medium leading-tight text-foreground">
        {cat.displayLabel}
      </span>
    </button>
  );
}

export default function CategoryBar() {
  const navigate = useNavigate();

  const goToDirectory = useCallback(
    (grupo: string) => {
      navigate(`/directorio?grupo=${encodeURIComponent(grupo)}`);
    },
    [navigate],
  );

  return (
    <section className="container mx-auto px-4 pt-10 pb-4">
      <h2 className="mb-6 text-xl font-bold text-foreground">¿Qué quieres hacer hoy?</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map(cat => (
          <CategoryCard key={cat.label} cat={cat} onSelect={() => goToDirectory(cat.label)} />
        ))}
      </div>
    </section>
  );
}
