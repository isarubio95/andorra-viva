import { uploadStorageFile } from '@/lib/object-storage';
import {
  BUSINESS_IMAGE_ACCEPT,
  BUSINESS_IMAGE_MAX_BYTES,
  BUSINESS_IMAGE_MIME_TYPES,
  getBusinessImageRejection,
} from '@/lib/business-image-upload';

export const PAGE_BACKGROUND_IMAGE_ACCEPT = BUSINESS_IMAGE_ACCEPT;
export const PAGE_BACKGROUND_IMAGE_MAX_BYTES = BUSINESS_IMAGE_MAX_BYTES;
export const PAGE_BACKGROUND_IMAGE_MIME_TYPES = BUSINESS_IMAGE_MIME_TYPES;

export function getPageBackgroundImageRejection(file: File) {
  return getBusinessImageRejection(file);
}

/** Sube un fondo de página a R2 con variantes responsivas WebP. */
export async function uploadPageBackground(
  userId: string,
  file: File,
): Promise<{ url?: string; srcSet?: string; error?: string }> {
  const rejection = getPageBackgroundImageRejection(file);
  if (rejection === 'type') {
    return { error: 'Formato no válido. Usa JPEG, PNG, WebP o GIF.' };
  }
  if (rejection === 'size') {
    return { error: 'La imagen supera el límite de 5 MB.' };
  }
  return uploadStorageFile(userId, file, { namePrefix: 'page-backgrounds/' });
}
