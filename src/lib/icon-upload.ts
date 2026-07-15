import { uploadStorageFile } from '@/lib/object-storage';

/** Límite para iconos personalizados de subcategoría (256 KiB). */
export const ICON_MAX_BYTES = 262_144;

export const ICON_MIME_TYPES = ['image/svg+xml', 'image/png', 'image/webp'] as const;

export const ICON_ACCEPT = '.svg,.png,.webp,image/svg+xml,image/png,image/webp';

const ALLOWED_EXTENSIONS = new Set(['.svg', '.png', '.webp']);

function hasAllowedIconType(file: File): boolean {
  if (ICON_MIME_TYPES.includes(file.type as (typeof ICON_MIME_TYPES)[number])) return true;
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  return ALLOWED_EXTENSIONS.has(ext);
}

export type IconRejectionReason = 'size' | 'type';

export function getIconRejection(file: File): IconRejectionReason | null {
  if (!hasAllowedIconType(file)) return 'type';
  if (file.size > ICON_MAX_BYTES) return 'size';
  return null;
}

export async function uploadSubcategoryIcon(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const rejection = getIconRejection(file);
  if (rejection === 'type') {
    return { error: 'Formato no válido. Usa SVG, PNG o WebP.' };
  }
  if (rejection === 'size') {
    return { error: 'El icono supera el límite de 256 KB.' };
  }
  return uploadStorageFile(userId, file, { namePrefix: 'subcategory-icons/' });
}
