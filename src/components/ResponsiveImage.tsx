import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import {
  buildResponsiveImage,
  type ResponsiveSizesPreset,
} from '@/lib/responsive-image';
import { cn } from '@/lib/utils';

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'>;

export type ResponsiveImageProps = ImgProps & {
  src: string;
  /** srcSet explícito (p. ej. categorías estáticas). Si no, se deriva de la convención -wNNNN. */
  srcSet?: string;
  sizesPreset?: ResponsiveSizesPreset;
  sizes?: string;
  fallbackSrc?: string;
};

export function ResponsiveImage({
  src,
  srcSet: srcSetProp,
  sizesPreset,
  sizes: sizesProp,
  fallbackSrc,
  alt = '',
  className,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...rest
}: ResponsiveImageProps) {
  const built = buildResponsiveImage(src, { sizesPreset, sizes: sizesProp });
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(built.src || src);

  useEffect(() => {
    setFailed(false);
    setCurrentSrc(built.src || src);
  }, [built.src, src]);

  const useFallback = failed && Boolean(fallbackSrc);
  const resolvedSrcSet = useFallback ? undefined : srcSetProp || built.srcSet;
  const resolvedSizes = sizesProp || built.sizes;

  return (
    <img
      {...rest}
      src={useFallback ? fallbackSrc! : currentSrc}
      {...(resolvedSrcSet ? { srcSet: resolvedSrcSet } : {})}
      {...(resolvedSizes && resolvedSrcSet ? { sizes: resolvedSizes } : {})}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn(className)}
      onError={event => {
        if (fallbackSrc && !failed) {
          setFailed(true);
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
