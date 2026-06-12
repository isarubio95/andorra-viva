import { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  formatDaySchedule,
  getTodayHeadline,
  getWeekdayKey,
  hasConfiguredOpeningHours,
  type BusinessOpeningHours,
} from '@/lib/business-hours';
import { cn } from '@/lib/utils';

interface BusinessHoursDisplayProps {
  hours: BusinessOpeningHours | null | undefined;
  className?: string;
}

export default function BusinessHoursDisplay({ hours, className }: BusinessHoursDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const todayKey = getWeekdayKey();

  if (!hasConfiguredOpeningHours(hours)) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Clock className="h-4 w-4 shrink-0" />
        <span>Horario no indicado</span>
      </div>
    );
  }

  return (
    <div className={cn('text-sm', className)}>
      <button
        type="button"
        onClick={() => setExpanded(open => !open)}
        className="flex w-full items-start gap-2 text-left text-muted-foreground hover:text-foreground"
        aria-expanded={expanded}
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">{getTodayHeadline(hours)}</span>
        <ChevronDown
          className={cn('mt-0.5 h-4 w-4 shrink-0 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-l border-border pl-6">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className={cn(
                'flex items-start justify-between gap-3',
                day === todayKey && 'font-medium text-foreground',
              )}
            >
              <span className="text-muted-foreground">{WEEKDAY_LABELS[day]}</span>
              <span className="text-right text-muted-foreground">{formatDaySchedule(hours[day])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
