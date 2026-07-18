import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  CATEGORY_IMAGE_ACCEPT,
  uploadCategoryCover,
  uploadCategoryEmblem,
} from '@/lib/category-image-upload';

type ImageKind = 'cover' | 'emblem';

interface CategoryImageFieldProps {
  kind: ImageKind;
  label: string;
  hint: string;
  value: string;
  defaultValue: string;
  onChange: (url: string) => void;
  previewClassName?: string;
}

export default function CategoryImageField({
  kind,
  label,
  hint,
  value,
  defaultValue,
  onChange,
  previewClassName,
}: CategoryImageFieldProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isCustom = value !== defaultValue;

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({ title: 'Sesión no válida', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const res =
      kind === 'cover'
        ? await uploadCategoryCover(user.id, file)
        : await uploadCategoryEmblem(user.id, file);
    setUploading(false);
    if (res.error || !res.url) {
      toast({ title: 'Error al subir la imagen', description: res.error, variant: 'destructive' });
      return;
    }
    onChange(res.url);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex items-start gap-3">
        <div
          className={
            previewClassName ??
            (kind === 'cover'
              ? 'h-20 w-32 shrink-0 overflow-hidden rounded-md border bg-muted'
              : 'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted')
          }
        >
          <img
            src={value}
            alt=""
            className={kind === 'cover' ? 'h-full w-full object-cover' : 'h-full w-full object-contain p-1'}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1 h-4 w-4" />
            )}
            {uploading ? 'Subiendo…' : 'Subir'}
          </Button>
          {isCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(defaultValue)}
              aria-label="Restaurar imagen por defecto"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Restaurar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={CATEGORY_IMAGE_ACCEPT}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleUpload(file);
        }}
      />
    </div>
  );
}
