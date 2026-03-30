import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroMap from '@/components/HeroMap';
import CategoryBar from '@/components/CategoryBar';
import BusinessDirectory from '@/components/BusinessDirectory';
import ReviewsPanel from '@/components/ReviewsPanel';
import Footer from '@/components/Footer';
import { getBusinesses } from '@/services/api';
import type { Business } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';

const categoryMap: Record<string, string[]> = {
  'Gastronomía': ['Restaurante'],
  'Wellness': ['SPA & Wellness'],
  'Noche': ['Bar', 'Discoteca'],
  'Shopping': ['Tienda', 'Shopping'],
  'Montaña': ['Hotel', 'Actividades'],
  'Cultura': ['Museo', 'Cultura'],
};

export default function Index() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    setLoading(true);
    getBusinesses()
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCategory
    ? businesses.filter(b => {
        const cats = categoryMap[selectedCategory] || [];
        return cats.some(c => b.category.toLowerCase().includes(c.toLowerCase()));
      })
    : businesses;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroMap businesses={loading ? [] : businesses} onBusinessClick={setSelectedBusiness} />
      <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />
      {loading ? (
        <section className="container mx-auto px-4 py-10">
          <Skeleton className="mb-6 h-7 w-48" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="pt-2">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <BusinessDirectory businesses={filtered} onBusinessClick={setSelectedBusiness} />
      )}
      <Footer />

      {selectedBusiness && (
        <ReviewsPanel
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </div>
  );
}
