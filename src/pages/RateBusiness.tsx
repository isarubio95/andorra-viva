import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getBusinessById, getMyReviewForBusiness, submitBusinessReview } from '@/services/api';
import type { Business } from '@/types/domain';
import { useToast } from '@/hooks/use-toast';
import { isOwnBusiness } from '@/lib/business-access';

export default function RateBusiness() {
  const { businessId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const nextParam = useMemo(
    () => encodeURIComponent(`${location.pathname}${location.search}`),
    [location.pathname, location.search]
  );

  useEffect(() => {
    if (!businessId) return;
    setLoadingBusiness(true);
    getBusinessById(businessId)
      .then(setBusiness)
      .finally(() => setLoadingBusiness(false));
  }, [businessId]);

  useEffect(() => {
    if (authLoading || !user || !businessId || !business) return;
    if (isOwnBusiness(user.id, business)) return;
    getMyReviewForBusiness(businessId, user.id).then(review => {
      if (!review) return;
      setHasExistingReview(true);
      setRating(review.rating);
      setComment(review.comment ?? '');
    });
  }, [authLoading, user, businessId, business]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && businessId) {
      navigate(`/login?mode=review&next=${nextParam}`, { replace: true });
    }
  }, [authLoading, user, navigate, businessId, nextParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (business && user && isOwnBusiness(user.id, business)) {
      toast({
        title: 'No disponible',
        description: 'No puedes valorar un negocio del que eres titular.',
        variant: 'destructive',
      });
      return;
    }
    if (!businessId || rating < 1) {
      toast({ title: 'Selecciona una valoración de 1 a 5 estrellas', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const res = await submitBusinessReview({
      businessId,
      rating,
      comment,
    });
    setSaving(false);

    if (!res.ok) {
      toast({ title: 'No se pudo guardar la reseña', description: res.error, variant: 'destructive' });
      return;
    }

    setHasExistingReview(true);
    toast({
      title: hasExistingReview ? 'Reseña actualizada' : '¡Gracias por tu reseña!',
      description: 'Tu valoración se ha guardado correctamente.',
    });
  };

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-xl space-y-4">
          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link to="/directorio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al directorio
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Valorar negocio</CardTitle>
              <CardDescription>
                {loadingBusiness
                  ? 'Cargando negocio...'
                  : business
                    ? `Comparte tu experiencia en ${business.name}`
                    : 'No se encontró el negocio que intentas valorar.'}
              </CardDescription>
            </CardHeader>

            {business && isOwnBusiness(user.id, business) && (
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No puedes enviar reseñas sobre un negocio del que eres titular. Comparte el enlace de valoración con
                  tus clientes desde tu panel.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/mi-cuenta">Ir a mi cuenta</Link>
                </Button>
              </CardContent>
            )}
            {business && !isOwnBusiness(user.id, business) && (
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tu valoración</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(value => (
                        <button
                          key={value}
                          type="button"
                          onMouseEnter={() => setHover(value)}
                          onMouseLeave={() => setHover(0)}
                          onClick={() => setRating(value)}
                          className="rounded-md p-1 transition-transform hover:scale-110"
                          aria-label={`${value} estrellas`}
                        >
                          <Star
                            className={`h-8 w-8 ${(hover || rating) >= value ? 'fill-premium text-premium' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Comentario (opcional)</p>
                    <Textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Cuéntanos qué tal fue tu experiencia..."
                      maxLength={1000}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving || rating < 1}>
                    {saving ? 'Guardando...' : hasExistingReview ? 'Actualizar reseña' : 'Enviar reseña'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
