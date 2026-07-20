/** Anchos de variante (móvil / tablet / escritorio). */
export const RESPONSIVE_WIDTHS = [480, 768, 1280] as const;

export type ResponsiveWidth = (typeof RESPONSIVE_WIDTHS)[number];

export const CANONICAL_RESPONSIVE_WIDTH: ResponsiveWidth = 1280;

const VARIANT_PATH_RE = /^(.*)-w(\d+)\.(webp|jpe?g|png)$/i;

export type ResponsiveSizesPreset =
  | 'card'
  | 'hero'
  | 'detail'
  | 'mapThumb'
  | 'categoryCover';

export const RESPONSIVE_SIZES: Record<ResponsiveSizesPreset, string> = {
  card: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  hero: '100vw',
  detail: '(min-width: 1024px) 720px, 100vw',
  mapThumb: '96px',
  categoryCover: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
};

export type ResponsiveImageAttrs = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

function splitUrlPath(url: string): { base: string; path: string; search: string; hash: string } | null {
  try {
    // Absolute http(s) URLs
    if (/^https?:\/\//i.test(url)) {
      const parsed = new URL(url);
      return {
        base: `${parsed.origin}`,
        path: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
      };
    }
  } catch {
    return null;
  }

  // Relative / rooted paths (e.g. /categories/foo-640.webp)
  const hashIdx = url.indexOf('#');
  const searchIdx = url.indexOf('?');
  const end =
    hashIdx >= 0 && searchIdx >= 0
      ? Math.min(hashIdx, searchIdx)
      : hashIdx >= 0
        ? hashIdx
        : searchIdx >= 0
          ? searchIdx
          : url.length;
  const path = url.slice(0, end);
  const rest = url.slice(end);
  const hashMatch = rest.match(/#.*$/);
  const searchMatch = rest.match(/\?[^#]*/);
  return {
    base: '',
    path,
    search: searchMatch?.[0] ?? '',
    hash: hashMatch?.[0] ?? '',
  };
}

function joinUrl(parts: { base: string; path: string; search: string; hash: string }): string {
  return `${parts.base}${parts.path}${parts.search}${parts.hash}`;
}

/**
 * Si la URL sigue la convención `{stem}-w{width}.{ext}`, construye srcSet
 * con las variantes conocidas. URLs legacy (sin sufijo) solo devuelven `src`.
 */
export function buildResponsiveImage(
  url: string | null | undefined,
  options?: { sizesPreset?: ResponsiveSizesPreset; sizes?: string },
): ResponsiveImageAttrs {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return { src: '' };

  const sizes = options?.sizes ?? (options?.sizesPreset ? RESPONSIVE_SIZES[options.sizesPreset] : undefined);

  const parts = splitUrlPath(trimmed);
  if (!parts) {
    return { src: trimmed, ...(sizes ? { sizes } : {}) };
  }

  const fileName = parts.path.slice(parts.path.lastIndexOf('/') + 1);
  const dir = parts.path.slice(0, parts.path.length - fileName.length);
  const match = fileName.match(VARIANT_PATH_RE);

  if (!match) {
    return { src: trimmed, ...(sizes ? { sizes } : {}) };
  }

  const stem = match[1];
  const ext = match[3].toLowerCase();

  const srcSet = RESPONSIVE_WIDTHS.map(width => {
    const variantPath = `${dir}${stem}-w${width}.${ext}`;
    return `${joinUrl({ ...parts, path: variantPath })} ${width}w`;
  }).join(', ');

  const canonicalPath = `${dir}${stem}-w${CANONICAL_RESPONSIVE_WIDTH}.${ext}`;
  const src = joinUrl({ ...parts, path: canonicalPath });

  return {
    src,
    srcSet,
    ...(sizes ? { sizes } : {}),
  };
}

/** Construye la cadena srcSet a partir de una URL canónica `-w1280`. */
export function buildSrcSetFromCanonical(canonicalUrl: string): string | undefined {
  return buildResponsiveImage(canonicalUrl).srcSet;
}
