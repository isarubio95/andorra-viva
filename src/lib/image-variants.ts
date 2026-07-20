import {
  CANONICAL_RESPONSIVE_WIDTH,
  RESPONSIVE_WIDTHS,
  type ResponsiveWidth,
} from '@/lib/responsive-image';

const WEBP_QUALITY = 0.82;

export type ImageVariantFile = {
  width: ResponsiveWidth;
  file: File;
};

export type CreateImageVariantsResult =
  | { kind: 'variants'; variants: ImageVariantFile[]; stem: string }
  | { kind: 'single'; file: File };

function isGif(file: File): boolean {
  if (file.type === 'image/gif') return true;
  return file.name.toLowerCase().endsWith('.gif');
}

function isSvg(file: File): boolean {
  if (file.type === 'image/svg+xml') return true;
  return file.name.toLowerCase().endsWith('.svg');
}

function supportsWebpEncoding(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function loadBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/webp', WEBP_QUALITY);
  });
}

function randomStem(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Genera variantes WebP a 480 / 768 / 1280.
 * GIF y SVG se devuelven sin variantes. Si el navegador no puede
 * codificar WebP, se sube el original una sola vez.
 */
export async function createImageVariants(file: File): Promise<CreateImageVariantsResult> {
  if (isGif(file) || isSvg(file) || !supportsWebpEncoding()) {
    return { kind: 'single', file };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return { kind: 'single', file };
  }

  const stem = randomStem();
  const variants: ImageVariantFile[] = [];

  try {
    for (const width of RESPONSIVE_WIDTHS) {
      const targetWidth = Math.min(width, bitmap.width);
      const scale = targetWidth / bitmap.width;
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return { kind: 'single', file };
      }
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const blob = await canvasToWebpBlob(canvas);
      if (!blob) {
        return { kind: 'single', file };
      }

      variants.push({
        width,
        file: new File([blob], `${stem}-w${width}.webp`, { type: 'image/webp' }),
      });
    }
  } finally {
    bitmap.close();
  }

  if (variants.length !== RESPONSIVE_WIDTHS.length) {
    return { kind: 'single', file };
  }

  // Garantiza que exista la canónica aunque la imagen original sea más estrecha
  const hasCanonical = variants.some(v => v.width === CANONICAL_RESPONSIVE_WIDTH);
  if (!hasCanonical) {
    return { kind: 'single', file };
  }

  return { kind: 'variants', variants, stem };
}
