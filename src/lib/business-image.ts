import fallbackImage from '@/assets/biz-restaurant.jpg';

export const BUSINESS_IMAGE_FALLBACK = fallbackImage;

const supabaseHost = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).host;
  } catch {
    return null;
  }
})();

export function resolveBusinessImageUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed || trimmed.startsWith('https://upload.wikimedia.org/')) {
    return BUSINESS_IMAGE_FALLBACK;
  }

  if (trimmed.includes('.supabase.co/storage/') && supabaseHost) {
    try {
      if (new URL(trimmed).host !== supabaseHost) {
        return BUSINESS_IMAGE_FALLBACK;
      }
    } catch {
      return BUSINESS_IMAGE_FALLBACK;
    }
  }

  return trimmed;
}
