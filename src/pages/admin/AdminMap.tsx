import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Check } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import { saveMapTheme } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import {
  MAP_THEME_OPTIONS,
  type MapThemeConfig,
  type MapThemeId,
} from '@/constants/map-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

/** Centro de Andorra usado para que la previsualización muestre una zona reconocible. */
const PREVIEW_CENTER: [number, number] = [42.5063, 1.5218];
const PREVIEW_ZOOM = 12;

function MapThemePreview({ theme }: { theme: MapThemeConfig }) {
  return (
    <MapContainer
      center={PREVIEW_CENTER}
      zoom={PREVIEW_ZOOM}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      className="pointer-events-none h-full w-full"
    >
      <TileLayer key={theme.id} url={theme.url} attribution={theme.attribution} />
    </MapContainer>
  );
}

export default function AdminMap() {
  const { mapTheme, refresh } = useSiteContent();
  const [mapThemeForm, setMapThemeForm] = useState<MapThemeId>(mapTheme);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMapThemeForm(mapTheme);
  }, [mapTheme]);

  const hasChanges = mapThemeForm !== mapTheme;

  const handleSave = async () => {
    setSaving(true);
    const res = await saveMapTheme(mapThemeForm);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Estilo del mapa actualizado' });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mapa</h2>
          <p className="text-muted-foreground">
            Configura el estilo visual del mapa principal de la web.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estilo del mapa</CardTitle>
            <CardDescription>
              Elige un estilo. La previsualización muestra cómo se verá el mapa. El cambio se aplica
              en toda la web tras guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {MAP_THEME_OPTIONS.map(theme => {
                const selected = theme.id === mapThemeForm;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setMapThemeForm(theme.id)}
                    aria-pressed={selected}
                    className={cn(
                      'group flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 bg-card text-left transition-colors',
                      selected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-muted">
                      <MapThemePreview theme={theme} />
                      {selected && (
                        <span className="absolute right-2 top-2 z-500 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="text-sm font-medium">{theme.label}</p>
                      <p className="text-xs leading-snug text-muted-foreground">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => void handleSave()} disabled={saving || !hasChanges}>
              {saving ? 'Guardando…' : 'Guardar estilo del mapa'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
