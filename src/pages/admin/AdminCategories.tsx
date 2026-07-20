import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import AdminShell from '@/pages/admin/AdminShell';
import SubcategoryIconPicker from '@/components/admin/SubcategoryIconPicker';
import CategoryImageField from '@/components/admin/CategoryImageField';
import { saveCategoryConfig, saveSubcategoryConfig } from '@/services/admin-api';
import { useSiteContent } from '@/contexts/SiteContentContext';
import type { SubcategoryConfig } from '@/constants/businessSubcategories';
import {
  resolveCategoryTheme,
  type CategoryThemeOverride,
  type CategoryThemesConfig,
} from '@/constants/categoryDisplay';
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

type CategoryRow = {
  key: string;
  /** Nombre canónico guardado en negocios / BD. */
  name: string;
  displayLabel: string;
  imageUrl: string;
  imageSrcSet?: string;
  emblem: string;
  accent: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  defaultImageUrl: string;
  defaultEmblem: string;
};

function rawIconValue(name: string, icons: Record<string, string>): string {
  const value = icons[name];
  if (value) return value;
  return DEFAULT_SUBCATEGORY_ICONS[name] ?? DEFAULT_SUBCATEGORY_ICON_ID;
}

function rowsFromConfig(
  category: string,
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

function configFromRows(subcategoryForms: Record<string, SubcategoryRow[]>): {
  subcategories: SubcategoryConfig;
  labels: Record<string, string>;
  icons: Record<string, string>;
} {
  const subcategories: SubcategoryConfig = {};
  const labels: Record<string, string> = {};
  const icons: Record<string, string> = {};

  for (const [category, rows] of Object.entries(subcategoryForms)) {
    subcategories[category] = rows.map(row => row.name.trim()).filter(Boolean);
    for (const row of rows) {
      const name = row.name.trim();
      if (!name) continue;
      labels[name] = row.displayLabel.trim() || name;
      icons[name] = row.iconValue;
    }
  }

  return { subcategories, labels, icons };
}

function categoryRowsFromState(
  categories: string[],
  labels: Record<string, string>,
  themes: CategoryThemesConfig,
): CategoryRow[] {
  return categories.map((name, index) => {
    const base = resolveCategoryTheme(name);
    const resolved = resolveCategoryTheme(name, themes[name], labels[name]);
    return {
      key: `${index}-${name}`,
      name,
      displayLabel: resolved.displayLabel,
      imageUrl: resolved.image.src,
      imageSrcSet: resolved.image.srcSet || undefined,
      emblem: resolved.emblem,
      accent: resolved.accent,
      gradientFrom: resolved.gradient.from,
      gradientVia: resolved.gradient.via,
      gradientTo: resolved.gradient.to,
      defaultImageUrl: base.image.src,
      defaultEmblem: base.emblem,
    };
  });
}

function categoryConfigFromRows(rows: CategoryRow[]): {
  categories: string[];
  labels: Record<string, string>;
  themes: CategoryThemesConfig;
} {
  const categories: string[] = [];
  const labels: Record<string, string> = {};
  const themes: CategoryThemesConfig = {};

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    categories.push(name);
    labels[name] = row.displayLabel.trim() || name;

    const base = resolveCategoryTheme(name);
    const override: CategoryThemeOverride = {
      displayLabel: labels[name],
      imageUrl: row.imageUrl,
      ...(row.imageSrcSet && row.imageUrl !== base.image.src
        ? { imageSrcSet: row.imageSrcSet }
        : {}),
      emblem: row.emblem,
      accent: row.accent,
      gradient: {
        from: row.gradientFrom,
        via: row.gradientVia,
        to: row.gradientTo,
      },
    };

    // Solo persistir si hay algo distinto del default estático.
    const differs =
      override.imageUrl !== base.image.src ||
      Boolean(override.imageSrcSet) ||
      override.emblem !== base.emblem ||
      override.accent !== base.accent ||
      override.gradient?.from !== base.gradient.from ||
      override.gradient?.via !== base.gradient.via ||
      override.gradient?.to !== base.gradient.to ||
      labels[name] !== base.displayLabel;

    if (differs) {
      themes[name] = override;
    }
  }

  return { categories, labels, themes };
}

