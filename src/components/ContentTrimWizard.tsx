import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { resolveBusinessImageUrl } from '@/lib/business-image';
import { planLabelForTier, type ProfilePlanTier } from '@/lib/business-profile-plan';
import { resolvePlanContentTrim } from '@/services/api';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si true, no se puede cerrar sin resolver. */
  mandatory?: boolean;
  planTier: ProfilePlanTier;
  maxPhotos: number;
  maxServices: number;
  photoUrls: string[];
  services: string[];
  dueAt: string | null;
  onResolved: () => void;
};

function daysRemaining(dueAt: string | null): number | null {
  if (!dueAt) return null;
  const ms = new Date(dueAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function ContentTrimWizard({
  open,
  onOpenChange,
  mandatory = true,
  planTier,
  maxPhotos,
  maxServices,
  photoUrls,
  services,
  dueAt,
  onResolved,
}: Props) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedPhotos(photoUrls.slice(0, maxPhotos));
    setSelectedServices(services.slice(0, maxServices));
    setError(null);
  }, [open, photoUrls, services, maxPhotos, maxServices]);

  const days = daysRemaining(dueAt);
  const photosOk = selectedPhotos.length <= maxPhotos;
  const servicesOk = selectedServices.length <= maxServices;
  const canSubmit =
    photosOk &&
    servicesOk &&
    (photoUrls.length === 0 || selectedPhotos.length >= 1) &&
    selectedPhotos.length <= maxPhotos &&
    selectedServices.length <= maxServices;

  const dueLabel = useMemo(() => {
    if (days == null) return null;
    if (days <= 0) return 'Hoy se aplicará el recorte automático.';
    if (days === 1) return 'Te queda 1 día para elegir.';
    return `Te quedan ${days} días para elegir.`;
  }, [days]);

  const togglePhoto = (url: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(url)) return prev.filter(u => u !== url);
      if (prev.length >= maxPhotos) return prev;
      return [...prev, url];
    });
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) return prev.filter(s => s !== service);
      if (prev.length >= maxServices) return prev;
      return [...prev, service];
    });
  };

  const handleConfirm = async () => {
    setError(null);
    if (selectedPhotos.length > maxPhotos) {
      setError(`Elige como máximo ${maxPhotos} fotos.`);
      return;
    }
    if (selectedServices.length > maxServices) {
      setError(`Elige como máximo ${maxServices} servicios.`);
      return;
    }
    if (photoUrls.length > 0 && selectedPhotos.length < 1) {
      setError('Conserva al menos una foto.');
      return;
    }

    setSaving(true);
    const result = await resolvePlanContentTrim(selectedPhotos, selectedServices);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? 'No se pudo guardar la selección.');
      return;
    }

    onResolved();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (mandatory && next === false) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onPointerDownOutside={event => {
          if (mandatory) event.preventDefault();
        }}
        onEscapeKeyDown={event => {
          if (mandatory) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Ajusta tu contenido al plan {planLabelForTier(planTier)}
          </DialogTitle>
          <DialogDescription>
            Tu plan permite hasta {maxPhotos} fotos y {maxServices} servicios. Elige qué conservar;
            el resto se eliminará de forma permanente.
            {dueLabel ? ` ${dueLabel}` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {photoUrls.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Fotos</p>
                <Badge variant={photosOk ? 'secondary' : 'destructive'}>
                  {selectedPhotos.length} / {maxPhotos}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photoUrls.map(url => {
                  const selected = selectedPhotos.includes(url);
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => togglePhoto(url)}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-md border-2 transition',
                        selected ? 'border-primary' : 'border-transparent opacity-60',
                      )}
                    >
                      <img
                        src={resolveBusinessImageUrl(url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Servicios</p>
                <Badge variant={servicesOk ? 'secondary' : 'destructive'}>
                  {selectedServices.length} / {maxServices}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {services.map(service => {
                  const selected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm transition',
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-muted text-muted-foreground',
                      )}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {!mandatory && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Más tarde
            </Button>
          )}
          <Button type="button" onClick={() => void handleConfirm()} disabled={saving || !canSubmit}>
            {saving ? 'Guardando…' : 'Conservar selección'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function contentTrimDaysRemaining(dueAt: string | null): number | null {
  return daysRemaining(dueAt);
}
