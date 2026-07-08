import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminShell from '@/pages/admin/AdminShell';
import { saveLegalPages } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import {
  DEFAULT_LEGAL_PAGES,
  LEGAL_PAGE_KEYS,
  LEGAL_PAGE_LABELS,
  LEGAL_PAGE_ROUTES,
  type LegalPageDocument,
  type LegalPageKey,
} from '@/constants/legal-pages-defaults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

function legalPagesEqual(
  a: Record<LegalPageKey, LegalPageDocument>,
  b: Record<LegalPageKey, LegalPageDocument>,
): boolean {
  return LEGAL_PAGE_KEYS.every(key => {
    const left = a[key];
    const right = b[key];
    return (
      left.title === right.title &&
      left.lastUpdated === right.lastUpdated &&
      left.version === right.version &&
      left.summary === right.summary &&
      left.bodyHtml === right.bodyHtml
    );
  });
}

export default function AdminLegal() {
  const { legalPages, refresh } = useSiteContent();
  const [form, setForm] = useState<Record<LegalPageKey, LegalPageDocument>>(DEFAULT_LEGAL_PAGES);
  const [activeTab, setActiveTab] = useState<LegalPageKey>('privacy_policy');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(legalPages);
  }, [legalPages]);

  const hasChanges = useMemo(() => !legalPagesEqual(form, legalPages), [form, legalPages]);

  const updatePage = (key: LegalPageKey, patch: Partial<LegalPageDocument>) => {
    setForm(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveLegalPages(form);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Páginas legales actualizadas' });
  };

  const handleResetTab = () => {
    setForm(prev => ({ ...prev, [activeTab]: { ...legalPages[activeTab] } }));
  };

  const handleRestoreDefaults = () => {
    setForm(prev => ({ ...prev, [activeTab]: { ...DEFAULT_LEGAL_PAGES[activeTab] } }));
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Páginas legales</h2>
          <p className="text-muted-foreground">
            Edita el aviso legal, la política de privacidad y las condiciones de uso. El contenido admite HTML
            básico (párrafos, listas, enlaces, negritas).
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as LegalPageKey)}>
          <TabsList className="flex h-auto flex-wrap gap-1">
            {LEGAL_PAGE_KEYS.map(key => (
              <TabsTrigger key={key} value={key}>
                {LEGAL_PAGE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          {LEGAL_PAGE_KEYS.map(key => {
            const page = form[key];
            return (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle>{LEGAL_PAGE_LABELS[key]}</CardTitle>
                      <CardDescription>
                        Los cambios se publican en la web tras guardar.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={LEGAL_PAGE_ROUTES[key]} target="_blank" rel="noopener noreferrer">
                        Ver página
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-title`}>Título</Label>
                        <Input
                          id={`${key}-title`}
                          value={page.title}
                          onChange={e => updatePage(key, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-version`}>Versión</Label>
                        <Input
                          id={`${key}-version`}
                          value={page.version}
                          onChange={e => updatePage(key, { version: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${key}-updated`}>Última actualización (texto visible)</Label>
                      <Input
                        id={`${key}-updated`}
                        value={page.lastUpdated}
                        onChange={e => updatePage(key, { lastUpdated: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${key}-summary`}>Resumen introductorio (HTML)</Label>
                      <Textarea
                        id={`${key}-summary`}
                        value={page.summary}
                        onChange={e => updatePage(key, { summary: e.target.value })}
                        rows={3}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${key}-body`}>Contenido principal (HTML)</Label>
                      <Textarea
                        id={`${key}-body`}
                        value={page.bodyHtml}
                        onChange={e => updatePage(key, { bodyHtml: e.target.value })}
                        rows={22}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={handleResetTab}>
                        Descartar cambios de esta pestaña
                      </Button>
                      <Button type="button" variant="outline" onClick={handleRestoreDefaults}>
                        Restaurar texto por defecto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        <Button onClick={() => void handleSave()} disabled={saving || !hasChanges}>
          {saving ? 'Guardando…' : 'Guardar todas las páginas legales'}
        </Button>
      </div>
    </AdminShell>
  );
}