function AccentColorHint({ accent }: { accent: string }) {
  const [copied, setCopied] = useState(false);

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
    categories,
    categoryLabels,
    categoryThemes,
    subcategories,
    subcategoryLabels,
    subcategoryIcons,
    refresh,
  } = useSiteContent();

  const [categoryForms, setCategoryForms] = useState<CategoryRow[]>(() =>
    categoryRowsFromState(categories, categoryLabels, categoryThemes),
  );
  const [subcategoryForms, setSubcategoryForms] = useState<Record<string, SubcategoryRow[]>>(() =>
    Object.fromEntries(
      categories.map(cat => [
        cat,
        rowsFromConfig(cat, subcategories, subcategoryLabels, subcategoryIcons),
      ]),
    ),
  );
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingSubcategories, setSavingSubcategories] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCategoryForms(categoryRowsFromState(categories, categoryLabels, categoryThemes));
  }, [categories, categoryLabels, categoryThemes]);

  useEffect(() => {
    setSubcategoryForms(
      Object.fromEntries(
        categories.map(cat => [
          cat,
          rowsFromConfig(cat, subcategories, subcategoryLabels, subcategoryIcons),
        ]),
      ),
    );
  }, [categories, subcategories, subcategoryLabels, subcategoryIcons]);

  const savedCategorySnapshot = useMemo(
    () => categoryConfigFromRows(categoryRowsFromState(categories, categoryLabels, categoryThemes)),
    [categories, categoryLabels, categoryThemes],
  );

  const hasCategoryChanges = useMemo(() => {
    const current = categoryConfigFromRows(categoryForms);
    if (current.categories.length !== savedCategorySnapshot.categories.length) return true;
    if (current.categories.some((c, i) => c !== savedCategorySnapshot.categories[i])) return true;
    for (const name of current.categories) {
      if ((current.labels[name] ?? name) !== (savedCategorySnapshot.labels[name] ?? name)) return true;
      const a = current.themes[name];
      const b = savedCategorySnapshot.themes[name];
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) return true;
    }
    return false;
  }, [categoryForms, savedCategorySnapshot]);

  const categoryNames = useMemo(
    () => categoryForms.map(r => r.name.trim()).filter(Boolean),
    [categoryForms],
  );

  const hasSubcategoryChanges = useMemo(() => {
    const current = configFromRows(subcategoryForms);
    for (const category of categoryNames) {
      const saved = subcategories[category] ?? [];
      const edited = current.subcategories[category] ?? [];
      if (saved.length !== edited.length || saved.some((s, i) => s !== edited[i])) return true;
      for (const name of edited) {
        if ((subcategoryLabels[name] ?? name) !== (current.labels[name] ?? name)) return true;
        if (rawIconValue(name, subcategoryIcons) !== current.icons[name]) return true;
      }
    }
    return false;
  }, [subcategoryForms, subcategories, subcategoryLabels, subcategoryIcons, categoryNames]);

  const updateCategoryRow = (index: number, patch: Partial<CategoryRow>) => {
    setCategoryForms(prev => {
      const rows = [...prev];
      const prevName = rows[index].name;
      rows[index] = { ...rows[index], ...patch };
      return rows;
    });

    if (patch.name !== undefined) {
      setSubcategoryForms(subs => {
        const prevName = categoryForms[index]?.name;
        if (!prevName || patch.name === prevName || !subs[prevName] || subs[patch.name!]) {
          return subs;
        }
        const next = { ...subs };
        next[patch.name!] = next[prevName];
        delete next[prevName];
        return next;
      });
    }
  };

  const addCategory = () => {
    const stamp = Date.now();
    const name = `Nueva categoría ${stamp.toString().slice(-4)}`;
    const base = resolveCategoryTheme(name);
    setCategoryForms(prev => [
      ...prev,
      {
        key: `new-${stamp}`,
        name,
        displayLabel: name,
        imageUrl: base.image.src,
        emblem: base.emblem,
        accent: base.accent,
        gradientFrom: base.gradient.from,
        gradientVia: base.gradient.via,
        gradientTo: base.gradient.to,
        defaultImageUrl: base.image.src,
        defaultEmblem: base.emblem,
      },
    ]);
    setSubcategoryForms(prev => ({
      ...prev,
      [name]: [
        {
          key: `${name}-new`,
          name: 'General',
          displayLabel: 'General',
          iconValue: DEFAULT_SUBCATEGORY_ICON_ID,
        },
      ],
    }));
  };

  const removeCategory = (index: number) => {
    const row = categoryForms[index];
    if (!row) return;
    if (categoryForms.length <= 1) {
      toast({
        title: 'No se puede eliminar',
        description: 'Debe quedar al menos una categoría.',
        variant: 'destructive',
      });
      return;
    }
    setCategoryForms(prev => prev.filter((_, i) => i !== index));
    setSubcategoryForms(prev => {
      const next = { ...prev };
      delete next[row.name];
      return next;
    });
  };

  const handleSaveCategories = async () => {
    const { categories: nextCategories, labels, themes } = categoryConfigFromRows(categoryForms);

    if (nextCategories.length === 0) {
      toast({
        title: 'Categorías incompletas',
        description: 'Debe haber al menos una categoría.',
        variant: 'destructive',
      });
      return;
    }
    const unique = new Set(nextCategories);
    if (unique.size !== nextCategories.length) {
      toast({
        title: 'Nombres duplicados',
        description: 'Hay categorías con el mismo nombre interno.',
        variant: 'destructive',
      });
      return;
    }
    if (nextCategories.some(c => !c.trim())) {
      toast({
        title: 'Nombre vacío',
        description: 'Todas las categorías necesitan un nombre interno.',
        variant: 'destructive',
      });
      return;
    }

    setSavingCategories(true);
    const res = await saveCategoryConfig(nextCategories, labels, themes);
    if (!res.ok) {
      setSavingCategories(false);
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }

    // Asegurar subcategorías para categorías nuevas / renombradas.
    const { subcategories: nextSubs, labels: subLabels, icons } = configFromRows(subcategoryForms);
    const alignedSubs: SubcategoryConfig = {};
    for (const cat of nextCategories) {
      alignedSubs[cat] =
        nextSubs[cat]?.length > 0 ? nextSubs[cat] : ['General'];
    }
    const subRes = await saveSubcategoryConfig(alignedSubs, subLabels, icons);
    setSavingCategories(false);
    if (!subRes.ok) {
      toast({
        title: 'Categorías guardadas, error en subcategorías',
        description: subRes.error,
        variant: 'destructive',
      });
      await refresh();
      return;
    }

    await refresh();
    toast({ title: 'Categorías actualizadas' });
  };

  const handleSaveSubcategories = async () => {
    const { subcategories: nextSubcategories, labels, icons } = configFromRows(subcategoryForms);

    for (const category of categoryNames) {
      const names = nextSubcategories[category] ?? [];
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
    category: string,
    index: number,
    patch: Partial<SubcategoryRow>,
  ) => {
    setSubcategoryForms(prev => {
      const rows = [...(prev[category] ?? [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, [category]: rows };
    });
  };

  const addSubcategory = (category: string) => {
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

  const removeSubcategory = (category: string, index: number) => {
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
            de negocios. También puedes editar la foto de fondo y el emblema de cada categoría.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Añade, renombra o elimina categorías. El nombre interno se guarda en los negocios;
                la etiqueta visible es la que ve el usuario. Si renombras el nombre interno, los
                negocios ya registrados conservarán el valor anterior.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCategory}>
              <Plus className="mr-1 h-4 w-4" />
              Añadir categoría
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {categoryForms.map((row, index) => (
              <div key={row.key} className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{row.displayLabel || row.name || 'Sin nombre'}</h3>
                    <AccentColorHint accent={row.accent} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={categoryForms.length <= 1}
                    onClick={() => removeCategory(index)}
                    aria-label="Eliminar categoría"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`cat-name-${row.key}`}>Nombre interno</Label>
                    <Input
                      id={`cat-name-${row.key}`}
                      value={row.name}
                      onChange={e => updateCategoryRow(index, { name: e.target.value })}
                      placeholder="Ej. Gastronomía"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`cat-label-${row.key}`}>Etiqueta visible</Label>
                    <Input
                      id={`cat-label-${row.key}`}
                      value={row.displayLabel}
                      onChange={e => updateCategoryRow(index, { displayLabel: e.target.value })}
                      placeholder="Ej. Dónde comer"
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <CategoryImageField
                    kind="cover"
                    label="Foto de fondo / portada"
                    hint="Imagen de fondo de la tarjeta en la home (JPEG, PNG o WebP, máx. 5 MB)."
                    value={row.imageUrl}
                    defaultValue={row.defaultImageUrl}
                    onChange={({ url, srcSet }) =>
                      updateCategoryRow(index, {
                        imageUrl: url,
                        imageSrcSet: srcSet,
                      })
                    }
                  />
                  <CategoryImageField
                    kind="emblem"
                    label="Emblema"
                    hint="Icono circular sobre la foto (PNG transparente recomendado, máx. 5 MB)."
                    value={row.emblem}
                    defaultValue={row.defaultEmblem}
                    onChange={({ url }) => updateCategoryRow(index, { emblem: url })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor={`cat-accent-${row.key}`}>Color de acento</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`cat-accent-${row.key}`}
                        type="color"
                        className="h-9 w-12 cursor-pointer p-1"
                        value={row.accent}
                        onChange={e => updateCategoryRow(index, { accent: e.target.value })}
                      />
                      <Input
                        value={row.accent}
                        onChange={e => updateCategoryRow(index, { accent: e.target.value })}
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`cat-from-${row.key}`}>Gradiente (inicio)</Label>
                    <Input
                      id={`cat-from-${row.key}`}
                      type="color"
                      className="h-9 cursor-pointer p-1"
                      value={row.gradientFrom}
                      onChange={e => updateCategoryRow(index, { gradientFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`cat-via-${row.key}`}>Gradiente (medio)</Label>
                    <Input
                      id={`cat-via-${row.key}`}
                      type="color"
                      className="h-9 cursor-pointer p-1"
                      value={row.gradientVia}
                      onChange={e => updateCategoryRow(index, { gradientVia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`cat-to-${row.key}`}>Gradiente (fin)</Label>
                    <Input
                      id={`cat-to-${row.key}`}
                      type="color"
                      className="h-9 cursor-pointer p-1"
                      value={row.gradientTo}
                      onChange={e => updateCategoryRow(index, { gradientTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={() => void handleSaveCategories()}
              disabled={savingCategories || !hasCategoryChanges}
            >
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
                  oscuro). Se pintará automáticamente con el color de acento de la categoría.
                </li>
              </ul>
            </div>

            {categoryNames.map(category => {
              const catRow = categoryForms.find(r => r.name.trim() === category);
              const accent = catRow?.accent ?? '#475569';
              return (
                <div key={category} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{category}</h3>
                      <AccentColorHint accent={accent} />
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
                              updateSubcategoryRow(category, index, {
                                displayLabel: e.target.value,
                              })
                            }
                            placeholder="Ej. Restaurantes"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`sub-icon-${row.key}`}>Icono</Label>
                          <SubcategoryIconPicker
                            id={`sub-icon-${row.key}`}
                            value={row.iconValue}
                            accentColor={accent}
                            onChange={iconValue =>
                              updateSubcategoryRow(category, index, { iconValue })
                            }
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
              );
            })}

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
