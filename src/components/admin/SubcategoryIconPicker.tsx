import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RotateCcw } from 'lucide-react';
import SubcategoryIcon from '@/components/SubcategoryIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ICON_ACCEPT, uploadSubcategoryIcon } from '@/lib/icon-upload';
import {
  DEFAULT_SUBCATEGORY_ICON_ID,
  SUBCATEGORY_ICON_OPTIONS,
  getSubcategoryIconOption,
  isCustomIconValue,
  type SubcategoryIconId,
} from '@/constants/subcategory-display';

interface SubcategoryIconPickerProps {
  /** Preset id (p. ej. "wine") o URL de un icono personalizado. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** Color de acento de la categoría, usado para previsualizar el preset. */
  accentColor?: string;
}

export default function SubcategoryIconPicker({
  value,
  onChange,
  id,
  accentColor,
}: SubcategoryIconPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isCustom = isCustomIconValue(value);
  const presetId: SubcategoryIconId =
    !isCustom && SUBCATEGORY_ICON_OPTIONS.some(o => o.id === value)
      ? (value as SubcategoryIconId)
      : DEFAULT_SUBCATEGORY_ICON_ID;
  const presetOption = getSubcategoryIconOption(presetId);
  const PresetIcon = presetOption.Icon;

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({ title: 'Sesión no válida', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const res = await uploadSubcategoryIcon(user.id, file);
    setUploading(false);
    if (res.error || !res.url) {
      toast({ title: 'Error al subir el icono', description: res.error, variant: 'destructive' });
      return;
    }
    onChange(res.url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          {isCustom ? (
            <SubcategoryIcon
              subcategory="__preview__"
              resolved={{ kind: 'custom', url: value }}
              color={accentColor}
              className="h-5 w-5"
            />
          ) : (
            <PresetIcon className="h-5 w-5" style={accentColor ? { color: accentColor } : undefined} aria-hidden />
          )}
        </span>

        {isCustom ? (
          <div className="flex flex-1 items-center gap-1">
            <span className="flex-1 truncate text-xs text-muted-foreground">Icono personalizado</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Volver a icono de la biblioteca"
              onClick={() => onChange(DEFAULT_SUBCATEGORY_ICON_ID)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Select value={presetId} onValueChange={v => onChange(v)}>
            <SelectTrigger id={id} className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {SUBCATEGORY_ICON_OPTIONS.map(option => {
                const Icon = option.Icon;
                return (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ICON_ACCEPT}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Subiendo…
          </>
        ) : (
          <>
            <ImagePlus className="mr-1 h-4 w-4" />
            Subir icono
          </>
        )}
      </Button>
    </div>
  );
}
