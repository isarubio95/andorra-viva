import {
  Eye,
  Star,
  MousePointerClick,
  MessageCircle,
  Phone,
  Navigation,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { BusinessClickType, BusinessMetricRow } from '@/services/api';
import {
  METRICS_PERIOD_OPTIONS,
  getMetricsPeriodLabel,
  type MetricsPeriodId,
} from '@/lib/metrics-period';
import { cn } from '@/lib/utils';

const CLICK_TYPE_LABELS: Record<BusinessClickType, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Llamada telefónica',
  directions: 'Cómo llegar',
  website: 'Sitio web',
};

const CLICK_TYPE_ICONS: Record<BusinessClickType, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  phone: Phone,
  directions: Navigation,
  website: Globe,
};

function MetricKpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function formatChartBucket(value: string, periodDays: number): string {
  if (periodDays === 1) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return String(value).slice(11, 16);
  }
  if (periodDays <= 7) {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }
  if (periodDays <= 90) {
    return String(value).slice(5);
  }
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function getChartTrendLabel(periodDays: number): string {
  return periodDays === 1 ? 'Evolución por hora' : 'Evolución diaria';
}

function PeriodLineChart({
  data,
  dataKey,
  label,
  colorVar,
  periodDays,
  className,
}: {
  data: { date: string; [key: string]: string | number }[];
  dataKey: string;
  label: string;
  colorVar: string;
  periodDays: number;
  className?: string;
}) {
  return (
    <ChartContainer
      config={{
        [dataKey]: {
          label,
          color: colorVar,
        },
      }}
      className={cn('h-48 w-full', className)}
    >
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={periodDays === 1 ? 4 : periodDays > 90 ? 24 : 8}
          tickFormatter={value => formatChartBucket(String(value), periodDays)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={value => formatChartBucket(String(value), periodDays)}
            />
          }
        />
        <Line
          dataKey={dataKey}
          type="monotone"
          stroke={`var(--color-${dataKey})`}
          strokeWidth={2}
          dot={periodDays <= 7}
        />
      </LineChart>
    </ChartContainer>
  );
}

