import fallbackImage from '@/assets/biz-restaurant.jpg';

export const BUSINESS_IMAGE_FALLBACK = fallbackImage;

const SUPABASE_STORAGE_PUBLIC_RE = /\/storage\/v1\/object\/public\/(.+)$/;
const LEGACY_BUCKET_PREFIX = 'business-images/';

const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '');

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

function extractLegacyStoragePath(url: string): string | null {
  const match = url.match(SUPABASE_STORAGE_PUBLIC_RE);
  if (!match?.[1]) return null;
  const objectPath = match[1];
  return objectPath.startsWith(LEGACY_BUCKET_PREFIX)
    ? objectPath.slice(LEGACY_BUCKET_PREFIX.length)
    : objectPath;
}

function rewriteLegacySupabaseUrl(url: string): string | null {
  if (!url.includes('.supabase.co/storage/')) return null;

  const objectPath = extractLegacyStoragePath(url);
  if (!objectPath) return null;

  if (r2PublicUrl) {
    return `${r2PublicUrl}/${objectPath}`;
  }

  if (!supabaseBaseUrl) return null;

  try {
    const parsed = new URL(url);
    if (parsed.host === supabaseHost) return url;
    return `${supabaseBaseUrl}/storage/v1/object/public/${LEGACY_BUCKET_PREFIX}${objectPath}`;
  } catch {
    return url;
  }
}

/** Reescribe URLs antiguas de Supabase Storage a la URL pública de R2. */
export function rewriteSupabaseStorageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return trimmed ?? null;

  if (r2PublicUrl && trimmed.startsWith(`${r2PublicUrl}/`)) {
    return trimmed;
  }

  const legacy = rewriteLegacySupabaseUrl(trimmed);
  if (legacy) return legacy;

  return trimmed;
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
