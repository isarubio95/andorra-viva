import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useSiteContent } from '@/contexts/SiteContentContext';
import {
  resolveSubcategoryIcon,
  type ResolvedSubcategoryIcon,
} from '@/constants/subcategory-display';

interface SubcategoryIconProps {
  subcategory: string;
  className?: string;
  /** Color de acento de la categoría. Se aplica a presets y a iconos personalizados. */
  color?: string;
  strokeWidth?: number;
  /** Permite resolver el icono con un mapa concreto (p. ej. previsualización en admin). */
  iconsOverride?: Record<string, string>;
  /** Descriptor ya resuelto (evita leer del contexto). */
  resolved?: ResolvedSubcategoryIcon;
}

function tintedIconStyle(url: string, color: string): CSSProperties {
  return {
    backgroundColor: color,
    WebkitMaskImage: `url("${url}")`,
    maskImage: `url("${url}")`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  };
}

function CustomSubcategoryIcon({
  url,
  color,
  className,
}: {
  url: string;
  color?: string;
  className?: string;
}) {
  if (!color) {
    return (
      <img
        src={url}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className={cn('object-contain', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', className)}
      style={tintedIconStyle(url, color)}
    />
  );
}

export default function SubcategoryIcon({
  subcategory,
  className,
  color,
  strokeWidth = 2,
  iconsOverride,
  resolved,
}: SubcategoryIconProps) {
  const { subcategoryIcons } = useSiteContent();
  const descriptor =
    resolved ?? resolveSubcategoryIcon(subcategory, iconsOverride ?? subcategoryIcons);

  if (descriptor.kind === 'custom') {
    return <CustomSubcategoryIcon url={descriptor.url} color={color} className={className} />;
  }

  const Icon = descriptor.Icon;
  const style: CSSProperties | undefined = color ? { color } : undefined;
  return <Icon className={className} style={style} strokeWidth={strokeWidth} aria-hidden />;
}
