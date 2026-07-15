export const METRICS_PERIOD_OPTIONS = [
  { id: '1d', days: 1, label: 'Hoy', shortLabel: '1 día' },
  { id: '7d', days: 7, label: 'Últimos 7 días', shortLabel: '7 días' },
  { id: '30d', days: 30, label: 'Últimos 30 días', shortLabel: '30 días' },
  { id: '90d', days: 90, label: 'Últimos 90 días', shortLabel: '90 días' },
  { id: '365d', days: 365, label: 'Último año', shortLabel: '1 año' },
] as const;

export type MetricsPeriodId = (typeof METRICS_PERIOD_OPTIONS)[number]['id'];

export const DEFAULT_METRICS_PERIOD_ID: MetricsPeriodId = '30d';

const periodById = new Map(METRICS_PERIOD_OPTIONS.map(option => [option.id, option]));

export function parseMetricsPeriodId(value: string | null | undefined): MetricsPeriodId {
  if (value && periodById.has(value as MetricsPeriodId)) {
    return value as MetricsPeriodId;
  }
  return DEFAULT_METRICS_PERIOD_ID;
}

export function getMetricsPeriodDays(id: MetricsPeriodId): number {
  return periodById.get(id)?.days ?? 30;
}

export function getMetricsPeriodLabel(id: MetricsPeriodId): string {
  return periodById.get(id)?.label ?? 'Últimos 30 días';
}

export function getMetricsPeriodShortLabel(id: MetricsPeriodId): string {
  return periodById.get(id)?.shortLabel ?? '30 días';
}
