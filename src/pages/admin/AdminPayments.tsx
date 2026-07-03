import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import {
  adminListPaymentEvents,
  adminListUsers,
  type AdminUserRow,
  type PaymentEventRow,
} from '@/services/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function formatEuros(cents: number | null, currency: string | null) {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: (currency ?? 'eur').toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AdminPayments() {
  const [events, setEvents] = useState<PaymentEventRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminListPaymentEvents(), adminListUsers()])
      .then(([ev, us]) => {
        setEvents(ev);
        setUsers(us);
      })
      .finally(() => setLoading(false));
  }, []);

  const stripeLinked = users.filter(u => u.stripe_customer_id).length;
  const paidSubs = users.filter(
    u =>
      u.subscription_status === 'active' &&
      u.plan_id !== 'free',
  ).length;

  const emailByUserId = Object.fromEntries(users.map(u => [u.user_id, u.email]));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pagos y Stripe</h2>
          <p className="text-muted-foreground">
            Suscripciones vinculadas a Stripe y historial de eventos de pago.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes Stripe</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stripeLinked}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Suscripciones de pago</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{paidSubs}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{events.length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Stripe</CardTitle>
            <CardDescription>
              Despliega las Edge Functions en Supabase y configura las variables de entorno
              (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*). Los usuarios profesionales
              podrán pagar desde su panel de cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-3 text-lg font-medium">Historial de eventos</h3>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aún no hay eventos. Se registrarán automáticamente vía webhook de Stripe.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map(ev => (
                    <TableRow key={ev.id}>
                      <TableCell className="text-sm">{formatDate(ev.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ev.event_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ev.user_id ? (emailByUserId[ev.user_id] ?? ev.user_id.slice(0, 8)) : '—'}
                      </TableCell>
                      <TableCell>{formatEuros(ev.amount_cents, ev.currency)}</TableCell>
                      <TableCell>{ev.status ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      </div>
    </AdminShell>
  );
}
