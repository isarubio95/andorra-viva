import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import { adminDeleteNewsPost, adminListNewsPosts, type AdminNewsPostRow } from '@/services/admin-api';
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
type NewsSortKey = 'title' | 'author' | 'business' | 'date';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminNews() {
  const [posts, setPosts] = useState<AdminNewsPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminNewsPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setPosts(await adminListNewsPosts());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q) ||
        (p.business_name ?? '').toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q),
    );
  }, [posts, query]);

  const comparators = useMemo(
    (): Record<NewsSortKey, (a: AdminNewsPostRow, b: AdminNewsPostRow) => number> => ({
      title: (a, b) => a.title.localeCompare(b.title, 'es'),
      author: (a, b) => a.author_name.localeCompare(b.author_name, 'es'),
      business: (a, b) => (a.business_name ?? '').localeCompare(b.business_name ?? '', 'es'),
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
    const res = await adminDeleteNewsPost(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Noticia eliminada' });
    void load();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Noticias</h2>
          <p className="text-muted-foreground">
            Modera las noticias publicadas por cuentas Premium. Puedes eliminar las que no cumplan las normas.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título, autor, negocio o texto..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Título" sortKey="title" sort={sort} onSort={toggleSort} />
              <SortableTableHead label="Autor" sortKey="author" sort={sort} onSort={toggleSort} />
              <SortableTableHead label="Negocio" sortKey="business" sort={sort} onSort={toggleSort} />
              <SortableTableHead label="Fecha" sortKey="date" sort={sort} onSort={toggleSort} />
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{post.body}</div>
                    </TableCell>
                    <TableCell>{post.author_name}</TableCell>
                    <TableCell>{post.business_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(post)}
                        aria-label="Eliminar noticia"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No hay noticias que coincidan.</p>
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
              <AlertDialogTitle>¿Eliminar noticia?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará «{deleteTarget?.title}» de {deleteTarget?.author_name}. Esta acción no se
                puede deshacer.
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
