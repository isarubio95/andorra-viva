import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroMap from '@/components/HeroMap';
import CategoryBar from '@/components/CategoryBar';
import BusinessDirectory from '@/components/BusinessDirectory';
import BusinessCard from '@/components/BusinessCard';
import ReviewsPanel from '@/components/ReviewsPanel';
import Footer from '@/components/Footer';
import { getBusinesses, getTopVisitedBusinessesOfMonth, type TopVisitedBusiness } from '@/services/api';
import type { Business } from '@/types/domain';
import { Skeleton } from '@/components/ui/skeleton';
export default function Index() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [topVisitedLoading, setTopVisitedLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [topVisited, setTopVisited] = useState<TopVisitedBusiness[]>([]);

  useEffect(() => {
    setLoading(true);
    getBusinesses()
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTopVisitedLoading(true);
    getTopVisitedBusinessesOfMonth(6)
      .then(setTopVisited)
      .finally(() => setTopVisitedLoading(false));
  }, []);

  const premiumRecommendations = businesses.filter(b => b.is_premium);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col">
        <Header />
        <HeroMap businesses={loading ? [] : businesses} onBusinessClick={setSelectedBusiness} />
        <CategoryBar />
        {!loading && premiumRecommendations.length > 0 && (
          <section className="container mx-auto px-4 pt-10">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <span>🏅</span> Recomendaciones premium
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {premiumRecommendations.map(biz => (
                <BusinessCard key={biz.id} business={biz} onClick={setSelectedBusiness} />
              ))}
            </div>
          </section>
        )}
        {(topVisitedLoading || topVisited.length > 0) && (
          <section className="container mx-auto px-4 pt-10">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <span>🔥</span> Más visitados del mes
            </h2>
            {topVisitedLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {topVisited.map(biz => (
                  <BusinessCard key={biz.id} business={biz} onClick={setSelectedBusiness} />
                ))}
              </div>
            )}
          </section>
        )}
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
          <BusinessDirectory businesses={businesses} onBusinessClick={setSelectedBusiness} />
        )}
      </div>
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
