import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Star } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import { adminDeleteReview, adminListReviews, type AdminReviewRow } from '@/services/admin-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { useTableView } from '@/hooks/use-table-view';
import { SortableTableHead } from '@/components/admin/SortableTableHead';
import { TablePagination } from '@/components/admin/TablePagination';

const PAGE_SIZE = 10;
type ReviewSortKey = 'business' | 'user' | 'rating' | 'comment' | 'date';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      <Star className="h-3.5 w-3.5 fill-current" />
      <span className="text-sm font-medium text-foreground">{rating}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setReviews(await adminListReviews());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(
      r =>
        r.user_name.toLowerCase().includes(q) ||
        r.business_name.toLowerCase().includes(q) ||
        (r.comment ?? '').toLowerCase().includes(q),
    );
  }, [reviews, query]);

  const comparators = useMemo(
    (): Record<ReviewSortKey, (a: AdminReviewRow, b: AdminReviewRow) => number> => ({
      business: (a, b) => a.business_name.localeCompare(b.business_name, 'es'),
      user: (a, b) => a.user_name.localeCompare(b.user_name, 'es'),
      rating: (a, b) => a.rating - b.rating,
      comment: (a, b) => (a.comment ?? '').localeCompare(b.comment ?? '', 'es'),
      date: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    }),
    [],
  );

  const { rows, sort, toggleSort, page, setPage, totalPages, totalItems } = useTableView(
    filtered,
    comparators,
    { key: 'date', direction: 'desc' },
    PAGE_SIZE,
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await adminDeleteReview(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Reseña eliminada' });
    void load();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reseñas</h2>
          <p className="text-muted-foreground">
            Modera las reseñas de la comunidad. Al eliminar, se recalcula la valoración del negocio.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por negocio, usuario o comentario..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Negocio" sortKey="business" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Usuario" sortKey="user" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Nota" sortKey="rating" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Comentario" sortKey="comment" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Fecha" sortKey="date" sort={sort} onSort={toggleSort} />
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map(review => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.business_name}</TableCell>
                      <TableCell>{review.user_name}</TableCell>
                      <TableCell>
                        <RatingStars rating={review.rating} />
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {review.comment ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(review)}
                          aria-label="Eliminar reseña"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No hay reseñas que coincidan.</p>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}

        <Button variant="outline" onClick={() => void load()}>
          Actualizar lista
        </Button>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará la reseña de {deleteTarget?.user_name} en «{deleteTarget?.business_name}
                ». La valoración del negocio se actualizará automáticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}
