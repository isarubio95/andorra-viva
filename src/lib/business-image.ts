import fallbackImage from '@/assets/biz-restaurant.jpg';

export const BUSINESS_IMAGE_FALLBACK = fallbackImage;

export function resolveBusinessImageUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed || trimmed.startsWith('https://upload.wikimedia.org/')) {
    return BUSINESS_IMAGE_FALLBACK;
  }
  return trimmed;
}
