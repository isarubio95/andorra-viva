import { uploadStorageFile } from '@/lib/object-storage';
import {
  BUSINESS_IMAGE_ACCEPT,
  BUSINESS_IMAGE_MAX_BYTES,
  BUSINESS_IMAGE_MIME_TYPES,
  getBusinessImageRejection,
} from '@/lib/business-image-upload';

export const CATEGORY_IMAGE_ACCEPT = BUSINESS_IMAGE_ACCEPT;
export const CATEGORY_IMAGE_MAX_BYTES = BUSINESS_IMAGE_MAX_BYTES;
export const CATEGORY_IMAGE_MIME_TYPES = BUSINESS_IMAGE_MIME_TYPES;

export function getCategoryImageRejection(file: File) {
  return getBusinessImageRejection(file);
}

/** Sube la foto de fondo (portada) de una categoría. */
export async function uploadCategoryCover(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const rejection = getCategoryImageRejection(file);
  if (rejection === 'type') {
    return { error: 'Formato no válido. Usa JPEG, PNG, WebP o GIF.' };
  }
  if (rejection === 'size') {
    return { error: 'La imagen supera el límite de 5 MB.' };
  }
  return uploadStorageFile(userId, file, { namePrefix: 'category-covers/' });
}

/** Sube el emblema (imagen circular) de una categoría. */
export async function uploadCategoryEmblem(
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const rejection = getCategoryImageRejection(file);
  if (rejection === 'type') {
    return { error: 'Formato no válido. Usa JPEG, PNG, WebP o GIF.' };
  }
  if (rejection === 'size') {
    return { error: 'La imagen supera el límite de 5 MB.' };
  }
  return uploadStorageFile(userId, file, { namePrefix: 'category-emblems/' });
}
