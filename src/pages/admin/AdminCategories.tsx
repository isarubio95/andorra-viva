import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/pages/admin/AdminShell';
import { saveCategoryLabels } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { DEFAULT_CATEGORY_LABELS } from '@/constants/site-content-defaults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminCategories() {
  const { categoryLabels, refresh } = useSiteContent();
  const [form, setForm] = useState<Record<string, string>>({ ...DEFAULT_CATEGORY_LABELS });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm({ ...DEFAULT_CATEGORY_LABELS, ...categoryLabels });
  }, [categoryLabels]);

  const savedLabels = useMemo(
    () => ({ ...DEFAULT_CATEGORY_LABELS, ...categoryLabels }),
    [categoryLabels],
  );

  const hasChanges = useMemo(
    () => BUSINESS_CATEGORIES.some(cat => (form[cat] ?? '') !== (savedLabels[cat] ?? '')),
    [form, savedLabels],
  );

  const handleSave = async () => {
    setSaving(true);
    const res = await saveCategoryLabels(form);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Categorías actualizadas' });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">
            Cambia los nombres visibles de las categorías en la home y el directorio. La clave
            interna (p. ej. Gastronomía) no cambia.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Etiquetas de categoría</CardTitle>
            <CardDescription>
              Cada categoría tiene un nombre canónico en la base de datos y una etiqueta visible
              para el usuario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BUSINESS_CATEGORIES.map(cat => (
              <div key={cat} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                <div>
                  <p className="text-sm font-medium">{cat}</p>
                  <p className="text-xs text-muted-foreground">Clave interna</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`cat-${cat}`} className="sr-only">
                    Etiqueta visible para {cat}
                  </Label>
                  <Input
                    id={`cat-${cat}`}
                    value={form[cat] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [cat]: e.target.value }))}
                    placeholder="Nombre visible"
                  />
                </div>
              </div>
            ))}
            <Button onClick={() => void handleSave()} disabled={saving || !hasChanges}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
