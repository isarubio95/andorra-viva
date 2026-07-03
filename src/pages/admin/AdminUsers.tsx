import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import {
  adminListUsers,
  adminUpdateSubscription,
  adminUpdateUserRole,
  type AdminUserRow,
} from '@/services/admin-api';
import { getPlans } from '@/services/api';
import type { Plan } from '@/types/domain';
import type { UserRole } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useTableView } from '@/hooks/use-table-view';
import { SortableTableHead } from '@/components/admin/SortableTableHead';
import { TablePagination } from '@/components/admin/TablePagination';

const PAGE_SIZE = 10;
const ROLES: UserRole[] = ['basic', 'professional', 'admin'];
type UserSortKey = 'user' | 'role' | 'plan' | 'status' | 'stripe';
const STATUSES = ['active', 'trialing', 'past_due', 'canceled'] as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [userRows, planRows] = await Promise.all([adminListUsers(), getPlans()]);
    setUsers(userRows);
    setPlans(planRows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.role.includes(q),
    );
  }, [users, query]);

  const planNameById = useMemo(
    () => Object.fromEntries(plans.map(p => [p.id, p.name])),
    [plans],
  );

  const comparators = useMemo(
    (): Record<UserSortKey, (a: AdminUserRow, b: AdminUserRow) => number> => ({
      user: (a, b) =>
        (a.full_name || a.email).localeCompare(b.full_name || b.email, 'es'),
      role: (a, b) => a.role.localeCompare(b.role),
      plan: (a, b) =>
        (planNameById[a.plan_id] ?? a.plan_id).localeCompare(
          planNameById[b.plan_id] ?? b.plan_id,
          'es',
        ),
      status: (a, b) => a.subscription_status.localeCompare(b.subscription_status),
      stripe: (a, b) =>
        (a.stripe_customer_id ?? '').localeCompare(b.stripe_customer_id ?? ''),
    }),
    [planNameById],
  );

  const { rows, sort, toggleSort, page, setPage, totalPages, totalItems } = useTableView(
    filtered,
    comparators,
    { key: 'user', direction: 'asc' },
    PAGE_SIZE,
  );

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    const res = await adminUpdateUserRole(userId, role);
    setSavingId(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Rol actualizado' });
    void load();
  };

  const handlePlanChange = async (userId: string, planId: string, status: string) => {
    setSavingId(userId);
    const res = await adminUpdateSubscription(userId, planId, status);
    setSavingId(null);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Suscripción actualizada' });
    void load();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">
            Gestiona roles y suscripciones de todos los usuarios registrados.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por email o nombre..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Usuario" sortKey="user" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Rol" sortKey="role" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Plan" sortKey="plan" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Estado" sortKey="status" sort={sort} onSort={toggleSort} />
                <SortableTableHead label="Stripe" sortKey="stripe" sort={sort} onSort={toggleSort} />
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
                : rows.map(user => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          disabled={savingId === user.user_id}
                          onValueChange={v => void handleRoleChange(user.user_id, v as UserRole)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.plan_id}
                          disabled={savingId === user.user_id}
                          onValueChange={v =>
                            void handlePlanChange(user.user_id, v, user.subscription_status)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.subscription_status}
                          disabled={savingId === user.user_id}
                          onValueChange={v =>
                            void handlePlanChange(user.user_id, user.plan_id, v)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.stripe_customer_id ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {user.stripe_customer_id.slice(0, 12)}…
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No hay usuarios que coincidan.</p>
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
      </div>
    </AdminShell>
  );
}
