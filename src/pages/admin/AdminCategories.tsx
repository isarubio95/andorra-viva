import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import SubcategoryIconPicker from '@/components/admin/SubcategoryIconPicker';
import { saveCategoryLabels, saveSubcategoryConfig } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import type { BusinessCategory } from '@/constants/businessCategories';
import type { SubcategoryConfig } from '@/constants/businessSubcategories';
import { CATEGORY_THEMES } from '@/constants/categoryDisplay';
import { DEFAULT_CATEGORY_LABELS } from '@/constants/site-content-defaults';
import {
  DEFAULT_SUBCATEGORY_ICON_ID,
  DEFAULT_SUBCATEGORY_ICONS,
} from '@/constants/subcategory-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type SubcategoryRow = {
  key: string;
  name: string;
  displayLabel: string;
  /** Preset id (p. ej. "wine") o URL de un icono personalizado. */
  iconValue: string;
};

function rawIconValue(name: string, icons: Record<string, string>): string {
  const value = icons[name];
  if (value) return value;
  return DEFAULT_SUBCATEGORY_ICONS[name] ?? DEFAULT_SUBCATEGORY_ICON_ID;
}

function rowsFromConfig(
  category: BusinessCategory,
  subcategories: SubcategoryConfig,
  labels: Record<string, string>,
  icons: Record<string, string>,
): SubcategoryRow[] {
  return (subcategories[category] ?? []).map((name, index) => ({
    key: `${category}-${index}-${name}`,
    name,
    displayLabel: labels[name] ?? name,
    iconValue: rawIconValue(name, icons),
  }));
}

function configFromRows(subcategoryForms: Record<BusinessCategory, SubcategoryRow[]>): {
  subcategories: SubcategoryConfig;
  labels: Record<string, string>;
  icons: Record<string, string>;
} {
  const subcategories = {} as SubcategoryConfig;
  const labels: Record<string, string> = {};
  const icons: Record<string, string> = {};

  for (const category of BUSINESS_CATEGORIES) {
    subcategories[category] = (subcategoryForms[category] ?? [])
      .map(row => row.name.trim())
      .filter(Boolean);
    for (const row of subcategoryForms[category] ?? []) {
      const name = row.name.trim();
      if (!name) continue;
      labels[name] = row.displayLabel.trim() || name;
      icons[name] = row.iconValue;
    }
  }

  return { subcategories, labels, icons };
}

function AccentColorHint({ category }: { category: BusinessCategory }) {
  const [copied, setCopied] = useState(false);
  const accent = CATEGORY_THEMES[category].accent;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(accent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
      aria-label={`Copiar color recomendado ${accent}`}
    >
      <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: accent }} aria-hidden />
      <span className="font-mono uppercase">{accent}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

