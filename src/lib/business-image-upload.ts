/** Límite del bucket `business-images` en Supabase (5 MiB). */
export const BUSINESS_IMAGE_MAX_BYTES = 5_242_880;

export const BUSINESS_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const BUSINESS_IMAGE_ACCEPT = BUSINESS_IMAGE_MIME_TYPES.join(',');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function hasAllowedImageType(file: File): boolean {
  if (BUSINESS_IMAGE_MIME_TYPES.includes(file.type as (typeof BUSINESS_IMAGE_MIME_TYPES)[number])) {
    return true;
  }
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  return ALLOWED_EXTENSIONS.has(ext);
}

export type BusinessImageRejectionReason = 'size' | 'type';

export function getBusinessImageRejection(file: File): BusinessImageRejectionReason | null {
  if (!hasAllowedImageType(file)) return 'type';
  if (file.size > BUSINESS_IMAGE_MAX_BYTES) return 'size';
  return null;
}

export function filterBusinessImageFiles(files: File[]): {
  accepted: File[];
  oversized: File[];
  invalidType: File[];
} {
  const accepted: File[] = [];
  const oversized: File[] = [];
  const invalidType: File[] = [];

  for (const file of files) {
    const rejection = getBusinessImageRejection(file);
    if (rejection === 'type') invalidType.push(file);
    else if (rejection === 'size') oversized.push(file);
    else accepted.push(file);
  }

  return { accepted, oversized, invalidType };
}
