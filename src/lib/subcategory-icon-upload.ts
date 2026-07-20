import { SUBCATEGORY_ICON_MAX_BYTES } from '@/constants/subcategory-icon-guidelines';
import { uploadBusinessImage } from '@/lib/object-storage';

const ALLOWED_TYPES = new Set(['image/png', 'image/webp', 'image/svg+xml']);

export function validateSubcategoryIconFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Formato no válido. Usa PNG, WebP o SVG con fondo transparente.';
  }
  if (file.size > SUBCATEGORY_ICON_MAX_BYTES) {
    return `El archivo supera ${SUBCATEGORY_ICON_MAX_BYTES / 1024} KB.`;
  }
  return null;
}

export async function uploadSubcategoryIcon(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const validationError = validateSubcategoryIconFile(file);
  if (validationError) return { error: validationError };
  return uploadBusinessImage(userId, file, { namePrefix: 'subcat-icon-', variants: false });
}
