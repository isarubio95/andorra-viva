import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import { adminDeleteBusiness, adminListBusinesses, adminUpdateBusiness } from '@/services/admin-api';
import type { Business } from '@/types/domain';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { useSiteContent } from '@/contexts/SiteContentContext';
import { useTableView } from '@/hooks/use-table-view';
import { SortableTableHead } from '@/components/admin/SortableTableHead';
import { TablePagination } from '@/components/admin/TablePagination';

const PAGE_SIZE = 10;
type BusinessSortKey = 'business' | 'category' | 'premium' | 'recommended';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { getCategoryLabel } = useSiteContent();

  const load = async () => {
    setLoading(true);
    setBusinesses(await adminListBusinesses());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q),
    );
  }, [businesses, query]);

  const comparators = useMemo(
    (): Record<BusinessSortKey, (a: Business, b: Business) => number> => ({
      business: (a, b) => a.name.localeCompare(b.name, 'es'),
      category: (a, b) =>
        getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category), 'es'),
      premium: (a, b) => Number(a.is_premium) - Number(b.is_premium),
      recommended: (a, b) => Number(!!a.is_recommended) - Number(!!b.is_recommended),
    }),
    [getCategoryLabel],
  );

  const { rows, sort, toggleSort, page, setPage, totalPages, totalItems } = useTableView(
    filtered,
    comparators,
    { key: 'business', direction: 'asc' },
    PAGE_SIZE,
  );

  const toggleFlag = async (
    business: Business,
    field: 'is_premium' | 'is_recommended',
    value: boolean,
  ) => {
    setSavingId(business.id);
    const res = await adminUpdateBusiness(business.id, { [field]: value });
    setSavingId(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    setBusinesses(prev =>
      prev.map(b => (b.id === business.id ? { ...b, [field]: value } : b)),
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await adminDeleteBusiness(deleteTarget.id);
    setDeleteTarget(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Negocio eliminado' });
    void load();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Negocios</h2>
          <p className="text-muted-foreground">
            Modera negocios: marca premium o recomendado, o elimina entradas.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar negocio..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Negocio" sortKey="business" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Categoría" sortKey="category" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Premium" sortKey="premium" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Recomendado" sortKey="recommended" sort={sort} onSort={toggleSort} />
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map(biz => (
                    <TableRow key={biz.id}>
                      <TableCell>
                        <div className="font-medium">{biz.name}</div>
                        <div className="text-xs text-muted-foreground">{biz.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getCategoryLabel(biz.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`premium-${biz.id}`}
                            checked={biz.is_premium}
                            disabled={savingId === biz.id}
                            onCheckedChange={v => void toggleFlag(biz, 'is_premium', v)}
                          />
                          <Label htmlFor={`premium-${biz.id}`} className="sr-only">
                            Premium
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`rec-${biz.id}`}
                            checked={!!biz.is_recommended}
                            disabled={savingId === biz.id}
                            onCheckedChange={v => void toggleFlag(biz, 'is_recommended', v)}
                          />
                          <Label htmlFor={`rec-${biz.id}`} className="sr-only">
                            Recomendado
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(biz)}
                          aria-label={`Eliminar ${biz.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No hay negocios que coincidan.</p>
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
              <AlertDialogTitle>¿Eliminar negocio?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará «{deleteTarget?.name}» y todas sus reseñas. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmDelete()}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}
