import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BUSINESS_SERVICE_GROUPS } from '@/constants/businessForm';
import { cn } from '@/lib/utils';

interface BusinessServicesPickerProps {
  selectedServices: string[];
  maxServices: number;
  onToggle: (service: string) => void;
  showOverLimitWarning?: boolean;
}

export default function BusinessServicesPicker({
  selectedServices,
  maxServices,
  onToggle,
  showOverLimitWarning = false,
}: BusinessServicesPickerProps) {
  const atGlobalLimit = selectedServices.length >= maxServices;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Servicios</Label>
        <span className="text-xs text-muted-foreground">
          {selectedServices.length} / {maxServices}
        </span>
      </div>

      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedServices.map(service => (
            <Badge
              key={service}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1.5 hover:bg-secondary/80"
              onClick={() => onToggle(service)}
            >
              {service}
              <span className="text-muted-foreground" aria-hidden>×</span>
            </Badge>
          ))}
        </div>
      )}

      <Accordion type="multiple" className="w-full rounded-lg border border-border px-3">
        {BUSINESS_SERVICE_GROUPS.map(group => {
          const selectedInGroup = group.services.filter(s => selectedServices.includes(s)).length;

          return (
            <AccordionItem key={group.id} value={group.id} className="border-border/60">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex flex-1 items-center gap-2 text-left">
                  <span className="font-medium">{group.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({group.services.length})
                  </span>
                  {selectedInGroup > 0 && (
                    <Badge variant="outline" className="ml-auto mr-2 h-5 px-1.5 text-[10px]">
                      {selectedInGroup}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  {group.services.map(service => {
                    const selected = selectedServices.includes(service);
                    const disabled = !selected && atGlobalLimit;

                    return (
                      <button
                        key={service}
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggle(service)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/50',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {showOverLimitWarning && (
        <p className="text-xs text-destructive">
          Tu plan permite {maxServices} servicios. Quita {selectedServices.length - maxServices} para guardar.
        </p>
      )}
    </div>
  );
}
