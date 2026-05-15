import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessCard from '@/components/BusinessCard';
import ReviewsPanel from '@/components/ReviewsPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getBusinesses } from '@/services/api';
import { isOwnBusiness } from '@/lib/business-access';
import type { Business } from '@/types/domain';

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBusinesses()
      .then(data => {
        if (!cancelled) setAllBusinesses(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteBusinesses = allBusinesses.filter(
    b => favorites.has(b.id) && user && !isOwnBusiness(user.id, b)
  );

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Heart className="h-7 w-7 text-destructive" />
              Mis favoritos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Negocios que has guardado</p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : favoriteBusinesses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {favoriteBusinesses.map(biz => (
                <BusinessCard key={biz.id} business={biz} onClick={setSelectedBusiness} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No tienes favoritos aún</p>
                <p className="text-sm text-muted-foreground">Explora el directorio y guarda tus negocios favoritos</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/directorio')}>
                Explorar directorio
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {selectedBusiness && (
        <ReviewsPanel business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />
      )}
    </div>
  );
}