export default function AdminCategories() {
  const {
    categoryLabels,
    subcategories,
    subcategoryLabels,
    subcategoryIcons,
    refresh,
  } = useSiteContent();
  const [categoryForm, setCategoryForm] = useState<Record<string, string>>({ ...DEFAULT_CATEGORY_LABELS });
  const [subcategoryForms, setSubcategoryForms] = useState<Record<BusinessCategory, SubcategoryRow[]>>(
    () =>
      Object.fromEntries(
        BUSINESS_CATEGORIES.map(cat => [
          cat,
          rowsFromConfig(cat, subcategories, subcategoryLabels, subcategoryIcons),
        ]),
      ) as Record<BusinessCategory, SubcategoryRow[]>,
  );
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingSubcategories, setSavingSubcategories] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCategoryForm({ ...DEFAULT_CATEGORY_LABELS, ...categoryLabels });
  }, [categoryLabels]);

  useEffect(() => {
    setSubcategoryForms(
      Object.fromEntries(
        BUSINESS_CATEGORIES.map(cat => [
          cat,
          rowsFromConfig(cat, subcategories, subcategoryLabels, subcategoryIcons),
        ]),
      ) as Record<BusinessCategory, SubcategoryRow[]>,
    );
  }, [subcategories, subcategoryLabels, subcategoryIcons]);

  const savedCategoryLabels = useMemo(
    () => ({ ...DEFAULT_CATEGORY_LABELS, ...categoryLabels }),
    [categoryLabels],
  );

  const hasCategoryChanges = useMemo(
    () => BUSINESS_CATEGORIES.some(cat => (categoryForm[cat] ?? '') !== (savedCategoryLabels[cat] ?? '')),
    [categoryForm, savedCategoryLabels],
  );

  const hasSubcategoryChanges = useMemo(() => {
    const current = configFromRows(subcategoryForms);
    for (const category of BUSINESS_CATEGORIES) {
      const saved = subcategories[category] ?? [];
      const edited = current.subcategories[category] ?? [];
      if (saved.length !== edited.length || saved.some((s, i) => s !== edited[i])) return true;
      for (const name of edited) {
        if ((subcategoryLabels[name] ?? name) !== (current.labels[name] ?? name)) return true;
        if (rawIconValue(name, subcategoryIcons) !== current.icons[name]) return true;
      }
    }
    return false;
  }, [subcategoryForms, subcategories, subcategoryLabels, subcategoryIcons]);

  const handleSaveCategories = async () => {
    setSavingCategories(true);
    const res = await saveCategoryLabels(categoryForm);
    setSavingCategories(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Categorías actualizadas' });
  };

  const handleSaveSubcategories = async () => {
    const { subcategories: nextSubcategories, labels, icons } = configFromRows(subcategoryForms);

    for (const category of BUSINESS_CATEGORIES) {
      const names = nextSubcategories[category];
      if (names.length === 0) {
        toast({
          title: 'Subcategorías incompletas',
          description: `${category} debe tener al menos una subcategoría.`,
          variant: 'destructive',
        });
        return;
      }
      const unique = new Set(names);
      if (unique.size !== names.length) {
        toast({
          title: 'Nombres duplicados',
          description: `Hay subcategorías repetidas en ${category}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSavingSubcategories(true);
    const res = await saveSubcategoryConfig(nextSubcategories, labels, icons);
    setSavingSubcategories(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Subcategorías actualizadas' });
  };

  const updateSubcategoryRow = (
    category: BusinessCategory,
    index: number,
    patch: Partial<SubcategoryRow>,
  ) => {
    setSubcategoryForms(prev => {
      const rows = [...(prev[category] ?? [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, [category]: rows };
    });
  };

  const addSubcategory = (category: BusinessCategory) => {
    setSubcategoryForms(prev => ({
      ...prev,
      [category]: [
        ...(prev[category] ?? []),
        {
          key: `${category}-new-${Date.now()}`,
          name: '',
          displayLabel: '',
          iconValue: DEFAULT_SUBCATEGORY_ICON_ID,
        },
      ],
    }));
  };

  const removeSubcategory = (category: BusinessCategory, index: number) => {
    setSubcategoryForms(prev => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((_, i) => i !== index),
    }));
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">
            Gestiona las categorías y subcategorías visibles en la home, el directorio y el registro
            de negocios.
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
                    value={categoryForm[cat] ?? ''}
                    onChange={e => setCategoryForm(prev => ({ ...prev, [cat]: e.target.value }))}
                    placeholder="Nombre visible"
                  />
                </div>
              </div>
            ))}
            <Button onClick={() => void handleSaveCategories()} disabled={savingCategories || !hasCategoryChanges}>
              {savingCategories ? 'Guardando…' : 'Guardar categorías'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subcategorías</CardTitle>
            <CardDescription>
              Edita el listado de subcategorías por categoría: nombre interno, etiqueta visible e
              icono de la home. Si renombras una subcategoría existente, los negocios ya registrados
              conservarán el nombre anterior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Consejos para el icono personalizado</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Formato recomendado: <strong>SVG</strong> (también admite PNG o WebP con fondo
                  transparente). Tamaño máximo 256 KB.
                </li>
                <li>
                  Diseño ideal: lienzo cuadrado <strong>24×24</strong> px, estilo lineal, grosor de
                  trazo <strong>2 px</strong>, sin relleno de fondo.
                </li>
                <li>
                  Color: sube el icono en <strong>negro sobre fondo transparente</strong> (o gris
                  oscuro). Se pintará automáticamente con el color de acento de la categoría (botón
                  junto a cada bloque), igual que los iconos de la biblioteca.
                </li>
                <li>
                  Librerías gratuitas compatibles:{' '}
                  <a className="underline" href="https://lucide.dev/icons" target="_blank" rel="noreferrer">Lucide</a>,{' '}
                  <a className="underline" href="https://tabler.io/icons" target="_blank" rel="noreferrer">Tabler Icons</a>,{' '}
                  <a className="underline" href="https://heroicons.com" target="_blank" rel="noreferrer">Heroicons</a>,{' '}
                  <a className="underline" href="https://phosphoricons.com" target="_blank" rel="noreferrer">Phosphor</a>{' '}
                  y{' '}
                  <a className="underline" href="https://feathericons.com" target="_blank" rel="noreferrer">Feather</a>.
                </li>
              </ul>
            </div>

            {BUSINESS_CATEGORIES.map(category => (
              <div key={category} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{category}</h3>
                    <AccentColorHint category={category} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSubcategory(category)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Añadir
                  </Button>
                </div>

                <div className="space-y-2">
                  {(subcategoryForms[category] ?? []).map((row, index) => (
                    <div
                      key={row.key}
                      className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_220px_auto] sm:items-start"
                    >
                      <div className="space-y-1">
                        <Label htmlFor={`sub-name-${row.key}`}>Nombre interno</Label>
                        <Input
                          id={`sub-name-${row.key}`}
                          value={row.name}
                          onChange={e =>
                            updateSubcategoryRow(category, index, { name: e.target.value })
                          }
                          placeholder="Ej. Restaurante"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`sub-label-${row.key}`}>Etiqueta visible</Label>
                        <Input
                          id={`sub-label-${row.key}`}
                          value={row.displayLabel}
                          onChange={e =>
                            updateSubcategoryRow(category, index, { displayLabel: e.target.value })
                          }
                          placeholder="Ej. Restaurantes"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`sub-icon-${row.key}`}>Icono</Label>
                        <SubcategoryIconPicker
                          id={`sub-icon-${row.key}`}
                          value={row.iconValue}
                          accentColor={CATEGORY_THEMES[category].accent}
                          onChange={iconValue => updateSubcategoryRow(category, index, { iconValue })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive sm:mt-6"
                        disabled={(subcategoryForms[category] ?? []).length <= 1}
                        onClick={() => removeSubcategory(category, index)}
                        aria-label="Eliminar subcategoría"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button
              onClick={() => void handleSaveSubcategories()}
              disabled={savingSubcategories || !hasSubcategoryChanges}
            >
              {savingSubcategories ? 'Guardando…' : 'Guardar subcategorías'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
