export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface HoursPeriod {
  open: string;
  close: string;
}

export interface DaySchedule {
  closed: boolean;
  periods: HoursPeriod[];
}

export type BusinessOpeningHours = Record<Weekday, DaySchedule>;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function defaultDay(closed = false): DaySchedule {
  return {
    closed,
    periods: closed ? [] : [{ open: '09:00', close: '18:00' }],
  };
}

export function createDefaultOpeningHours(): BusinessOpeningHours {
  return {
    monday: defaultDay(),
    tuesday: defaultDay(),
    wednesday: defaultDay(),
    thursday: defaultDay(),
    friday: defaultDay(),
    saturday: defaultDay(),
    sunday: defaultDay(true),
  };
}

function normalizePeriod(raw: unknown): HoursPeriod | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const open = typeof p.open === 'string' ? p.open : '';
  const close = typeof p.close === 'string' ? p.close : '';
  if (!TIME_PATTERN.test(open) || !TIME_PATTERN.test(close)) return null;
  return { open, close };
}

function normalizeDay(raw: unknown): DaySchedule {
  if (!raw || typeof raw !== 'object') return defaultDay();
  const d = raw as Record<string, unknown>;
  const closed = !!d.closed;
  if (closed) return { closed: true, periods: [] };
  const periods = Array.isArray(d.periods)
    ? d.periods.map(normalizePeriod).filter((p): p is HoursPeriod => p !== null).slice(0, 2)
    : [];
  if (periods.length === 0) return defaultDay();
  return { closed: false, periods };
}

export function parseOpeningHours(raw: unknown): BusinessOpeningHours | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const result = {} as BusinessOpeningHours;
  for (const day of WEEKDAYS) {
    result[day] = normalizeDay(obj[day]);
  }
  return result;
}

export function getWeekdayKey(date = new Date()): Weekday {
  const jsDay = date.getDay();
  const map: Weekday[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[jsDay] ?? 'monday';
}

export function formatPeriod(period: HoursPeriod): string {
  return `${period.open} – ${period.close}`;
}

export function formatDaySchedule(day: DaySchedule): string {
  if (day.closed || day.periods.length === 0) return 'Cerrado';
  return day.periods.map(formatPeriod).join(', ');
}

export function getTodayHeadline(
  hours: BusinessOpeningHours | null | undefined,
  date = new Date(),
): string {
  if (!hours) return 'Horario no indicado';
  const day = hours[getWeekdayKey(date)];
  if (day.closed || day.periods.length === 0) return 'Cerrado hoy';
  return `Horario hoy: ${formatDaySchedule(day)}`;
}

export function hasConfiguredOpeningHours(hours: BusinessOpeningHours | null | undefined): boolean {
  return hours != null;
}

export function openingHoursEqual(
  a: BusinessOpeningHours | null | undefined,
  b: BusinessOpeningHours | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return WEEKDAYS.every(day => {
    const left = a[day];
    const right = b[day];
    if (left.closed !== right.closed) return false;
    if (left.periods.length !== right.periods.length) return false;
    return left.periods.every((period, index) => {
      const other = right.periods[index];
      return period.open === other.open && period.close === other.close;
    });
  });
}

export function copyDayToAll(
  hours: BusinessOpeningHours,
  source: Weekday,
): BusinessOpeningHours {
  const template = hours[source];
  const next = { ...hours };
  for (const day of WEEKDAYS) {
    next[day] = {
      closed: template.closed,
      periods: template.periods.map(p => ({ ...p })),
    };
  }
  return next;
}
