import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  copyDayToAll,
  type BusinessOpeningHours,
  type HoursPeriod,
  type Weekday,
} from '@/lib/business-hours';
import { cn } from '@/lib/utils';

interface BusinessHoursEditorProps {
  value: BusinessOpeningHours;
  onChange: (value: BusinessOpeningHours) => void;
  className?: string;
}

export default function BusinessHoursEditor({ value, onChange, className }: BusinessHoursEditorProps) {
  const updateDay = (day: Weekday, patch: Partial<BusinessOpeningHours[Weekday]>) => {
    onChange({
      ...value,
      [day]: { ...value[day], ...patch },
    });
  };

  const setDayClosed = (day: Weekday, closed: boolean) => {
    if (closed) {
      updateDay(day, { closed: true, periods: [] });
      return;
    }
    updateDay(day, {
      closed: false,
      periods: value[day].periods.length > 0 ? value[day].periods : [{ open: '09:00', close: '18:00' }],
    });
  };

  const updatePeriod = (day: Weekday, index: number, patch: Partial<HoursPeriod>) => {
    const periods = value[day].periods.map((period, i) =>
      i === index ? { ...period, ...patch } : period,
    );
    updateDay(day, { periods });
  };

  const addPeriod = (day: Weekday) => {
    if (value[day].periods.length >= 2) return;
    updateDay(day, {
      periods: [...value[day].periods, { open: '17:00', close: '22:00' }],
    });
  };

  const removePeriod = (day: Weekday, index: number) => {
    const periods = value[day].periods.filter((_, i) => i !== index);
    if (periods.length === 0) {
      setDayClosed(day, true);
      return;
    }
    updateDay(day, { periods });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-medium">Horario por días</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange(copyDayToAll(value, 'monday'))}
        >
          Copiar lunes a todos
        </Button>
      </div>

      <div className="divide-y rounded-lg border border-border">
        {WEEKDAYS.map(day => {
          const schedule = value[day];
          return (
            <div key={day} className="space-y-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="w-24 shrink-0 text-sm font-medium text-foreground">
                  {WEEKDAY_LABELS[day]}
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`closed-${day}`} className="text-xs text-muted-foreground">
                    {schedule.closed ? 'Cerrado' : 'Abierto'}
                  </Label>
                  <Switch
                    id={`closed-${day}`}
                    checked={!schedule.closed}
                    onCheckedChange={checked => setDayClosed(day, !checked)}
                  />
                </div>
              </div>

              {!schedule.closed && (
                <div className="space-y-2 pl-0 sm:pl-24">
                  {schedule.periods.map((period, index) => (
                    <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        value={period.open}
                        onChange={e => updatePeriod(day, index, { open: e.target.value })}
                        className="h-9 w-[7.5rem] shrink-0"
                        aria-label={`Apertura ${WEEKDAY_LABELS[day]}`}
                      />
                      <span className="text-sm text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={period.close}
                        onChange={e => updatePeriod(day, index, { close: e.target.value })}
                        className="h-9 w-[7.5rem] shrink-0"
                        aria-label={`Cierre ${WEEKDAY_LABELS[day]}`}
                      />
                      {schedule.periods.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground"
                          onClick={() => removePeriod(day, index)}
                          aria-label="Quitar franja horaria"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {schedule.periods.length < 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                      onClick={() => addPeriod(day)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir otro horario
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
