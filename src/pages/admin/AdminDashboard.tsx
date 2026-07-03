import { useEffect, useState } from 'react';
import { Building2, CreditCard, MessageSquare, Users } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import { adminGetDashboardStats, type AdminDashboardStats } from '@/services/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatEuros(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Resumen</h2>
          <p className="text-muted-foreground">
            Vista general de usuarios, negocios y suscripciones activas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Usuarios"
            value={String(stats?.users_total ?? 0)}
            icon={Users}
            loading={loading}
          />
          <StatCard
            title="Negocios"
            value={String(stats?.businesses_total ?? 0)}
            icon={Building2}
            loading={loading}
          />
          <StatCard
            title="Reseñas"
            value={String(stats?.reviews_total ?? 0)}
            icon={MessageSquare}
            loading={loading}
          />
          <StatCard
            title="Suscripciones activas"
            value={String(stats?.active_subscriptions ?? 0)}
            description={
              stats?.revenue_events_month
                ? `${formatEuros(stats.revenue_events_month)} este mes (Stripe)`
                : 'Pagos vía Stripe'
            }
            icon={CreditCard}
            loading={loading}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
            <CardDescription>
              Gestiona usuarios, pagos con Stripe, textos de la web y categorías desde el menú
              lateral.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Usuarios: cambiar roles (basic, professional, admin) y planes</li>
              <li>Pagos: historial de eventos Stripe y suscripciones</li>
              <li>Planes: editar precios y características de suscripción</li>
              <li>Reseñas: moderar y eliminar reseñas de la comunidad</li>
              <li>Textos web: eslogan, CTAs y títulos de secciones</li>
              <li>Categorías: nombres visibles en la home y directorio</li>
              <li>Negocios: marcar premium/recomendado o eliminar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
