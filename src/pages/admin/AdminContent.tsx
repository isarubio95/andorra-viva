import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/pages/admin/AdminShell';
import { saveSiteTexts } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import {
  DEFAULT_SITE_TEXTS,
  SITE_TEXT_LABELS,
  type SiteTextKey,
} from '@/constants/site-content-defaults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminContent() {
  const { texts, refresh } = useSiteContent();
  const [form, setForm] = useState<Record<SiteTextKey, string>>(DEFAULT_SITE_TEXTS);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(texts);
  }, [texts]);

  const hasChanges = useMemo(
    () =>
      (Object.keys(SITE_TEXT_LABELS) as SiteTextKey[]).some(key => form[key] !== texts[key]),
    [form, texts],
  );

  const handleSave = async () => {
    setSaving(true);
    const res = await saveSiteTexts(form);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Textos actualizados' });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Textos de la web</h2>
          <p className="text-muted-foreground">
            Modifica los textos visibles en la página de inicio y el pie de página.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contenido editable</CardTitle>
            <CardDescription>
              Los cambios se aplican en toda la web tras guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(SITE_TEXT_LABELS) as SiteTextKey[]).map(key => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{SITE_TEXT_LABELS[key]}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
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
