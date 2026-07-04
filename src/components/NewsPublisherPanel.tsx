import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ImagePlus, Loader2, Newspaper, Trash2 } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  BUSINESS_IMAGE_ACCEPT,
  filterBusinessImageFiles,
} from '@/lib/business-image-upload';
import { accountDashboardPath } from '@/lib/account-dashboard';
import { canPublishNews } from '@/lib/news-access';
import {
  deleteMyNewsPost,
  getMyNewsMonthlyQuota,
  getMyNewsPosts,
  submitNewsPost,
  uploadNewsImage,
} from '@/services/api';
import type { NewsMonthlyQuota, NewsPost } from '@/types/domain';

function PremiumRequiredNotice({ hasProAccess }: { hasProAccess: boolean }) {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Crown className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Necesitas ser Premium para publicar noticias</p>
          <p className="text-sm text-muted-foreground">
            Puedes leer todas las noticias del directorio, pero solo el plan Premium permite publicar
            (una al mes, con foto opcional).
          </p>
          <Button asChild size="sm">
            <Link to={hasProAccess ? accountDashboardPath('plan') : '/signup?mode=upgrade'}>
              {hasProAccess ? 'Ver planes' : 'Actualiza tu cuenta'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewsPublisherPanel() {
  const { user, hasProAccess, roleLoading, planId, subscriptionStatus } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremiumPublisher = canPublishNews(planId, subscriptionStatus);

  const [postsLoading, setPostsLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [quota, setQuota] = useState<NewsMonthlyQuota | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canPublishNow = useMemo(
    () => isPremiumPublisher && !!quota?.can_publish && (quota.remaining_this_month ?? 0) > 0,
    [isPremiumPublisher, quota],
  );

  const loadPosts = async () => {
    setPostsLoading(true);
    const nextPosts = await getMyNewsPosts();
    setPosts(nextPosts);
    setPostsLoading(false);
  };

  const loadQuota = async () => {
    setQuotaLoading(true);
    const nextQuota = await getMyNewsMonthlyQuota();
    setQuota(nextQuota);
    setQuotaLoading(false);
  };

  const refreshData = async () => {
    await loadPosts();
    if (isPremiumPublisher) await loadQuota();
  };

  useEffect(() => {
    if (roleLoading) return;
    void loadPosts();
    if (isPremiumPublisher) void loadQuota();
  }, [roleLoading, isPremiumPublisher]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    const { accepted, oversized, invalidType } = filterBusinessImageFiles([file]);
    if (invalidType.length > 0) {
      toast({
        title: 'Formato no válido',
        description: 'Usa JPEG, PNG, WebP o GIF.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    if (oversized.length > 0) {
      toast({
        title: 'Imagen demasiado grande',
        description: 'El tamaño máximo es 5 MiB.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    setImageFile(accepted[0] ?? null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !canPublishNow) return;

    setSubmitting(true);
    let imageUrl: string | null = null;

    if (imageFile) {
      const upload = await uploadNewsImage(user.id, imageFile);
      if (upload.error || !upload.url) {
        toast({
          title: 'Error al subir la imagen',
          description: upload.error ?? 'Inténtalo de nuevo.',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }
      imageUrl = upload.url;
    }

    const result = await submitNewsPost({ title, body, imageUrl });
    setSubmitting(false);

    if (!result.ok) {
      toast({
        title: 'No se pudo publicar',
        description: result.error ?? 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Noticia publicada', description: 'Ya está visible en la sección de noticias.' });
    resetForm();
    await refreshData();
  };

  const handleDelete = async () => {
    if (!deletePostId) return;
    setDeleting(true);
    const result = await deleteMyNewsPost(deletePostId);
    setDeleting(false);
    setDeletePostId(null);

    if (!result.ok) {
      toast({
        title: 'No se pudo eliminar',
        description: result.error ?? 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Noticia eliminada' });
    await refreshData();
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Publicar noticia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mis publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Publicar noticia
            </CardTitle>
            <CardDescription>
              {isPremiumPublisher
                ? 'Comparte novedades de tu negocio. Puedes publicar 1 noticia al mes con foto opcional.'
                : 'Publica novedades de tu negocio en la sección pública de noticias.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPremiumPublisher ? (
              <PremiumRequiredNotice hasProAccess={hasProAccess} />
            ) : (
              <>
                {quotaLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : quota?.posted_this_month ? (
                  <Badge variant="secondary">Ya has publicado una noticia este mes</Badge>
                ) : quota?.can_publish ? (
                  <Badge className="recommended-badge border-0">Te queda 1 publicación este mes</Badge>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="news-title">Título</Label>
                    <Input
                      id="news-title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título de la noticia"
                      maxLength={120}
                      disabled={!canPublishNow || submitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="news-body">Contenido</Label>
                    <Textarea
                      id="news-body"
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      placeholder="Escribe la noticia..."
                      rows={6}
                      maxLength={4000}
                      disabled={!canPublishNow || submitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="news-image">Foto (opcional)</Label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canPublishNow || submitting}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {imageFile ? 'Cambiar imagen' : 'Añadir imagen'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="news-image"
                        type="file"
                        accept={BUSINESS_IMAGE_ACCEPT}
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={!canPublishNow || submitting}
                      />
                      {imageFile ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={submitting}
                          onClick={() => {
                            setImageFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Quitar imagen
                        </Button>
                      ) : null}
                    </div>
                    {imagePreview ? (
                      <div className="overflow-hidden rounded-lg border">
                        <img src={imagePreview} alt="" className="max-h-56 w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                  <Button type="submit" disabled={!canPublishNow || submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publicando…
                      </>
                    ) : (
                      'Publicar noticia'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis publicaciones</CardTitle>
            <CardDescription>Historial de noticias que has compartido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {postsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no has publicado ninguna noticia.</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletePostId(post.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                  <NewsCard post={post} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={open => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta noticia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará de la sección pública de noticias. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
