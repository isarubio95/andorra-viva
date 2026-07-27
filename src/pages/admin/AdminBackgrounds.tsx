import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { RgbaColorPicker, type RgbaColor } from 'react-colorful';
import AdminShell from '@/pages/admin/AdminShell';
import PageBackgroundPreview from '@/components/admin/PageBackgroundPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_PAGE_BACKGROUND,
  PAGE_BACKGROUND_IDS,
  PAGE_BACKGROUND_LABELS,
  getPageBackground,
  pageBackgroundsEqual,
  type PageBackground,
  type PageBackgroundId,
  type PageBackgroundMode,
  type PageBackgroundsConfig,
} from '@/constants/page-backgrounds';
import {
  PAGE_BACKGROUND_IMAGE_ACCEPT,
  uploadPageBackground,
} from '@/lib/page-background-upload';
import { savePageBackgrounds } from '@/services/admin-api';
import { cn } from '@/lib/utils';

const DEFAULT_RGBA: RgbaColor = { r: 240, g: 242, b: 238, a: 1 };

function rgbaToCss(color: RgbaColor): string {
  const a = Math.round(color.a * 1000) / 1000;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
}

function parseRgba(value: string): RgbaColor | null {
  const match = value
    .trim()
    .match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([01](?:\.\d+)?|\.\d+))?\s*\)$/i,
    );
  if (!match) return null;
  const r = Math.min(255, Number(match[1]));
  const g = Math.min(255, Number(match[2]));
  const b = Math.min(255, Number(match[3]));
  const a = match[4] !== undefined ? Math.min(1, Math.max(0, Number(match[4]))) : 1;
  if ([r, g, b, a].some(n => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function CurrentBackgroundBadge({ background }: { background: PageBackground }) {
  if (background.mode === 'color') {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="h-4 w-4 rounded border border-border"
          style={{ backgroundColor: background.color }}
          aria-hidden
        />
        Color
      </span>
    );
  }
  if (background.mode === 'image') {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-4 w-6 overflow-hidden rounded border border-border">
          <img src={background.imageUrl} alt="" className="h-full w-full object-cover" />
        </span>
        Imagen
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Predeterminado</span>;
}

function draftFromBackground(bg: PageBackground): {
  mode: PageBackgroundMode;
  color: RgbaColor;
  imageUrl: string;
  imageSrcSet: string;
} {
  if (bg.mode === 'color') {
    return {
      mode: 'color',
      color: parseRgba(bg.color) ?? DEFAULT_RGBA,
      imageUrl: '',
      imageSrcSet: '',
    };
  }
  if (bg.mode === 'image') {
    return {
      mode: 'image',
      color: DEFAULT_RGBA,
      imageUrl: bg.imageUrl,
      imageSrcSet: bg.imageSrcSet ?? '',
    };
  }
  return { mode: 'default', color: DEFAULT_RGBA, imageUrl: '', imageSrcSet: '' };
}

function buildDraftBackground(
  mode: PageBackgroundMode,
  color: RgbaColor,
  imageUrl: string,
  imageSrcSet: string,
): PageBackground {
  if (mode === 'color') return { mode: 'color', color: rgbaToCss(color) };
  if (mode === 'image') {
    if (!imageUrl) return { mode: 'default' };
    return {
      mode: 'image',
      imageUrl,
      ...(imageSrcSet ? { imageSrcSet } : {}),
    };
  }
  return { mode: 'default' };
}

export default function AdminBackgrounds() {
  const { user } = useAuth();
  const { pageBackgrounds, refresh } = useSiteContent();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<PageBackgroundId[]>(['home']);
  const [mode, setMode] = useState<PageBackgroundMode>('default');
  const [color, setColor] = useState<RgbaColor>(DEFAULT_RGBA);
  const [imageUrl, setImageUrl] = useState('');
  const [imageSrcSet, setImageSrcSet] = useState('');
  const [previewPageId, setPreviewPageId] = useState<PageBackgroundId>('home');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const primarySelectedId = selectedIds[0] ?? null;

  useEffect(() => {
    if (!primarySelectedId) return;
    const draft = draftFromBackground(getPageBackground(primarySelectedId, pageBackgrounds));
    setMode(draft.mode);
    setColor(draft.color);
    setImageUrl(draft.imageUrl);
    setImageSrcSet(draft.imageSrcSet);
  }, [primarySelectedId, pageBackgrounds]);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    setPreviewPageId(prev => (selectedIds.includes(prev) ? prev : selectedIds[0]));
  }, [selectedIds]);

  const draftBackground = useMemo(
    () => buildDraftBackground(mode, color, imageUrl, imageSrcSet),
    [mode, color, imageUrl, imageSrcSet],
  );

  const hasChanges = useMemo(() => {
    if (selectedIds.length === 0) return false;
    return selectedIds.some(
      id => !pageBackgroundsEqual(getPageBackground(id, pageBackgrounds), draftBackground),
    );
  }, [selectedIds, pageBackgrounds, draftBackground]);

  const togglePage = (id: PageBackgroundId, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) return PAGE_BACKGROUND_IDS.filter(pageId => prev.includes(pageId) || pageId === id);
      return prev.filter(pageId => pageId !== id);
    });
  };

  const selectAll = () => setSelectedIds([...PAGE_BACKGROUND_IDS]);
  const clearSelection = () => setSelectedIds([]);

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({ title: 'Sesión no válida', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const res = await uploadPageBackground(user.id, file);
    setUploading(false);
    if (res.error || !res.url) {
      toast({ title: 'Error al subir la imagen', description: res.error, variant: 'destructive' });
      return;
    }
    setMode('image');
    setImageUrl(res.url);
    setImageSrcSet(res.srcSet ?? '');
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Selecciona al menos una página', variant: 'destructive' });
      return;
    }
    if (mode === 'image' && !imageUrl) {
      toast({
        title: 'Falta la imagen',
        description: 'Sube una imagen o elige otro modo de fondo.',
        variant: 'destructive',
      });
      return;
    }

    const next: PageBackgroundsConfig = { ...pageBackgrounds };
    for (const id of selectedIds) {
      next[id] = draftBackground;
    }

    setSaving(true);
    const res = await savePageBackgrounds(next);
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({
      title: 'Fondos actualizados',
      description:
        selectedIds.length === 1
          ? `Se actualizó ${PAGE_BACKGROUND_LABELS[selectedIds[0]]}.`
          : `Se actualizaron ${selectedIds.length} páginas.`,
    });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Fondos</h2>
          <p className="text-muted-foreground">
            Configura el fondo de cada página. Puedes marcar varias páginas para aplicar el mismo
            fondo a la vez. El color y la imagen son opciones alternativas.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Páginas</CardTitle>
                    <CardDescription>
                      Marca las páginas a las que aplicarás el fondo del editor.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                      Todas
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                      Ninguna
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {PAGE_BACKGROUND_IDS.map(id => {
                  const checked = selectedIds.includes(id);
                  const current = getPageBackground(id, pageBackgrounds);
                  return (
                    <label
                      key={id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                        checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={value => togglePage(id, value === true)}
                          aria-label={`Seleccionar ${PAGE_BACKGROUND_LABELS[id]}`}
                        />
                        <span className="text-sm font-medium">{PAGE_BACKGROUND_LABELS[id]}</span>
                      </span>
                      <CurrentBackgroundBadge background={current} />
                    </label>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editor</CardTitle>
                <CardDescription>
                  {selectedIds.length === 0
                    ? 'Selecciona una o más páginas para editar su fondo.'
                    : selectedIds.length === 1
                      ? `Editando ${PAGE_BACKGROUND_LABELS[selectedIds[0]]}.`
                      : `Editando ${selectedIds.length} páginas a la vez.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={mode}
                  onValueChange={value => setMode(value as PageBackgroundMode)}
                  className="grid gap-3 sm:grid-cols-3"
                  disabled={selectedIds.length === 0}
                >
                  {(
                    [
                      ['default', 'Predeterminado'],
                      ['color', 'Color'],
                      ['image', 'Imagen'],
                    ] as const
                  ).map(([value, label]) => (
                    <Label
                      key={value}
                      htmlFor={`bg-mode-${value}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium',
                        mode === value ? 'border-primary bg-primary/5' : 'border-border',
                        selectedIds.length === 0 && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <RadioGroupItem id={`bg-mode-${value}`} value={value} />
                      {label}
                    </Label>
                  ))}
                </RadioGroup>

                {mode === 'color' && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <RgbaColorPicker color={color} onChange={setColor} className="!w-full max-w-[240px]" />
                      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                        {(
                          [
                            ['r', 'R', 0, 255],
                            ['g', 'G', 0, 255],
                            ['b', 'B', 0, 255],
                            ['a', 'A', 0, 1],
                          ] as const
                        ).map(([key, label, min, max]) => (
                          <div key={key} className="space-y-1.5">
                            <Label htmlFor={`rgba-${key}`}>{label}</Label>
                            <Input
                              id={`rgba-${key}`}
                              type="number"
                              min={min}
                              max={max}
                              step={key === 'a' ? 0.01 : 1}
                              value={key === 'a' ? color.a : color[key]}
                              onChange={e => {
                                const raw = Number(e.target.value);
                                if (Number.isNaN(raw)) return;
                                const next =
                                  key === 'a'
                                    ? Math.min(1, Math.max(0, raw))
                                    : Math.min(255, Math.max(0, Math.round(raw)));
                                setColor(prev => ({ ...prev, [key]: next }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-10 w-10 rounded-md border border-border"
                        style={{ backgroundColor: rgbaToCss(color) }}
                        aria-hidden
                      />
                      <code className="rounded bg-muted px-2 py-1 text-xs">{rgbaToCss(color)}</code>
                    </div>
                  </div>
                )}

                {mode === 'image' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP o GIF (máx. 5 MB). Se optimiza a WebP responsivo igual que las
                      fotos de negocios.
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="h-24 w-40 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading || selectedIds.length === 0}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <ImagePlus className="mr-1 h-4 w-4" />
                          )}
                          {uploading ? 'Subiendo…' : 'Subir fondo'}
                        </Button>
                        {imageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setImageUrl('');
                              setImageSrcSet('');
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Quitar
                          </Button>
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PAGE_BACKGROUND_IMAGE_ACCEPT}
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleUpload(file);
                      }}
                    />
                  </div>
                )}

                {mode === 'default' && (
                  <p className="text-sm text-muted-foreground">
                    Se usará el fondo por defecto de la web (gradientes actuales).
                  </p>
                )}

                <Button
                  onClick={() => void handleSave()}
                  disabled={saving || !hasChanges || selectedIds.length === 0}
                >
                  {saving ? 'Guardando…' : 'Guardar fondos'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Previsualización</CardTitle>
              <CardDescription>
                Página real renderizada en el panel. El fondo del borrador se aplica al instante sin
                guardar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Selecciona páginas para ver la previsualización.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {selectedIds.map(id => (
                      <Button
                        key={id}
                        type="button"
                        size="sm"
                        variant={previewPageId === id ? 'default' : 'outline'}
                        onClick={() => setPreviewPageId(id)}
                      >
                        {PAGE_BACKGROUND_LABELS[id]}
                      </Button>
                    ))}
                  </div>
                  <PageBackgroundPreview
                    pageId={previewPageId}
                    background={
                      mode === 'image' && !imageUrl ? DEFAULT_PAGE_BACKGROUND : draftBackground
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
