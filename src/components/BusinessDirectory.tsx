import BusinessCard from './BusinessCard';
import type { Business } from '@/data/mockData';

interface BusinessDirectoryProps {
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
}

export default function BusinessDirectory({ businesses, onBusinessClick }: BusinessDirectoryProps) {
  const premium = businesses.filter(b => b.is_premium);
  const regular = businesses.filter(b => !b.is_premium);

  return (
    <section id="directorio" className="container mx-auto px-4 py-10">
      {premium.length > 0 && (
        <>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <span>👑</span> Recomendados Premium
          </h2>
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {premium.map(biz => (
              <BusinessCard key={biz.id} business={biz} onClick={onBusinessClick} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-6 text-xl font-bold">Todos los resultados</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {regular.map(biz => (
          <BusinessCard key={biz.id} business={biz} onClick={onBusinessClick} />
        ))}
      </div>

      {businesses.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No se encontraron resultados.</p>
      )}
    </section>
  );
}