function BusinessMetricsCard({
  row,
  periodId,
  periodDays,
}: {
  row: BusinessMetricRow;
  periodId: MetricsPeriodId;
  periodDays: number;
}) {
  const periodLabel = getMetricsPeriodLabel(periodId);
  const ratingChartData = [...row.rating_distribution]
    .sort((a, b) => a.stars - b.stars)
    .map(item => ({
      stars: `${item.stars}★`,
      count: item.count,
    }));

  const topClickType = [...row.clicks_by_type].sort((a, b) => b.count - a.count)[0];
  const periodRatingLabel =
    row.reviews_period > 0 ? row.rating_avg_period.toFixed(1) : '—';

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">{row.business_name}</h3>
        <Badge variant="secondary">{periodLabel}</Badge>
      </div>

      <div className="space-y-8">
        <section>
          <SectionHeader
            icon={Eye}
            title="Visitas"
            description="Personas que han abierto la ficha de tu negocio"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricKpi value={row.visits_period} label={`Visitas (${periodLabel.toLowerCase()})`} />
            <MetricKpi value={row.visits_total} label="Visitas totales" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{getChartTrendLabel(periodDays)}</p>
            <PeriodLineChart
              data={row.daily_visits}
              dataKey="visits"
              label="Visitas"
              colorVar="var(--primary)"
              periodDays={periodDays}
            />
          </div>
        </section>

        <section className="border-t pt-8">
          <SectionHeader
            icon={Star}
            title="Valoraciones"
            description="Reseñas recibidas y distribución por estrellas en el periodo"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricKpi value={row.reviews_period} label={`Nuevas (${periodLabel.toLowerCase()})`} />
            <MetricKpi value={row.reviews_total} label="Reseñas totales" />
            <MetricKpi value={periodRatingLabel} label={`Media (${periodLabel.toLowerCase()})`} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Valoración media histórica:{' '}
            <span className="font-medium text-foreground">{row.rating_avg.toFixed(1)}</span>
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Distribución por estrellas en el periodo
              </p>
              {ratingChartData.some(d => d.count > 0) ? (
                <ChartContainer
                  config={{
                    count: {
                      label: 'Reseñas',
                      color: 'var(--premium)',
                    },
                  }}
                  className="h-48 w-full"
                >
                  <BarChart data={ratingChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="stars"
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No hay valoraciones en este periodo.
                </p>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {periodDays === 1 ? 'Nuevas reseñas por hora' : 'Nuevas reseñas por día'}
              </p>
              <PeriodLineChart
                data={row.daily_reviews}
                dataKey="reviews"
                label="Reseñas"
                colorVar="var(--premium)"
                periodDays={periodDays}
              />
            </div>
          </div>
        </section>

        <section className="border-t pt-8">
          <SectionHeader
            icon={MousePointerClick}
            title="Clics"
            description="Interacciones en los botones y enlaces de contacto de tu ficha"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricKpi value={row.clicks_period} label={`Clics (${periodLabel.toLowerCase()})`} />
            <MetricKpi value={row.clicks_total} label="Clics totales" />
          </div>

          {topClickType && topClickType.count > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Acción más usada en el periodo:{' '}
              <span className="font-medium text-foreground">
                {CLICK_TYPE_LABELS[topClickType.click_type]}
              </span>{' '}
              ({topClickType.count} clics)
            </p>
          )}

          <div className="mt-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Dónde hacen clic los usuarios en el periodo
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {row.clicks_by_type.map(item => {
                const Icon = CLICK_TYPE_ICONS[item.click_type];
                const maxCount = Math.max(...row.clicks_by_type.map(c => c.count), 1);
                const widthPct = item.count > 0 ? Math.max((item.count / maxCount) * 100, 8) : 0;

                return (
                  <div key={item.click_type} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {CLICK_TYPE_LABELS[item.click_type]}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">{item.count}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.count_total} en total
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {periodDays === 1 ? 'Clics por hora' : 'Clics por día'}
            </p>
            <PeriodLineChart
              data={row.daily_clicks}
              dataKey="clicks"
              label="Clics"
              colorVar="var(--accent)"
              periodDays={periodDays}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

interface BusinessMetricsPanelProps {
  metrics: BusinessMetricRow[];
  loading: boolean;
  periodId: MetricsPeriodId;
  onPeriodChange: (periodId: MetricsPeriodId) => void;
  hasBusinesses?: boolean;
}

export default function BusinessMetricsPanel({
  metrics,
  loading,
  periodId,
  onPeriodChange,
  hasBusinesses = false,
}: BusinessMetricsPanelProps) {
  const periodDays = METRICS_PERIOD_OPTIONS.find(option => option.id === periodId)?.days ?? 30;

  if (loading && metrics.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
        <div className="rounded-xl border p-4 sm:p-6">
          <Skeleton className="h-6 w-48" />
          <div className="mt-6 space-y-8">
            {Array.from({ length: 3 }).map((_, section) => (
              <div key={section} className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-48 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Periodo</p>
          <p className="text-xs text-muted-foreground">
            KPIs, gráficos y desglose de clics según el rango seleccionado
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={periodId}
          onValueChange={value => {
            if (value) onPeriodChange(value as MetricsPeriodId);
          }}
          className="flex flex-wrap justify-start gap-1.5"
        >
          {METRICS_PERIOD_OPTIONS.map(option => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              aria-label={option.label}
              className="rounded-full border border-border px-3 py-1.5 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.shortLabel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {metrics.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {hasBusinesses
            ? 'No hay datos de métricas para este periodo todavía.'
            : 'Las métricas aparecerán cuando registres un negocio.'}
        </p>
      ) : (
        <div className={cn('space-y-6', loading && 'pointer-events-none opacity-60')}>
          {metrics.map(row => (
            <BusinessMetricsCard
              key={row.business_id}
              row={row}
              periodId={periodId}
              periodDays={periodDays}
            />
          ))}
        </div>
      )}
    </div>
  );
}
