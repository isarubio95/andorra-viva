import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LOGO_ASPECT = 345 / 192;

const LOGO_SIZES = {
  xs: {
    src: '/logo-xs.png',
    srcSet: '/logo-xs.png 1x, /logo-sm.png 2x',
    height: 40,
    className: 'h-8',
  },
  sm: {
    src: '/logo-sm.png',
    srcSet: '/logo-sm.png 1x, /logo-md.png 2x',
    height: 64,
    className: 'h-10',
  },
  md: {
    src: '/logo-md.png',
    srcSet: '/logo-md.png 1x, /logo.png 2x',
    height: 128,
    className: 'h-14 sm:h-16',
  },
  lg: {
    src: '/logo.png',
    srcSet: '/logo.png 1x, /logo.png 2x',
    height: 192,
    className: 'h-20',
  },
} as const;

type AppLogoSize = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  asLink?: boolean;
  priority?: boolean;
}

export function AppLogo({
  size = 'xs',
  className,
  asLink = false,
  priority = false,
}: AppLogoProps) {
  const config = LOGO_SIZES[size];
  const width = Math.round(config.height * LOGO_ASPECT);

  const img = (
    <img
      src={config.src}
      srcSet={config.srcSet}
      alt="Andorra Viva"
      width={width}
      height={config.height}
      className={cn('w-auto object-contain', config.className, className)}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchpriority: 'high' as const } : {})}
    />
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
