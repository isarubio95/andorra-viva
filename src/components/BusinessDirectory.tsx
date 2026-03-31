import BusinessCard from './BusinessCard';
import type { Business } from '@/data/mockData';

interface BusinessDirectoryProps {
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
}

export default function BusinessDirectory({ businesses, onBusinessClick }: BusinessDirectoryProps) {
  return (
    <section id="directorio" className="container mx-auto px-4 py-10">
      <h2 className="mb-6 text-xl font-bold">Todos los resultados</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {businesses.map(biz => (
          <BusinessCard key={biz.id} business={biz} onClick={onBusinessClick} />
        ))}
      </div>

      {businesses.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No se encontraron resultados.</p>
      )}
    </section>
  );
}
