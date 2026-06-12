import fallbackImage from '@/assets/biz-restaurant.jpg';

export const BUSINESS_IMAGE_FALLBACK = fallbackImage;

const SUPABASE_STORAGE_PUBLIC_RE = /\/storage\/v1\/object\/public\/(.+)$/;

const supabaseBaseUrl = (() => {
  try {
    return import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
  } catch {
    return null;
  }
})();

const supabaseHost = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).host;
  } catch {
    return null;
  }
})();

/** Reescribe URLs de Storage de un proyecto Supabase antiguo al configurado en `.env`. */
export function rewriteSupabaseStorageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !supabaseBaseUrl) return trimmed ?? null;
  if (!trimmed.includes('.supabase.co/storage/')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.host === supabaseHost) return trimmed;

    const match = trimmed.match(SUPABASE_STORAGE_PUBLIC_RE);
    if (!match?.[1]) return trimmed;

    return `${supabaseBaseUrl}/storage/v1/object/public/${match[1]}`;
  } catch {
    return trimmed;
  }
}

export function isLocalPreviewImageUrl(url?: string | null): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('blob:') || trimmed.startsWith('data:');
}

export function resolveBusinessImageUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed || trimmed.startsWith('https://upload.wikimedia.org/')) {
    return BUSINESS_IMAGE_FALLBACK;
  }

  if (isLocalPreviewImageUrl(trimmed)) return trimmed;

  return rewriteSupabaseStorageUrl(trimmed) ?? BUSINESS_IMAGE_FALLBACK;
}
